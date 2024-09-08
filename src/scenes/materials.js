let tina, scene
const cam = [2, 0, 0] // spherical coordinate
const POINT_LIGHTS = 3

function mouseMoved() {
  cam[1] -= movedX / 100
  cam[2] -= movedY / 100
}

function mouseWheel(event) {
  if (event.delta > 0) {
    cam[0] += 0.1
  } else {
    cam[0] -= 0.1
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight)
  scene = new Scene()

  scene.sphere({
    pos: [0, -0.5, 0],
  })

  scene.box({
    pos: [0, -1, 0],
    dimensions: [0.3, 0.3, 0.3],
  })

  scene.box({
    pos: [0, -1, 0],
    dimensions: [2, 0, 2],
  })

  scene.box({
    pos: [-1.5, -0.5, 0],
    dimensions: [0, 0.5, 0.5],
  })

  scene.pointLight({
    color: [1, 0, 1],
  })

  scene.pointLight({
    pos: [-1.4, -0.5, 0],
    color: [1, 1, 1],
  })

  tina = new Tina(256 * (width / height), 256)

  tina.build(`
    uniform vec3 cam;

    ${buildMaterials(scene.materials.length, 3)}
    ---

    uv = uv * 2. - 1.;
    uv.x *= width/height;

    vec3 ro = vec3(0.);
    ro.z += cam.x;
    ro *= rotateX(cam.z);
    ro *= rotateY(cam.y);
    vec3 rd = normalize(vec3(uv, -1.));
    rd *= rotateX(cam.z);
    rd *= rotateY(cam.y);

    RayMarch rm = rayMarch(ro, rd);

    if(!rm.isSurface) {
      fragColor = vec4(0., 0., 0., 1.);
      return;
    }

    vec3 lighting = calcLighting(rm.pos, 0.3);

    fragColor = vec4(lighting, 1.);
  `)

  noSmooth()
}

let FPS = 0
function draw() {
  const angle = frameCount / 200
  scene.pointLights[0].pos = [5 * cos(angle), 5, 5 * sin(angle)]

  const graphics = tina.update({
    ['cam']: cam,
    ...scene.getUniforms(),
  })

  image(graphics, 0, 0, width, height)

  fill('#00ff00')
  noStroke()
  ellipse(width / 2, height / 2, 4, 4)
  textSize(16)
  stroke('#000')
  text(`FPS: ${FPS.toFixed(0)}`, 10, 30)

  if (frameCount % 30 === 0) FPS = frameRate()
}
