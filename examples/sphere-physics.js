let tina, body

function move(movement) {
  const yAngle = tina.spherical[1]
  const acc = 0.05
  const jump = 0.2

  if (movement === 'UP' && body.colliding) {
    body.vel[0] += jump * body.colDir[0]
    body.vel[1] += jump * body.colDir[1]
    body.vel[2] += jump * body.colDir[2]
  }
  if (movement === 'DOWN') {
    body.vel[1] -= 0.1
  }

  const slowDown = body.colliding ? 1 : 0.1

  if (movement === 'FRONT') {
    body.vel[0] -= acc * sin(yAngle) * slowDown
    body.vel[2] -= acc * cos(yAngle) * slowDown
  }
  if (movement === 'BACK') {
    body.vel[0] += acc * sin(yAngle) * slowDown
    body.vel[2] += acc * cos(yAngle) * slowDown
  }
  if (movement === 'LEFT') {
    body.vel[0] -= acc * cos(yAngle) * slowDown
    body.vel[2] += acc * sin(yAngle) * slowDown
  }
  if (movement === 'RIGHT') {
    body.vel[0] += acc * cos(yAngle) * slowDown
    body.vel[2] -= acc * sin(yAngle) * slowDown
  }
}

function getResolution() {
  return [360 * (width / height), 360]
}

function setup() {
  createCanvas(windowWidth, windowHeight)
  tina = new Tina(...getResolution())
  tina.spherical = [10, 0, -0.5]

  body = new SphereCollisions({
    pos: [0, 5, 0],
    collisionGroup: 69,
    radius: 1,
  })

  tina.sphere({
    collisionGroup: body.collisionGroup,
    radius: 1,
    shininess: 500,
  })

  tina.box({
    dimensions: [2, 3, 0.01],
    rotation: [0.8, 0, 0],
    pos: [1, 1, 1],
  })

  tina.shape({
    sdFunc: `(
      pos.y +
      (
        cos(pos.x) +
        cos(pos.z)
      ) / 2.
    ) / 2.`,
    shininess: 500,
    smoothFactor: 0.1,
  })

  tina.shape({
    sdFunc: `pos.y + .1`,
    shininess: 20000,
  })

  pl = tina.pointLight({
    power: 1000000,
    computeShadows: true,
    pos: [0, 1000, 0],
  })

  tina.build()
  body.build(tina)

  body.startPhysics(
    () => {
      body.vel[0] *= 0.9
      body.vel[2] *= 0.9
      if (body.pos[1] < -5) {
        body.pos = [0, 5, 0]
        body.vel = [0, 0, 0]
      }
      tina.materials[0].pos = body.pos
      tina.pos = body.pos
    },
    { dampingFactor: 0.8 }
  )

  keyboardListener({
    Space: () => move('UP'),
    MetaLeft: () => move('DOWN'),
    ControlLeft: () => move('DOWN'),
    KeyW: () => move('FRONT'),
    KeyS: () => move('BACK'),
    KeyA: () => move('LEFT'),
    KeyD: () => move('RIGHT'),
  })

  noSmooth()
}

function draw() {
  const graphics = tina.update()
  image(graphics, 0, 0, width, height)
  if (body.colMap) image(body.colMap, 0, 0, 100, 200)
}

function mouseMoved() {
  tina.spherical[1] -= movedX / 300
  tina.spherical[2] -= movedY / 300
}

function mouseWheel(event) {
  if (event.delta > 0) {
    tina.spherical[0] += 0.01
  } else {
    tina.spherical[0] -= 0.01
  }
}

let resizeTimeout
function windowResized() {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    resizeCanvas(windowWidth, windowHeight)
    tina.resize(...getResolution())
    resizeTimeout = null
  }, 100)
}

function mousePressed() {
  requestPointerLock()
}
