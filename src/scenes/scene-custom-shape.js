let tina

function setup() {
  createCanvas(windowWidth, windowHeight)
  tina = new Tina(width, height)

  tina.shape({
    pos: [0, 0, -2],
    sdFunc: `(
      length(pos) - (2. + snoise(vec3(pos.xy, time * .2))) * .4
    ) / 2.`,
    shininess: 1024,
    color: [1, 0.8, 0],
  })

  tina.pointLight({
    pos: [0, 0, 4],
    power: 20,
  })

  tina.build()
  tina.fov = 100
}

function draw() {
  const graphics = tina.update()
  image(graphics, 0, 0, width, height)
}
