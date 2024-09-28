function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(width, height)
  postProc = new Tina(width, height)

  tina.build(/* glsl */ `
    struct PLight {
      vec3 pos;
      vec3 color;
      float r;
      float dist;
    } pl;

    float sdTerrain(vec3 p) {
      float height = cos(p.x) + cos(p.y) + cos(p.z);
      return sin(p.y) - height;
    }

    float sdScene(vec3 p) {
      pl.dist = sdSphere(p - pl.pos, pl.r);
      p = rotateY(1.2) * p;
      p.x -= 2.5;
      p.y += 2.5;
      p.z += 1.5;
      float terrainD = sdTerrain(p);
      return min(terrainD, pl.dist);
    }

    vec3 calcNormal(vec3 p) {
      const float eps = 1e-3;
      vec3 h = vec3(eps, 0.0, 0.0);
      return normalize(vec3(
        sdScene(p + h.xyy) - sdScene(p - h.xyy),
        sdScene(p + h.yxy) - sdScene(p - h.yxy),
        sdScene(p + h.yyx) - sdScene(p - h.yyx)
      ));
    }

    vec3 applyPointLight(vec3 p, vec3 normal, vec3 lightPos, vec3 lightColor, vec3 baseColor) {
      vec3 lightDir = normalize(pl.pos - p);
      float diff = max(dot(normal, lightDir), 0.);
      return lightColor * baseColor * diff;
    }
    
    vec3 calcPos(vec3 ro, vec3 rd) {
      float z = 0.;
      for(int i = 0; i < 256; i++) {
        vec3 p = ro + z * rd;
        float d = sdScene(p) / 2.;
        if(d < 1e-3) {
          return p;
        }
        z += d;
        if(z > 1e3) break;
      }
      return vec3(0.);
    }

    ---

    vec2 dir2d = uv * 2. - 1.;
    dir2d *= vec2(width / height, -1);
    vec3 ro = vec3(0., 0., 1.);
    vec3 rd = normalize(vec3(dir2d, -.8));

    pl = PLight(
      vec3(
        2. * sin(time / 2.) - 0.3,
        0.,
        2. * cos(time / 2.) - 3.
      ),
      vec3(1.),
      0.1,
      0.
    );

    vec3 p = calcPos(ro, rd);
    float isSurface = step(1e-4, length(p));
    vec3 lightDir = normalize(p - pl.pos);
    vec3 lightRayP = calcPos(
      pl.pos + lightDir * (pl.r + 0.01), lightDir
    );
    float visibility = max(1. - length(lightRayP - p), .2);

    vec3 normal = calcNormal(p);

    vec3 lighting = applyPointLight(
      p, normal, pl.pos, pl.color, vec3(1.)
    ) * visibility * isSurface;

    vec3 color = max(
      step(pl.dist, 0.01) * normal,
      lighting
    );

    fragColor = vec4(color, 1.);
  `)

  postProc.build(/* glsl */ `
    uniform sampler2D graphics;
    ---
    fragColor =
      texture(graphics, uv) +
      snoise(vec3(uv * (width + height), time * 2.)) * 0.1;
  `)
}

function draw() {
  let graphics = tina.update()
  graphics = postProc.update({ graphics })
  image(graphics, 0, 0, width, height)
}
