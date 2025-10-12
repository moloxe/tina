let player,
  tina,
  lights = [],
  table

function Player() {
  this.initialPos = [0, 2, 0]
  this.onTheFloor = false
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
      this.body.vel[1] += 0.06
    }
    if (move === 'DOWN') {
      this.body.vel[1] -= 0.005
    }

    const slowDown = this.onTheFloor ? 1 : 0.3

    if (move === 'FRONT') {
      this.body.vel[0] -= this.acc * sin(yAngle) * slowDown
      this.body.vel[2] -= this.acc * cos(yAngle) * slowDown
    }
    if (move === 'BACK') {
      this.body.vel[0] += this.acc * sin(yAngle) * slowDown
      this.body.vel[2] += this.acc * cos(yAngle) * slowDown
    }
    if (move === 'LEFT') {
      this.body.vel[0] -= this.acc * cos(yAngle) * slowDown
      this.body.vel[2] += this.acc * sin(yAngle) * slowDown
    }
    if (move === 'RIGHT') {
      this.body.vel[0] += this.acc * cos(yAngle) * slowDown
      this.body.vel[2] -= this.acc * sin(yAngle) * slowDown
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(...getResolution(), { useInterlacing: true })
  player = new Player()

  tina.spherical = [0.6, 0, -0.5]
  tina.minBright = 0.1

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
    pos: [-1, 0.3, 0],
    smoothFactor: 0.2,
  })

  table = tina.box({
    shininess: 512,
    color: [1, 0, 1],
    dimensions: [0.4, 0.05, 0.4],
  })

  tina.shape({
    sdFunc: `pos.y + 0.1`,
    smoothFactor: 0.1,
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

  tina.sphere({
    pos: [20, 3, 0],
    radius: 3,
  })

  tina.pointLight({
    pos: [20, 3, 0],
    color: [0.9, 0.9, 0.6],
    computeShadows: true,
    offsetRadius: 3.01,
    power: 2000,
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

  tina.build(/* glsl */ `
    Scene scene = calcScene();
    if(scene.materialIndex == -1 && !scene.interlaced) {
      vec3 temp = scene.rd * 5.;
      float n0 = snoise(temp);
      float n1 = snoise(vec3(n0, temp.x, time * .5));
      float n2 = snoise(vec3(n0, temp.y, time * .5));
      float n3 = snoise(vec3(n0, temp.z, time * .5));
      scene.color.rgb = hsv2rgb(n1, n2, n3)  * .5;
    }
    fragColor = scene.color;
  `)
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

  const physicsFreq = 1000 / 60
  const gravity = 0.12 / 60
  player.body.startPhysics(physicsFreq, (collisions, delta) => {
    player.onTheFloor = collisions[1] > 0.01

    player.body.vel[0] *= 0.9
    if (player.onTheFloor) player.body.vel[1] = 0
    else player.body.vel[1] -= gravity * (1 - collisions[1]) * delta
    player.body.vel[2] *= 0.9

    // dead
    if (player.body.pos[1] < -5) {
      player.body.vel = [0, 0, 0]
      player.body.pos = [...player.initialPos]
    }

    tina.materials[player.group].pos = player.body.pos
    tina.pos = player.body.pos
  })

  noSmooth()
}

function draw() {
  const t = millis() / 1000
  table.pos = [-1, 0.1 + sin(t) / 10, 0]
  table.rotation = [0, t / 2, 0]

  for (let i = 0; i < lights.length; i++) {
    lights[i].pos = [
      cos(t + (i * TWO_PI) / lights.length) * 3,
      2,
      sin(t + (i * TWO_PI) / lights.length) * 3,
    ]
  }

  const graphics = tina.update()

  image(graphics, 0, 0, width, height)

  fill('#00ff00')
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
  return [360 * (width / height), 360]
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
