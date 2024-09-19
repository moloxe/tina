// heavily p5js based shader helper

const TINA_SCENE = 'TINA_SCENE'

const vertShader = `#version 300 es
in vec3 aPosition;
out vec2 uv;
void main() {
  uv = aPosition.xy;
  gl_Position = vec4(uv * 2.0 - 1.0, 0., 1.0);
  uv.y = 1. - uv.y;
}`

function FragBuilder(tina) {
  this.mainContent = `fragColor = vec4(1.);`
  this.head = ``
  this.getFrag = () => {
    const nMaterials = tina?.materials?.length
    const nLights = tina?.pointLights?.length
    const MATERIALS_SHADER = nMaterials > 0 ? buildMaterials(nMaterials) : ''
    const RAYMARCH_SHADER = MATERIALS_SHADER === '' ? '' : TINA_RAYMARCH
    const LIGHTS_SHADER = nLights > 0 ? buildLights(nLights) : ''
    return `#version 300 es
    precision mediump float;

    ${TINA_COMMON}

    in vec2 uv;
    uniform float time;
    uniform float width; // TODO: Use vec2 screen instead
    uniform float height;
    out vec4 fragColor;

    ${MATERIALS_SHADER}
    ${RAYMARCH_SHADER}
    ${LIGHTS_SHADER}

    ${this.head}

    void main() {
      ${this.mainContent}
    }
  `
  }
}

function Tina(width, height, TINA_MODE) {
  this.width = width
  this.height = height
  this.mode = TINA_MODE

  if (this.mode === TINA_SCENE) {
    const scene = new Scene()
    Object.assign(this, scene)
  }

  const graphics = createGraphics(this.width, this.height, WEBGL)
  graphics.pixelDensity(1)

  this.buildScene = () => {
    this.build(TINA_RAYMARCH_SCENE)
  }

  this.resize = (width, height) => {
    this.width = width
    this.height = height
    graphics.resizeCanvas(width, height)
  }

  this.shader
  this.build = (content = '') => {
    const fragBuilder = new FragBuilder(this)

    if (!content.includes('---')) content = `---${content}`

    const [head, mainContent] = content.split('---')

    if (head) fragBuilder.head = head
    if (mainContent) fragBuilder.mainContent = mainContent

    const fragShader = fragBuilder.getFrag()
    this.shader = createShader(vertShader, fragShader)

    graphics.shader(this.shader)
    graphics.background(0)
  }

  this.time = 0
  this.update = (uniforms = {}) => {
    this.time = performance.now() / 1000

    if (!shader) throw new Error('Missed build: call Tina.build()')

    if (this.mode === TINA_SCENE) {
      uniforms = { ...uniforms, ...this.getUniforms() }
    }

    uniforms['time'] = this.time
    uniforms['width'] = this.width
    uniforms['height'] = this.height

    Object.entries(uniforms).forEach(([uniform, value]) =>
      this.shader.setUniform(uniform, value)
    )

    graphics.rect(0, 0, 0, 0)
    return graphics
  }
}
