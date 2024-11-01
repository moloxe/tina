const TINA_RAYMARCH_COLLISIONS_SPHERE = /* glsl */ `

struct RayMarchCollision {
  vec3 pos;
  float originDistance;
};

uniform Material sphere; // this material is not part of the scene

SdScene sdCollision(vec3 p, int excludeGroup) {
  SdScene sd = SdScene(1e10, -1);
  float accDist = 0.;
  float smoothFactor = 0.;
  for (int i = 0; i < materials.length(); i++) {
    Material m = materials[i];
    if (m.shape == 0) continue;
    if (
      // excludeGroup != -1 && // this should never happen
      m.collisionGroup == excludeGroup
    ) continue;
    procDist(sd, i, sdMaterial(p, m), accDist, smoothFactor);
  }
  return sd;
}

RayMarchCollision rayMarchCollision(vec3 ro, vec3 rd) {
  RayMarchCollision rm = RayMarchCollision(vec3(0.), 0.);
  bool isNegative = sdCollision(rm.pos, sphere.collisionGroup).distance < 0.;
  for (int i = 0; i < RM_MAX_ITER; i++) {
    rm.pos = ro + rm.originDistance * rd;
    SdScene sd = sdCollision(rm.pos, sphere.collisionGroup);
    float absDist = abs(sd.distance);
    if (absDist < RM_MIN_DIST) {
      break;
    }
    rm.originDistance += absDist;
    if (rm.originDistance > sphere.radius) {
      rm.originDistance = sphere.radius;
      break;
    }
  }
  if(isNegative) {
    rm.originDistance *= -1.;
  }
  return rm;
}

vec4 encodeFloatToRGBA(float value) {
  uint intBits = floatBitsToUint(value);
  float r = float((intBits >> 24) & 0xFFu) / 255.;
  float g = float((intBits >> 16) & 0xFFu) / 255.;
  float b = float((intBits >> 8) & 0xFFu) / 255.;
  float a = float(intBits & 0xFFu) / 255.;
  return vec4(r, g, b, a);
}

---

vec3 spherical = vec3(
  1.,
  uv.x * PI,
  uv.y * PI * 2.
);

vec3 ro = sphere.pos;
vec3 rd = normalize(toCartesian(spherical));

RayMarchCollision rm = rayMarchCollision(ro, rd);
fragColor = encodeFloatToRGBA(rm.originDistance);

`

function decodeRGBAtoFloat(r, g, b, a) {
  const intBits = (r << 24) | (g << 16) | (b << 8) | a
  const floatView = new Float32Array(1)
  const intView = new Uint32Array(floatView.buffer)
  intView[0] = intBits
  return floatView[0]
}

function SphereCollisions({
  pos = [0, 0, 0],
  radius = 0.1,
  collisionGroup = -1, // Excluded group
}) {
  this.pos = pos
  this.radius = radius
  this.collisionGroup = collisionGroup // A collision group has to be set to ignore specific materials
  this.vel = [0, 0, 0]

  const size = 360
  const sphereCollisions = new Tina(size, size)

  this.build = (tina) => {
    sphereCollisions.materials = tina.materials
    sphereCollisions.build(TINA_RAYMARCH_COLLISIONS_SPHERE)
  }

  function pixelToColDir([x, y]) {
    const u = x / (size - 1)
    const v = y / (size - 1)
    const theta = u * PI
    const phi = v * PI * 2
    const dirX = sin(theta) * cos(phi)
    const dirY = sin(theta) * sin(phi)
    const dirZ = cos(theta)
    return createVector(dirX, dirY, dirZ).mult(-1).normalize()
  }

  this.getShpereDistances = () => {
    sphereCollisions.clear()

    // Distances to the center of the sphere
    const distances = sphereCollisions.update({
      ['sphere.pos']: this.pos,
      ['sphere.radius']: this.radius,
      ['sphere.collisionGroup']: this.collisionGroup,
    })

    let minCenterDist = this.radius + 1e-3
    let colCoord = null

    distances.loadPixels()
    for (let i = 0; i < distances.pixels.length; i += 4) {
      const r = distances.pixels[i]
      const g = distances.pixels[i + 1]
      const b = distances.pixels[i + 2]
      const a = distances.pixels[i + 3]
      const dist = decodeRGBAtoFloat(r, g, b, a)
      if (dist < minCenterDist) {
        minCenterDist = dist
        colCoord = [(i / 4) % size, floor(i / 4 / size)]
      }
    }

    let colDir = null
    if (colCoord && abs(minCenterDist) < this.radius) {
      colDir = pixelToColDir(colCoord)
    }

    return { centerDist: minCenterDist, colDir, colMap: distances }
  }

  this.startPhysics = (freq = 1000 / 60, cb = () => {}) => {
    let lastTime = performance.now()
    setInterval(() => {
      const now = performance.now()
      const delta = (now - lastTime) / freq
      lastTime = now

      const prevPos = createVector(this.pos[0], this.pos[1], this.pos[2])

      // Move body before checking collisions
      this.pos[0] += this.vel[0] * delta
      this.pos[1] += this.vel[1] * delta
      this.pos[2] += this.vel[2] * delta

      const { centerDist, colDir, colMap } = this.getShpereDistances()

      const colDetected = centerDist < this.radius
      let colDirCB = [0, 0, 0]

      if (colDetected && colDir !== null) {
        colDirCB = [colDir.x, colDir.y, colDir.z]

        const vel = createVector(this.vel[0], this.vel[1], this.vel[2])
        const moveDist = vel.magSq()
        const colDist = moveDist + centerDist - this.radius
        const colPos = prevPos.copy().add(vel.copy().normalize().mult(colDist))
        const finalVel = vel.copy().sub(colDir.copy().mult(2 * vel.dot(colDir))) //law of reflection

        this.vel[0] = finalVel.x
        this.vel[1] = finalVel.y
        this.vel[2] = finalVel.z

        const finalPos = colPos.copy().add(
          finalVel
            .copy()
            .normalize()
            .mult(moveDist - colDist)
            .mult(delta) // TODO: this delta should be increased due to cals
        )

        this.pos[0] = finalPos.x
        this.pos[1] = finalPos.y
        this.pos[2] = finalPos.z
      }

      cb({
        delta,
        colMap,
        colDetected,
        colDir: colDirCB,
        colDist: centerDist,
      })
    }, freq)
  }
}
