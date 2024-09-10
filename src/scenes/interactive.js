function Player({ pos, cam }) {
  this.pos = pos
  this.vel = [0, 0, 0]
  this.cam = cam // spherical coordinates
  this.onTheFloor = true

  this.maxVel = 0.1
  this.acc = 0.002

  this.move = (move) => {
    const yAngle = this.cam[1]

    if (move === 'UP' && this.onTheFloor) {
      this.vel[1] += 0.05
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

    const xzVel = sqrt(this.vel[0] ** 2 + this.vel[2] ** 2)
    if (xzVel > this.maxVel) {
      this.vel[0] *= this.maxVel / xzVel
      this.vel[2] *= this.maxVel / xzVel
    }
  }

  // TODO: Add collision detection using raymarching
  this.startPhysics = () => {
    const freq = 1000 / 60
    const gravity = 0.02
    setInterval(() => {
      this.pos[0] += this.vel[0]
      this.vel[0] *= 0.95
      this.pos[2] += this.vel[2]
      this.vel[2] *= 0.95
      this.pos[1] += this.vel[1]
      this.vel[1] -= gravity / freq
      if (this.pos[1] < 0) {
        this.onTheFloor = true
        this.vel[1] = 0
        this.pos[1] = 0
      }
    }, freq)
  }
}

const player = new Player({
  pos: [0, 1, 1],
  cam: [0.6, 0, -0.5],
})

let tina,
  fps,
  lights = []

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(width, height)

  tina.setScene((scene) => {
    scene.sphere({
      shininess: 512,
      color: [1, 1, 1],
      pos: [0, 0.2, 0],
    })

    scene.box({
      shininess: 512,
      pos: [0, 0.05, 0],
      dimensions: [0.3, 0.05, 0.3],
    })

    scene.box({
      pos: [0, -0.1, 0],
      dimensions: [3, 0, 3],
    })

    scene.box({
      pos: [-2, 0.4, 0],
      dimensions: [0.004, 0.5, 0.5],
    })

    scene.pointLight({
      pos: [-1, 1, 0],
      color: [0.9, 0.9, 0.6],
    })

    playerMaterial = scene.sphere({
      shininess: 512,
      color: [1, 1, 1],
      radius: 0.1,
    })

    lights[0] = scene.pointLight({
      color: [1, 0, 0],
      power: 3,
    })

    lights[1] = scene.pointLight({
      color: [0, 1, 0],
      power: 3,
    })

    lights[2] = scene.pointLight({
      color: [0, 0, 1],
      power: 3,
    })
  })

  tina.build(/* glsl */ `
    struct Player {
      vec3 pos;
      vec3 cam;
    };
    uniform Player player;

    ---

    uv = uv * 2. - 1.;
    uv.x *= width/height;

    vec3 cam = player.cam;
    vec3 ro = vec3(0.);
    ro.z += cam.x;
    ro *= rotateX(cam.z);
    ro *= rotateY(cam.y);
    ro += player.pos;
    vec3 rd = normalize(vec3(uv, -1.));
    rd *= rotateX(cam.z);
    rd *= rotateY(cam.y);

    vec3 lighting = calcLighting(ro, rd);

    fragColor = vec4(lighting, 1.);
  `)

  controlsListener()
  noSmooth()
  player.startPhysics()

  setInterval(() => {
    fps = frameRate().toFixed(0)
  }, 500)
}

function draw() {
  playerMaterial.pos = player.pos

  for (let i = 0; i < lights.length; i++) {
    lights[i].pos = [
      cos(frameCount / 200 + (i * TWO_PI) / lights.length) * 3,
      2,
      sin(frameCount / 200 + (i * TWO_PI) / lights.length) * 3,
    ]
  }

  const graphics = tina.update({
    ['player.pos']: player.pos,
    ['player.cam']: player.cam,
  })

  image(graphics, 0, 0, width, height)

  fill('#00ff00')
  noStroke()
  ellipse(width / 2, height / 2, 4, 4)
  textSize(16)
  stroke('#000')
  text(`FPS: ${fps}`, 10, 30)
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

let resizeTimeout
function windowResized() {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    resizeCanvas(windowWidth, windowHeight)
    tina.resize(width, height)
    resizeTimeout = null
  }, 100)
}

function mousePressed() {
  if (!fullscreen()) {
    requestPointerLock()
    fullscreen(true)
  }
}
