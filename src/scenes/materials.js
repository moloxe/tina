let tina, skyblueLight
const cam = [2, 0, 0] // spherical coordinates

function mouseDragged() {
  cam[1] -= movedX / 100
  cam[2] -= movedY / 100
}

function mouseWheel(event) {
  if (event.delta > 0) {
    cam[0] += 0.03
  } else {
    cam[0] -= 0.03
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(width, height)

  tina.setScene((scene) => {
    scene.sphere({
      shininess: 512,
      color: [1, 0, 1],
    })

    scene.box({
      pos: [0, -0.2, 0],
      rotation: [0, 0, -0.5],
      dimensions: [0.3, 0.01, 0.3],
    })

    scene.box({
      pos: [0, -0.5, 0],
      dimensions: [2, 0, 2],
    })

    scene.box({
      pos: [-1, 0, 0],
      dimensions: [0.01, 0.5, 0.5],
    })

    skyblueLight = scene.pointLight({
      color: [0.4, 0.8, 0.8],
      power: 3,
    })

    scene.pointLight({
      pos: [-0.8, 0, 0],
      color: [0.8, 0.8, 0.4],
      power: 0.5,
    })
  })

  tina.build(/* glsl */ `
    uniform vec3 cam;

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

    vec3 lighting = calcLighting(ro, rd);

    fragColor = vec4(lighting, 1.);
  `)
}

let FPS = 0
function draw() {
  const angle = frameCount / 200

  skyblueLight.pos = [2 * cos(angle), 0.5, 2 * sin(angle)]

  const graphics = tina.update({
    cam,
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
