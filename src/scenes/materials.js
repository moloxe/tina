let tina, skyblueLight
const spherical = [2, 0, 0]

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

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(width, height, TINA_SCENE)

  tina.sphere({
    shininess: 512,
    color: [1, 0, 1],
  })

  tina.box({
    pos: [0, -0.2, 0],
    rotation: [0, 0, -0.5],
    dimensions: [0.3, 0.01, 0.3],
  })

  tina.box({
    pos: [0, -0.5, 0],
    dimensions: [2, 0, 2],
  })

  tina.box({
    pos: [-1, 0, 0],
    dimensions: [0.01, 0.5, 0.5],
  })

  skyblueLight = tina.pointLight({
    color: [0.4, 0.8, 0.8],
    power: 3,
  })

  tina.pointLight({
    pos: [-0.8, 0, 0],
    color: [0.8, 0.8, 0.4],
    power: 0.5,
  })

  tina.buildScene()
}

let FPS = 0
function draw() {
  const angle = frameCount / 200

  skyblueLight.pos = [2 * cos(angle), 0.5, 2 * sin(angle)]
  tina.spherical = spherical

  const graphics = tina.update()

  image(graphics, 0, 0, width, height)

  fill('#00ff00')
  noStroke()
  ellipse(width / 2, height / 2, 4, 4)
  textSize(16)
  stroke('#000')
  text(`FPS: ${FPS.toFixed(0)}`, 10, 30)

  if (frameCount % 30 === 0) FPS = frameRate()
}
