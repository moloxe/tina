let tina,
  moon = {}

function setup() {
  createCanvas(windowWidth, windowHeight)
  tina = new Tina(240 * (width / height), 240, { useInterlacing: true })

  tina.shape({
    sdFunc: `(
      pos.y - snoise(vec3(pos.xz, pos.y - time / 10.))
    ) / 7.`,
    shininess: 1024,
  })

  moon.sphere = tina.sphere({
    radius: 1,
  })

  moon.pl = tina.pointLight({
    color: [0.9, 1, 1],
    power: 20,
    computeShadows: true,
    offsetRadius: 1.01,
    shadowness: 0.5,
  })

  tina.build(/* glsl */ `
    Scene scene = calcScene();
    fragColor = round(scene.color * 32.) / 32.;
  `)

  noSmooth()
}

function draw() {
  const time = performance.now() / 1000

  tina.spherical = [0.1, sin(time / 2) / 2, -0.3]
  tina.pos = [0, 0.6, -time / 4]

  moon.pl.pos = [0, 1.5, tina.pos[2] - 5]
  moon.sphere.pos = moon.pl.pos

  const graphics = tina.update()
  image(graphics, 0, 0, width, height)
}
