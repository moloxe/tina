function Player() {
  this.initialPos = [0, 1, 1]
  this.vel = [0, 0, 0]
  this.cam = [0.6, 0, -0.5] // spherical coordinates
  this.onTheFloor = true

  this.acc = 0.003

  this.move = (move) => {
    const yAngle = this.cam[1]

    if (move === 'UP' && this.onTheFloor) {
      this.vel[1] += 0.06
      this.onTheFloor = false
    }
    if (move === 'DOWN') {
      this.vel[1] -= 0.005
    }

    const slowDown = this.onTheFloor ? 1 : 0.3

    if (move === 'FRONT') {
      this.vel[0] -= this.acc * sin(yAngle) * slowDown
      this.vel[2] -= this.acc * cos(yAngle) * slowDown
    }
    if (move === 'BACK') {
      this.vel[0] += this.acc * sin(yAngle) * slowDown
      this.vel[2] += this.acc * cos(yAngle) * slowDown
    }
    if (move === 'LEFT') {
      this.vel[0] -= this.acc * cos(yAngle) * slowDown
      this.vel[2] += this.acc * sin(yAngle) * slowDown
    }
    if (move === 'RIGHT') {
      this.vel[0] += this.acc * cos(yAngle) * slowDown
      this.vel[2] -= this.acc * sin(yAngle) * slowDown
    }
  }

  this.updatePhysics = () => {
    const prevPos = [...this.body.pos]

    // Move body before checking collisions
    this.body.pos[0] += this.vel[0]
    this.body.pos[1] += this.vel[1]
    this.body.pos[2] += this.vel[2]

    const collisions = this.body.getCollisionMap()
    collisions.loadPixels()

    const normal = [0, 0, 0]
    for (let i = 0; i < collisions.pixels.length; i += 4) {
      const normalX = (collisions.pixels[i] / 255) * 2 - 1
      const normalY = (collisions.pixels[i + 1] / 255) * 2 - 1
      const normalZ = (collisions.pixels[i + 2] / 255) * 2 - 1
      const module = sqrt(normalX ** 2 + normalY ** 2 + normalZ ** 2)
      if (module < 0.1) continue
      if (abs(normalX) > abs(normal[0])) normal[0] = normalX
      if (abs(normalY) > abs(normal[1])) normal[1] = normalY
      if (abs(normalZ) > abs(normal[2])) normal[2] = normalZ
    }

    if (abs(normal[0]) > 0.1) {
      this.vel[0] *= -abs(normal[0]) * 0.1
      this.body.pos[0] = prevPos[0] + this.vel[0]
    }
    if (abs(normal[1]) > 0.1) {
      this.onTheFloor = normal[1] > 0
      // TODO: Fix bouncing
      this.vel[1] *= -abs(normal[1]) * 0.1
      this.body.pos[1] = prevPos[1] + this.vel[1]
    }
    if (abs(normal[2]) > 0.1) {
      this.vel[2] *= -abs(normal[2]) * 0.1
      this.body.pos[2] = prevPos[2] + this.vel[2]
    }

    this.vel[0] *= 0.9
    this.vel[1] -= 0.002 // gravity
    this.vel[2] *= 0.9

    if (this.body.pos[1] < -5) this.body.pos = [...this.initialPos] // fall

    tina.materials[this.groupIndex].pos = this.body.pos

    return collisions
  }
}

let player,
  tina,
  lights = [],
  table

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(...getResolution())
  player = new Player()

  player.groupIndex = tina.parent({})

  player.body = new CapsulePhysics({
    collisionGroup: player.groupIndex,
    pos: [...player.initialPos],
    end: [0, -0.2, 0],
    radius: 0.05,
  })

  tina.sphere({
    parentIndex: player.groupIndex,
    collisionGroup: player.body.collisionGroup,
    shininess: 512,
    radius: 0.08,
    smoothFactor: 0.05,
  })

  tina.capsule({
    parentIndex: player.groupIndex,
    collisionGroup: player.body.collisionGroup,
    shininess: 512,
    color: [1, 0, 1],
    radius: player.body.radius,
    end: player.body.end,
  })

  tina.sphere({
    shininess: 512,
    color: [1, 1, 1],
    pos: [0, 0.3, 0],
    smoothFactor: 0.2,
  })

  table = tina.box({
    shininess: 512,
    color: [1, 0, 1],
    dimensions: [0.3, 0.05, 0.3],
  })

  tina.box({
    pos: [0, -0.1, 0],
    dimensions: [3, 0, 3],
  })

  tina.box({
    rotation: [-0.6, 0, 0],
    pos: [1, 0, 0],
    dimensions: [0.2, 0.01, 0.3],
  })

  tina.box({
    rotation: [0, 0, 0],
    pos: [1, 0.168, -0.54],
    dimensions: [0.2, 0.01, 0.3],
  })

  tina.box({
    pos: [-2, 0.4, 0],
    dimensions: [0.004, 0.5, 0.5],
  })

  tina.pointLight({
    pos: [-1, 1, 0],
    color: [0.9, 0.9, 0.6],
    computeShadows: true,
  })

  lights[0] = tina.pointLight({
    color: [1, 0, 0],
  })

  lights[1] = tina.pointLight({
    color: [0, 1, 0],
  })

  lights[2] = tina.pointLight({
    color: [0, 0, 1],
  })

  player.body.build(tina)
  tina.build()

  keyboardListener({
    Space: () => player.move('UP'),
    MetaLeft: () => player.move('DOWN'),
    ControlLeft: () => player.move('DOWN'),
    KeyW: () => player.move('FRONT'),
    KeyS: () => player.move('BACK'),
    KeyA: () => player.move('LEFT'),
    KeyD: () => player.move('RIGHT'),
  })

  noSmooth()
}

function draw() {
  const t = millis() / 1000
  table.pos = [0, 0.1 + sin(t) / 10, 0]
  table.rotation = [0, t / 2, 0]

  for (let i = 0; i < lights.length; i++) {
    lights[i].pos = [
      cos(frameCount / 200 + (i * TWO_PI) / lights.length) * 3,
      2,
      sin(frameCount / 200 + (i * TWO_PI) / lights.length) * 3,
    ]
  }

  tina.pos = player.body.pos
  tina.spherical = player.cam

  const graphics = tina.update()
  const collisions = player.updatePhysics()

  image(graphics, 0, 0, width, height)
  image(collisions, 0, 0, height / 4, height / 4)

  fill('#00ff00')
  stroke('#000')
  textSize(12)
  text('Collisions', 10, 20)

  noStroke()
  ellipse(width / 2, height / 2, 4, 4)
}

function mouseMoved() {
  if (!fullscreen()) return
  player.cam[1] -= movedX / 300
  player.cam[2] -= movedY / 300
}

function mouseWheel(event) {
  if (event.delta > 0) {
    tina.spherical[0] += 0.01
  } else {
    tina.spherical[0] -= 0.01
  }
}

function getResolution() {
  return [256 * (width / height), 256]
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
  if (!fullscreen()) {
    requestPointerLock()
    fullscreen(true)
  }
}
