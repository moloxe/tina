function Player() {
  const initialPos = [0, 1, 1]
  this.vel = [0, 0, 0]
  this.cam = [0.6, 0, -0.5] // spherical coordinates
  this.onTheFloor = true
  this.body = new CapsulePhysics({
    pos: [...initialPos],
    end: [0, -0.2, 0],
    radius: 0.05,
    collisionGroup: 1,
  })
  this.materials = []

  this.maxVel = 0.02
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

  // TODO: delta time has to be considered
  this.updatePhysics = () => {
    const prevPos = [...this.body.pos]
    this.body.pos[0] += this.vel[0]
    this.body.pos[1] += this.vel[1]
    this.body.pos[2] += this.vel[2]
    const collisions = this.body.getCollisionMap()
    let collideX = false
    let collideY = false
    let collideZ = false
    collisions.loadPixels()
    for (let i = 0; i < collisions.pixels.length; i += 4) {
      const normalX = (collisions.pixels[i] / 255) * 2 - 1
      const normalY = (collisions.pixels[i + 1] / 255) * 2 - 1
      const normalZ = (collisions.pixels[i + 2] / 255) * 2 - 1
      const module = sqrt(normalX ** 2 + normalY ** 2 + normalZ ** 2)
      if (module < 0.1) continue
      // TODO: add direction to the collisions
      if (abs(normalX) > 0.1) collideX = true
      if (abs(normalY) > 0.1) collideY = true
      if (abs(normalZ) > 0.1) collideZ = true
    }
    if (collideX) {
      this.body.pos[0] = prevPos[0]
      this.vel[0] = 0
    }
    if (collideY) {
      this.body.pos[1] = prevPos[1]
      this.vel[1] = -this.vel[1] * 0.2 // bounce
      this.onTheFloor = true
    }
    if (collideZ) {
      this.body.pos[2] = prevPos[2]
      this.vel[2] = 0
    }
    this.vel[0] *= 0.9
    this.vel[1] -= 0.002 // gravity
    this.vel[2] *= 0.9

    if (this.body.pos[1] < -5) this.body.pos = [...initialPos] // fall

    this.materials[0].pos = this.body.pos
    this.materials[1].pos = this.body.pos

    return collisions
  }
}

let player,
  tina,
  fps,
  lights = []

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(...getResolution(), TINA_SCENE)
  player = new Player()

  player.materials[0] = tina.sphere({
    shininess: 512,
    radius: 0.08,
    collisionGroup: player.body.collisionGroup,
  })

  player.materials[1] = tina.capsule({
    shininess: 512,
    color: [1, 0, 1],
    radius: player.body.radius,
    end: player.body.end,
    collisionGroup: player.body.collisionGroup,
  })

  tina.sphere({
    shininess: 512,
    color: [1, 1, 1],
    pos: [0, 0.2, 0],
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
    pos: [0, 0.05, 0],
    dimensions: [0.3, 0.05, 0.3],
  })

  tina.box({
    pos: [0, -0.1, 0],
    dimensions: [3, 0, 3],
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
    power: 3,
  })

  lights[1] = tina.pointLight({
    color: [0, 1, 0],
    power: 3,
  })

  lights[2] = tina.pointLight({
    color: [0, 0, 1],
    power: 3,
  })

  player.body.build(tina)
  tina.buildScene()

  controlsListener()
  noSmooth()

  setInterval(() => {
    fps = frameRate().toFixed(0)
  }, 300)
}

function draw() {
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
  image(collisions, 0, height / 2, width / 6, width / 6)

  fill('#00ff00')
  noStroke()
  ellipse(width / 2, height / 2, 4, 4)
  textSize(12)
  stroke('#000')
  text(`FPS: ${fps}`, 10, 30)
  text(`Collisions`, 10, height / 2 + 20)
}

function controlsListener() {
  let keyCodes = {}
  window.addEventListener('keyup', (event) => {
    event.preventDefault()
    keyCodes[event.code] = false
  })
  window.addEventListener('keydown', (event) => {
    event.preventDefault()
    keyCodes[event.code] = true
  })
  setInterval(() => {
    if (keyCodes['Space']) player.move('UP')
    if (keyCodes['MetaLeft'] || keyCodes['ControlLeft']) player.move('DOWN')
    if (keyCodes['KeyW']) player.move('FRONT')
    if (keyCodes['KeyS']) player.move('BACK')
    if (keyCodes['KeyA']) player.move('LEFT')
    if (keyCodes['KeyD']) player.move('RIGHT')
  }, 1000 / 60)
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
