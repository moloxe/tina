const vertShader = `#version 300 es
in vec3 aPosition;
out vec2 uv;
void main() {
  uv = aPosition.xy;
  gl_Position = vec4(uv * 2.0 - 1.0, 0., 1.0);
  uv.y = 1. - uv.y;
}`

function FragBuilder(tina) {
  this.mainContent = ``
  this.head = ``
  this.getFrag = () => {
    const nMaterials = tina.materials.length
    const nPointLights = tina.pointLights.length
    const shaders = []
    if (nMaterials > 0) {
      shaders.push(buildMaterials(nMaterials))
      shaders.push(buildRaymarch(tina.materials))
      shaders.push(buildLights(nPointLights))
      shaders.push(TINA_RAYMARCH_SCENE)
      if (!this.mainContent) this.mainContent = `fragColor = calcScene().color;`
    }
    return `#version 300 es
    precision mediump float;

    ${tina.useInterlacing ? '#define USE_INTERLACING' : ''}

    ${TINA_COMMON}

    in vec2 uv;
    uniform float time;
    uniform int frameCount;
    uniform float width;
    uniform float height;
    out vec4 fragColor;

    ${shaders.join('\n')}

    ${this.head}

    void main() {
      ${this.mainContent}
    }
  `
  }
}

function Tina(width, height, { useInterlacing } = {}) {
  this.width = width
  this.height = height
  this.useInterlacing = useInterlacing
  this.materials = []
  this.pointLights = []
  this.pos = [0, 0, 0]
  this.spherical = [0, 0, 0]
  this.fov = 90

  const graphics = createGraphics(this.width, this.height, WEBGL)
  graphics.pixelDensity(1)

  this.resize = (width, height) => {
    this.width = width
    this.height = height
    graphics.resizeCanvas(width, height)
  }

  this.shader
  this.build = (content = '') => {
    if (!content.includes('---')) content = `---${content}`
    const [head, mainContent] = content.split('---')

    const fragBuilder = new FragBuilder(this)
    fragBuilder.head = head
    fragBuilder.mainContent = mainContent
    const fragShader = fragBuilder.getFrag()

    this.shader = createShader(vertShader, fragShader)

    graphics.shader(this.shader)
    graphics.background(0)
  }
  this.frameCount = 0
  this.update = (uniforms = {}) => {
    if (!this.shader) throw new Error('Missed build: call Tina.build()')

    uniforms = { ...uniforms, ...this.getUniforms() }

    Object.entries(uniforms).forEach(([uniform, value]) =>
      this.shader.setUniform(uniform, value)
    )

    graphics.rect(0, 0, 0, 0)

    this.frameCount++
    return graphics
  }
  this.getUniforms = () => {
    const uniforms = {}

    uniforms['time'] = performance.now() / 1000
    uniforms['width'] = this.width
    uniforms['height'] = this.height
    uniforms['frameCount'] = this.frameCount

    this.materials.forEach((material, index) => {
      Object.assign(uniforms, material.getUniforms(index))
    })
    this.pointLights.forEach((pointLight, index) => {
      Object.assign(uniforms, pointLight.getUniforms(index))
    })

    uniforms['sceneCam.pos'] = this.pos
    uniforms['sceneCam.spherical'] = this.spherical
    uniforms['sceneCam.fov'] = this.fov

    return uniforms
  }
  this.pointLight = (props) => {
    const index = this.pointLights.length
    this.pointLights.push(new PointLight(props))
    return this.pointLights[index]
  }
  this.parent = (props) => {
    const index = this.materials.length
    this.materials.push(
      new Material({
        ...props,
        shape: 'parent', // Not really a shape, but it's a way to group materials
      })
    )
    return index
  }
  this.shape = (props) => {
    const index = this.materials.length
    this.materials.push(new Material(props))
    return this.materials[index]
  }
  this.box = (props) => {
    const index = this.materials.length
    this.materials.push(
      new Material({
        ...props,
        shape: 'box',
      })
    )
    return this.materials[index]
  }
  this.sphere = (props) => {
    const index = this.materials.length
    this.materials.push(
      new Material({
        ...props,
        shape: 'sphere',
      })
    )
    return this.materials[index]
  }
  this.capsule = (props) => {
    const index = this.materials.length
    this.materials.push(
      new Material({
        ...props,
        shape: 'capsule',
      })
    )
    return this.materials[index]
  }
}
