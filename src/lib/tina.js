// heavily p5js based shader helper

const vertShader = `#version 300 es
in vec3 aPosition;
out vec2 pos;
void main() {
  pos = aPosition.xy;
  gl_Position = vec4(aPosition * 2.0 - 1.0, 1.0);
}`

function FragBuilder(width, height) {
  this.mainContent = `fragColor = vec4(1.);`
  this.head = ``
  this.getFrag = () => `#version 300 es
    precision mediump float;

    ${TINA_COMMON}

    in vec2 pos;
    uniform float time;
    const float width = ${width.toFixed(6)};
    const float height = ${height.toFixed(6)};
    out vec4 fragColor;

    ${this.head}

    void main() {
      vec2 uv = pos;
      ${this.mainContent}
    }
  `
}

function Tina(width, height) {
  const graphics = createGraphics(width, height, WEBGL)
  graphics.pixelDensity(1)

  let shader, startTime

  this.build = (content = '') => {
    const fragBuilder = new FragBuilder(width, height)
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
    const time = new Date().getTime() - startTime

    shader.setUniform('time', time / 1000)

    Object.entries(uniforms).forEach(([uniform, value]) =>
      shader.setUniform(uniform, value)
    )

    graphics.rect(0, 0, 0, 0)
    return graphics
  }
}
