let tina

function setLights() {
  const pos = createVector(800, 500, -800)
  const sun = tina.sphere({
    color: [1, 0.8, 0.6],
    pos: pos.array(),
    radius: 150,
  })

  tina.pointLight({
    color: sun.color,
    pos: pos.array(),
    computeShadows: true,
    offsetRadius: 150.01,
    power: 7e6,
    shadowness: 0.6,
  })

  tina.pointLight({
    color: sun.color,
    pos: pos.copy().mult(-1).array(),
    offsetRadius: 150.01,
    power: 1e6,
  })
}

function setWater() {
  tina.shape({
    color: [0, 1, 0.9],
    sdFunc: `
      (
        pos.y +
        snoise(vec3(pos.x * .08 + time * .8, pos.z * .08, time / 2.)) * .6 +
        snoise(vec3(pos.x * .6 + time * .6, pos.z * .8, time * 2.)) * .01
      ) * .9
    `,
    shininess: 1e3,
    smoothFactor: 1,
  })
}

function setThing() {
  tina.shape({
    color: [0, 1, 0.9],
    pos: tina.pos,
    sdFunc: `(
      length(pos) - pow((snoise(pos - time / 2.) + 1.), .3)
    ) * .3`,
    shininess: 1e3,
  })
}

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(240 * (width / height), 240, { useInterlacing: true })
  tina.pos = [0, 2, -2]

  setLights()
  setWater()
  setThing()

  tina.build(/* glsl */ `
    Scene scene = calcScene();
    if(scene.materialIndex == -1 && !scene.interlaced) {
      float
      v = snoise(scene.rd * 2. + vec3(0, 0, time * .1));
      v = snoise(scene.rd * 4. + vec3(v, v, time * .2));
      v = snoise(scene.rd * 8. + vec3(v, v, time * .3));
      v = max(v, 0.);
      scene.color.rgb = mix(hsv2rgb(.6, .4, .1), vec3(.25), v) + pow(v, 16.);
    }
    scene.color.rgb = round(scene.color.rgb * 16.) / 16.;
    fragColor = scene.color;
  `)

  noSmooth()
}

function draw() {
  const graphics = tina.update()
  const t = performance.now() / 1000
  tina.spherical = [4, t * 0.1, 0]
  image(graphics, 0, 0, width, height)
}
