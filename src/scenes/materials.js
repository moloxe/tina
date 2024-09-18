let tina
const spherical = [2, 0, 0]

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(width / 2, height / 2, TINA_SCENE)

  tina.pointLight({
    pos: [0, 0, 2],
    color: [0.8, 0.8, 0.75],
  })
  tina.pointLight({
    pos: [1, 1, 1],
    power: 2,
  })

  // Head
  tina.box({
    color: [0.5, 0.5, 0.5],
    dimensions: [0.26, 0.14, 0.1],
    smoothFactor: 0.5,
  })
  tina.sphere({
    shininess: 3,
    color: [0.9, 0.6, 0.4],
  })

  // Sun glasses
  tina.box({
    shininess: 1024,
    pos: [-0.15, 0.05, 0.23],
    radius: 0.18,
    dimensions: [0.12, 0.08, 0.001],
    smoothFactor: 0.02,
  })
  tina.box({
    shininess: 1024,
    pos: [0.15, 0.05, 0.23],
    radius: 0.18,
    dimensions: [0.12, 0.08, 0.001],
    smoothFactor: 0.02,
  })
  tina.capsule({
    shininess: 1024,
    pos: [0, 0.1, 0.23],
    start: [0.05, 0, 0],
    end: [-0.05, 0, 0],
    radius: 0.01,
  })

  // Body
  tina.capsule({
    shininess: 10,
    color: [0, 0.5, 0],
    start: [0, -0.32, 0],
    end: [0, -0.4, 0],
    radius: 0.08,
    smoothFactor: 0.05,
  })
  tina.capsule({
    shininess: 10,
    color: [0, 0.5, 0],
    start: [-0.04, -0.45, 0],
    end: [-0.07, -0.55, 0],
    radius: 0.05,
    smoothFactor: 0.05,
  })
  tina.capsule({
    shininess: 10,
    color: [0, 0.5, 0],
    start: [0.04, -0.45, 0],
    end: [0.07, -0.55, 0],
    radius: 0.05,
  })

  // Floor
  tina.box({
    shininess: 1024,
    pos: [0, -1, 0],
    dimensions: [1, 0.01, 1],
  })
  // Wall
  tina.box({
    shininess: 1024,
    pos: [0, 0, -1],
    dimensions: [1, 1, 0.01],
  })

  tina.buildScene()
  tina.fov = 60
  noSmooth()
}

function draw() {
  tina.spherical = spherical

  const graphics = tina.update()

  image(graphics, 0, 0, width, height)
}

function mouseDragged() {
  spherical[1] -= movedX / 100
  spherical[2] -= movedY / 100
}

function mouseWheel(event) {
  if (event.delta > 0) {
    spherical[0] += 0.03
  } else {
    spherical[0] -= 0.03
  }
}
