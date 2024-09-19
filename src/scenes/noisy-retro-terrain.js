let tina, postProc

function setup() {
  createCanvas(windowWidth, windowHeight)
  tina = new Tina(240, 240 * (height / width))
  postProc = new Tina(240, 240 * (height / width))

  tina.build(/* glsl */ `
    struct PLight {
      vec3 pos;
      vec3 color;
      float r;
    } pl;

    float sdTerrain(vec3 p) {
      float height = snoise(vec3(p.xz, p.y - time / 10.));
      return (p.y - height) / 16.;
    }

    float sdScene(vec3 p) {
      float d = 1e9;
      d = min(d, sdSphere(p - pl.pos, pl.r));
      d = min(d, sdTerrain(p));
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

    float calcLambert(vec3 p, vec3 normal, vec3 lightPos) {
      vec3 lightDir = normalize(lightPos - p);
      float lambert = max(dot(normal, lightDir), 0.);
      return lambert;
    }

    vec3 calcPos(vec3 ro, vec3 rd, float minZ) {
      float z = minZ;
      for(int i = 0; i < 512; i++) {
        vec3 p = ro + z * rd;
        float d = sdScene(p);
        if(d < 1e-4) {
          return p;
        }
        z += d;
        if(z > 1e4) break;
      }
      return vec3(0.);
    }

    ---

    vec2 dir2d = uv * 2. - 1.;
    dir2d *= vec2(width / height, -1);

    float yAngle = sin(time / 2.) / 2.;

    vec3 ro = vec3(0., .6, -time / 2.);
    vec3 rd = vec3(dir2d, -.8);
    rd *= rotate(vec3(-.3, yAngle, 0.));

    pl = PLight(
      vec3(0., 4., ro.z - 20.),
      vec3(.9, 1., 1.),
      4.
    );

    vec3 p = calcPos(ro, rd, 0.1);

    if(sdSphere(p - pl.pos, pl.r) < 1e-2) {
      fragColor = vec4(pl.color, 1.);
      return;
    }

    if(length(p) == 0.) {
      fragColor = vec4(vec3(0.), 1.);
      return;
    }

    vec3 lightDir = normalize(p - pl.pos);
    vec3 lightRayP = calcPos(
      pl.pos + lightDir * (pl.r + 1e-2), lightDir, 0.
    );

    float obstacleDist = length(lightRayP - p);
    float visibility = .3;
    if(length(p - lightRayP) < 1e-2) {
      visibility = 1.;
    }

    vec3 normal = calcNormal(p);
    vec3 lighting = pl.color * calcLambert(p, normal, pl.pos) * visibility;
    lighting = max(lighting, .3 * vec3(normal.z));

    fragColor = vec4(lighting, 1.);
  `)

  postProc.build(/* glsl */ `
    uniform sampler2D graphics;
    ---
    vec4 color = texture(graphics, uv);
    color.rgb = round(color.rgb * 16.) / 16.;
    fragColor = color;
  `)

  noSmooth()
}

function draw() {
  let graphics = tina.update()
  graphics = postProc.update({ graphics })

  image(graphics, 0, 0, width, height)
}
