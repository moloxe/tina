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
    const height = 0.4
    setInterval(() => {
      this.pos[0] += this.vel[0]
      this.vel[0] *= 0.95
      this.pos[2] += this.vel[2]
      this.vel[2] *= 0.95
      this.pos[1] += this.vel[1]
      this.vel[1] -= gravity / freq
      if (this.pos[1] < -height) {
        this.onTheFloor = true
        this.vel[1] = 0
        this.pos[1] = -height
      }
    }, freq)
  }
}

const player = new Player({
  pos: [0, 0, 1],
  cam: [0.6, 0, -0.5],
})

let tina,
  playerMaterial,
  rgbcmyLights = []

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(240 * (width / height), 240)

  tina.setScene((scene) => {
    scene.sphere({
      shininess: 512,
      color: [1, 0, 1],
    })

    scene.box({
      pos: [0, -0.5, 0],
      dimensions: [0.3, 0.3, 0.3],
    })

    scene.box({
      pos: [0, -0.5, 0],
      dimensions: [2, 0, 2],
    })

    scene.box({
      pos: [-1, 0, 0],
      dimensions: [0, 0.5, 0.5],
    })

    playerMaterial = scene.sphere({
      shininess: 512,
      color: [1, 1, 1],
      radius: 0.1,
    })

    scene.pointLight({
      pos: [-0.8, 0, 0],
      color: [0.9, 0.9, 0.6],
      power: 0.5,
    })

    rgbcmyLights[0] = scene.pointLight({
      color: [1, 0, 0],
      power: 0.5,
    })
    rgbcmyLights[1] = scene.pointLight({
      color: [1, 1, 0],
      power: 0.5,
    })
    rgbcmyLights[2] = scene.pointLight({
      color: [0, 1, 0],
      power: 0.5,
    })
    rgbcmyLights[3] = scene.pointLight({
      color: [0, 1, 1],
      power: 0.5,
    })
    rgbcmyLights[4] = scene.pointLight({
      color: [0, 0, 1],
      power: 0.5,
    })
    rgbcmyLights[5] = scene.pointLight({
      color: [1, 0, 1],
      power: 0.5,
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

    lighting = round(lighting * 10.) / 10.;
    fragColor = vec4(lighting, 1.);
  `)

  controlsListener()
  noSmooth()
  player.startPhysics()
}

let FPS = 0
function draw() {
  playerMaterial.pos = player.pos

  for (let i = 0; i < rgbcmyLights.length; i++) {
    rgbcmyLights[i].pos[0] =
      cos(frameCount / 100 + (i * TWO_PI) / rgbcmyLights.length) * 2
    rgbcmyLights[i].pos[2] =
      sin(frameCount / 100 + (i * TWO_PI) / rgbcmyLights.length) * 2
  }

  const graphics = tina.update({
    ['player.pos']: player.pos,
    ['player.cam']: player.cam,
  })

  image(graphics, 0, 0, width, height)

  if (frameCount % 30 === 0) FPS = frameRate()

  fill('#00ff00')
  noStroke()
  ellipse(width / 2, height / 2, 4, 4)
  textSize(16)
  stroke('#000')
  text(`FPS: ${FPS.toFixed(0)}`, 10, 30)
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
  player.cam[1] -= movedX / 300
  player.cam[2] -= movedY / 300
}

let resizeTimeout
function windowResized() {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    resizeCanvas(windowWidth, windowHeight)
    tina.resize(240 * (width / height), 240)
    resizeTimeout = null
  }, 100)
}

function mousePressed() {
  if (!fullscreen()) {
    requestPointerLock()
    fullscreen(true)
  }
}
