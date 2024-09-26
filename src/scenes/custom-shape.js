let tina

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(width, height)

  tina.shape({
    sdFunc: `(sin(pos.y) - (cos(pos.x) + cos(pos.y) + cos(pos.z))) / 2.`,
  })

  tina.build(/* glsl */ `
    vec2 dir2d = uv * 2. - 1.;
    dir2d *= vec2(width / height, -1);

    float t = time * .3;
    vec3 ro = vec3(cos(-t) * 16., 2.4, sin(-t) * 16.);
    vec3 rd = normalize(vec3(dir2d, -.8));
    rd *= rotate(vec3(0., t, -t));

    fragColor = vec4(0., 0., 0., 1.);

    RayMarch rm = rayMarch(ro, rd);
    if(rm.materialIndex == -1) return;

    vec3 normal = calcSceneNormal(rm.pos, -1) / 2. + .5;
    float dist = length(rm.pos - ro);
    float bri = pow(sin(dist * PI / 6.), 6.);

    fragColor.rgb = normal * bri;
  `)
}

function draw() {
  const graphics = tina.update()
  image(graphics, 0, 0, width, height)
}
