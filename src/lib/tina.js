// heavily p5js based shader helper

const vertShader = `#version 300 es
in vec3 aPosition;
out vec2 pos;
void main() {
  pos = aPosition.xy;
  gl_Position = vec4(aPosition * 2.0 - 1.0, 1.0);
}`

function FragBuilder(scene) {
  this.mainContent = `fragColor = vec4(1.);`
  this.head = ``
  this.getFrag = () => `#version 300 es
    precision mediump float;

    ${TINA_COMMON}

    in vec2 pos;
    uniform float time;
    uniform float width;
    uniform float height;
    out vec4 fragColor;

    ${scene !== null ? buildMaterials(scene) : ''}

    ${this.head}

    void main() {
      vec2 uv = pos;
      ${this.mainContent}
    }
  `
}

function Tina(width, height) {
  this.width = width
  this.height = height
  const graphics = createGraphics(this.width, this.height, WEBGL)
  graphics.pixelDensity(1)

  let shader, startTime

  this.scene = null

  this.setScene = (sceneBuilder) => {
    if (this.scene) throw new Error('Scene already set')
    if (this.shader) throw new Error('Shader already built')
    this.scene = new Scene()
    sceneBuilder(this.scene)
    if (this.scene.pointLights.length === 0)
      throw new Error('At least one point light is required when using a scene')
    if (this.scene.materials.length === 0)
      throw new Error('At least one material is required when using a scene')
  }

  this.resize = (width, height) => {
    this.width = width
    this.height = height
    graphics.resizeCanvas(width, height)
  }

  this.build = (content = '') => {
    const fragBuilder = new FragBuilder(this.scene)
    startTime = new Date().getTime()

    if (!content.includes('---')) content = `---${content}`

    const [head, mainContent] = content.split('---')

    if (head) fragBuilder.head = head
    if (mainContent) fragBuilder.mainContent = mainContent

    const fragShader = fragBuilder.getFrag()
    shader = createShader(vertShader, fragShader)

    graphics.shader(shader)
    graphics.background(0)
  }

  this.update = (uniforms = {}) => {
    if (!shader) throw new Error('Missed build: call Tina.build()')

    if (this.scene) {
      uniforms = { ...uniforms, ...this.scene.getUniforms() }
    }

    const time = new Date().getTime() - startTime

    shader.setUniform('time', time / 1000)
    shader.setUniform('width', this.width)
    shader.setUniform('height', this.height)

    Object.entries(uniforms).forEach(([uniform, value]) =>
      shader.setUniform(uniform, value)
    )

    graphics.rect(0, 0, 0, 0)
    return graphics
  }
}
