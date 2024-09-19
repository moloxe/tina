let tina

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(width, height)

  tina.build(/* glsl */ `
    float sdTerrain(vec3 p) {
      float height = cos(p.x) + cos(p.y) + cos(p.z);
      return sin(p.z) - height;
    }

    float sdScene(vec3 p) {
      float t = time * .3;
      p = rotate(vec3(
        -PI/2.,
        -t,
        -t - 1.
      )) * p;
      const float r = 15.;
      p.x += cos(t) * r;
      p.y += sin(t) * r;
      p.z += 2.;
      float d = sdTerrain(p);
      return d;
    }

    vec3 calcNormal(vec3 p) {
      const float eps = 1e-4;
      vec3 h = vec3(eps, 0.0, 0.0);
      return normalize(vec3(
        sdScene(p + h.xyy) - sdScene(p - h.xyy),
        sdScene(p + h.yxy) - sdScene(p - h.yxy),
        sdScene(p + h.yyx) - sdScene(p - h.yyx)
      ));
    }

    ---

    vec2 dir2d = uv * 2. - 1.;
    dir2d *= vec2(width / height, -1);

    vec3 ro = vec3(0., 0., 1.);
    vec3 rd = normalize(vec3(dir2d, -.8));

    vec4 c = vec4(0., 0., 0., 1.);

    float z = 0.;
    for(int i = 0; i < 512; i++) {
      vec3 p = ro + z * rd;
      float d = sdScene(p) / 1.4;
      if(d < 1e-4) {
        vec3 normal = calcNormal(p);
        float bri = exp((sin(p.z) + 1.) / 2.) - 1.;
        c.rgb = normal * bri;
        break;
      }
      z += d;
      if(z > 1e4) break;
    }

    fragColor = c;
  `)
}

function draw() {
  const graphics = tina.update()
  image(graphics, 0, 0, width, height)
}
