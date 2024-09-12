let tina

const player = {
  pos: [-1, -1],
  posVel: 0,
  angle: 0.4,
  angleVel: 0,
}

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(160, 160 * (height / width))

  tina.build(/* glsl */ `
    uniform vec2 playerP;
    uniform float playerAngle;
    const float minBri = 0.25;

    struct PLight {
      vec3 pos;
      vec3 color;
      float r;
      float dist;
    } pl;

    float sdTerrain(vec3 p) {
      float height = snoise(vec3(p.xz, p.y - time / 10.));
      return p.y - height;
    }

    float sdScene(vec3 p) {
      pl.dist = sdSphere(p - pl.pos, pl.r);
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
      float diff = max(dot(normal, lightDir), minBri);
      return lightColor * baseColor * diff;
    }

    vec3 calcPos(vec3 ro, vec3 rd) {
      float z = 0.;
      for(int i = 0; i < 1024; i++) {
        vec3 p = ro + z * rd;
        float d = sdScene(p) / 8.;
        if(d < 1e-3) {
          return p;
        }
        z += d;
        if(z > 1e3) break;
      }
      return vec3(0.);
    }

    ---

    uv = uv * 2. - 1.;
    uv.x *= width/height;
    vec3 ro = vec3(0.);
    vec3 rd = vec3(uv, -1.);
    ro *= rotateY(playerAngle);
    ro.xz += playerP;
    ro.y += .8;
    rd *= rotateY(playerAngle);

    pl = PLight(
      vec3(0., 100., -250.),
      vec3(.9, 1., 1.),
      60.,
      0.
    );

    vec3 p = calcPos(ro, rd);

    if(pl.dist < 0.01) {
      fragColor = vec4(pl.color, 1.);
      return;
    }

    if(length(p) <= 1e-4) {
      fragColor = vec4(vec3(0.), 1.);
      return;
    }

    vec3 lightDir = normalize(p - pl.pos);
    vec3 lightRayP = calcPos(
      pl.pos + lightDir * (pl.r + 0.01), lightDir
    );

    float obstacleDist = length(lightRayP - p);
    float visibility = 1.;
    if(obstacleDist > .1) {
      visibility = 0.25;
    }

    vec3 normal = calcNormal(p);
    vec3 lighting = applyPointLight(
      p, normal, pl.pos, pl.color, vec3(1.)
    ) * visibility;

    fragColor = vec4(lighting, 1.);
  `)

  noSmooth()
}

function draw() {
  keyboardControls()

  const graphics = tina.update({
    playerP: player.pos,
    playerAngle: player.angle,
  })

  graphics.filter(POSTERIZE, 8)
  image(graphics, 0, 0, width, height)
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
  tina.resize(160, 160 * (height / width))
}

function mousePressed() {
  if (fullscreen()) {
    fullscreen(false)
    cursor()
  } else {
    fullscreen(true)
    noCursor()
  }
}

function keyIs(k) {
  const lowerK = k.toLowerCase().charCodeAt(0)
  const upperK = k.toUpperCase().charCodeAt(0)
  return keyIsDown(lowerK) || keyIsDown(upperK)
}

const MAX_ANGLE_VEL = 0.05
const MIN_ANGLE_VEL = 0.004
const MAX_POS_VEL = 0.5
const MIN_POS_VEL = 0.003

function keyboardControls() {
  if (keyIs('D') && player.angleVel > -MAX_ANGLE_VEL) {
    player.angleVel -= 0.01
  }
  if (keyIs('A') && player.angleVel < MAX_ANGLE_VEL) {
    player.angleVel += 0.01
  }
  if (keyIs('W') && player.posVel < MAX_POS_VEL) {
    player.posVel += 0.01
  }
  if (keyIs('S') && player.posVel > -MAX_POS_VEL) {
    player.posVel -= 0.01
  }
  if (abs(player.angleVel) > MIN_ANGLE_VEL) {
    player.angle += player.angleVel
    player.angleVel += (player.angleVel > 0 ? -1 : 1) * MIN_ANGLE_VEL
  }
  if (abs(player.posVel) > MIN_POS_VEL) {
    player.pos[0] += player.posVel * cos(-player.angle - PI / 2)
    player.pos[1] += player.posVel * sin(-player.angle - PI / 2)
    player.posVel += (player.posVel > 0 ? -1 : 1) * MIN_POS_VEL
  }
}
