let player,
  tina,
  lights = [],
  table

function Player() {
  this.initialPos = [-1, 1, 0]
  this.vel = [0, 0, 0]
  this.onTheFloor = true
  this.group = tina.parent({})
  this.body = new CapsuleCollisions({
    collisionGroup: this.group,
    pos: [...this.initialPos],
    end: [0, -0.2, 0],
    radius: 0.05,
  })
  this.acc = 0.003

  this.move = (move) => {
    const yAngle = tina.spherical[1]

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

    const dir = this.body.getCollisionDir()

    const bounce = 0.01
    for (let i = 0; i < 3; i++) {
      if (abs(dir[i]) > 0.01) {
        const sign = this.vel[i] > 0 ? 1 : -1
        this.vel[i] = -sign * abs(this.vel[i]) * bounce
        if (abs(this.vel[i]) < 0.01) this.vel[i] = 0
        this.body.pos[i] = prevPos[i] + this.vel[i]
      }
    }

    this.onTheFloor = dir[1] > 0.01
    this.vel[0] *= 0.9
    this.vel[1] -= 0.002 // gravity
    this.vel[2] *= 0.9

    if (this.body.pos[1] < -5) this.body.pos = [...this.initialPos] // dead

    tina.materials[this.group].pos = this.body.pos
    tina.pos = this.body.pos

    return player.body.map
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(...getResolution())
  player = new Player()

  tina.spherical = [0.6, 0, -0.5]

  tina.sphere({
    parentIndex: player.group,
    collisionGroup: player.group,
    shininess: 512,
    radius: 0.08,
    smoothFactor: 0.05,
  })

  tina.capsule({
    parentIndex: player.group,
    collisionGroup: player.group,
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
    experimentalInnerReflection: true,
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

  tina.build()
  player.body.build(tina)

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

function getResolution() {
  return [240 * (width / height), 240]
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
