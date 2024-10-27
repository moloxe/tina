const TINA_RAYMARCH_COLLISIONS_CAPSULE = /* glsl */ `

uniform Material capsule; // this material is not part of the scene

SdScene sdCollision(vec3 p, int excludeGroup) {
  SdScene sd = SdScene(1e10, -1);
  float accDist = 0.;
  float smoothFactor = 0.;
  for (int i = 0; i < materials.length(); i++) {
    Material m = materials[i];
    if(m.shape == 0) continue;
    if(
      // excludeGroup != -1 && // this should never happen
      m.collisionGroup == excludeGroup
    ) continue;
    procDist(sd, i, sdMaterial(p, m), accDist, smoothFactor);
  }
  return sd;
}

RayMarch rayMarchCollision(vec3 ro, vec3 rd) {
  RayMarch rm = RayMarch(vec3(0.), -1);
  float z = 0.;
  for(int i = 0; i < 32; i++) {
    rm.pos = ro + z * rd;
    SdScene sd = sdCollision(rm.pos, capsule.collisionGroup);
    if(sd.distance < 1e-4) {
      rm.materialIndex = sd.materialIndex;
      break;
    }
    float dCapsule = abs(
      sdCapsule(rm.pos - capsule.pos, capsule.start, capsule.end, capsule.radius)
    );
    if(dCapsule < 1e-4) {
      break;
    }
    z += min(dCapsule, sd.distance);
  }
  return rm;
}

vec3 calcCollisionNormal(vec3 p, int excludeGroup) {
  float eps = 1e-4;
  vec3 h = vec3(eps, 0.0, 0.0);
  return normalize(vec3(
    sdCollision(p + h.xyy, excludeGroup).distance - sdCollision(p - h.xyy, excludeGroup).distance,
    sdCollision(p + h.yxy, excludeGroup).distance - sdCollision(p - h.yxy, excludeGroup).distance,
    sdCollision(p + h.yyx, excludeGroup).distance - sdCollision(p - h.yyx, excludeGroup).distance
  ));
}

---

vec3 spherical = vec3(
  .1 + 1e-3,
  uv.x * PI,
  uv.y * PI * 2.
);

vec3 ro = capsule.pos;
vec3 rd = normalize(toCartesian(spherical));

RayMarch rm = rayMarchCollision(ro, rd);

// Normals ​​can be used to calculate the collision direction
// They are mapped (0-255) for use with P5js
vec3 color = vec3(.5);
if (rm.materialIndex != -1) {
  color = (calcCollisionNormal(rm.pos, capsule.collisionGroup) + 1.) / 2.;
}

fragColor = vec4(color, 1.);
`

function CapsuleCollisions({
  pos = [0, 0, 0],
  start = [0, 0, 0],
  end = [0, 0, 0],
  radius = 0.1,
  collisionGroup = -1, // Excluded group
}) {
  this.pos = pos
  this.start = start
  this.end = end
  this.radius = radius
  this.collisionGroup = collisionGroup // A collision group has to be set to ignore specific materials
  this.collisions = new Tina(180, 180)
  this.vel = [0, 0, 0]

  this.build = (tina) => {
    this.collisions.materials = tina.materials
    this.collisions.build(TINA_RAYMARCH_COLLISIONS_CAPSULE)
  }

  this.getCollisionDir = () => {
    this.map = this.collisions.update({
      ['capsule.pos']: this.pos,
      ['capsule.start']: this.start,
      ['capsule.end']: this.end,
      ['capsule.radius']: this.radius,
      ['capsule.collisionGroup']: this.collisionGroup,
    })
    this.map.loadPixels()

    const collisions = [0, 0, 0]
    for (let i = 0; i < this.map.pixels.length; i += 4) {
      const normalX = (this.map.pixels[i] / 255) * 2 - 1
      const normalY = (this.map.pixels[i + 1] / 255) * 2 - 1
      const normalZ = (this.map.pixels[i + 2] / 255) * 2 - 1
      const module = sqrt(normalX ** 2 + normalY ** 2 + normalZ ** 2)
      if (module < 0.1) continue
      collisions[0] =
        abs(normalX) > abs(collisions[0]) ? normalX : collisions[0]
      collisions[1] =
        abs(normalY) > abs(collisions[1]) ? normalY : collisions[1]
      collisions[2] =
        abs(normalZ) > abs(collisions[2]) ? normalZ : collisions[2]
    }
    const module = sqrt(
      collisions[0] ** 2 + collisions[1] ** 2 + collisions[2] ** 2
    )
    return { collisions, module }
  }

  this.startPhysics = (freq = 1000 / 60, cb = () => {}) => {
    let lastTime = performance.now()
    setInterval(() => {
      const now = performance.now()
      const delta = (now - lastTime) / freq
      lastTime = now

      // Move body before checking collisions
      this.pos[0] += this.vel[0] * delta
      this.pos[1] += this.vel[1] * delta
      this.pos[2] += this.vel[2] * delta

      let prevColPos = [...this.pos],
        colDir = [0, 0, 0]
      for (let it = 0; it < 8 /* MAX_ITER */; it++) {
        const { collisions, module } = this.getCollisionDir()
        if (module < 0.01) {
          this.pos = prevColPos
          break
        }
        colDir = collisions
        prevColPos = [...this.pos]
        for (let i = 0; i < 3; i++) this.pos[i] += 5e-3 * collisions[i]
      }

      cb(colDir, delta)
    }, freq)
  }
}
