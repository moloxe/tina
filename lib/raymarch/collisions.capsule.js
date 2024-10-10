const TINA_RAYMARCH_COLLISIONS_CAPSULE = /* glsl */ `
uniform Material capsule; // this material is not part of the scene

RayMarch rayMarchCollision(vec3 ro, vec3 rd) {
  RayMarch rm = RayMarch(vec3(0.), -1);
  float z = 0.;
  for(int i = 0; i < 32; i++) {
    rm.pos = ro + z * rd;
    SdScene sd = sdScene(rm.pos, capsule.collisionGroup);
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

---

vec3 spherical = vec3(
  .1 + 1e-3,
  uv.x * PI,
  uv.y * PI * 2.
);

vec3 ro = capsule.pos;
vec3 rd = normalize(toCartesian(spherical));

RayMarch rm = rayMarchCollision(ro, rd);

vec3 color = vec3(.5);

if (rm.materialIndex != -1) {
  // Normals ​​can be used to calculate the collision direction
  // They are mapped (0-255) for use with P5js
  color = (calcSceneNormal(rm.pos, capsule.collisionGroup) + 1.) / 2.;
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
  this.collisions = new Tina(360, 360)
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

    const normal = [0, 0, 0]
    for (let i = 0; i < this.map.pixels.length; i += 4) {
      const normalX = (this.map.pixels[i] / 255) * 2 - 1
      const normalY = (this.map.pixels[i + 1] / 255) * 2 - 1
      const normalZ = (this.map.pixels[i + 2] / 255) * 2 - 1
      const module = sqrt(normalX ** 2 + normalY ** 2 + normalZ ** 2)
      if (module < 0.1) continue
      normal[0] = abs(normalX) > abs(normal[0]) ? normalX : normal[0]
      normal[1] = abs(normalY) > abs(normal[1]) ? normalY : normal[1]
      normal[2] = abs(normalZ) > abs(normal[2]) ? normalZ : normal[2]
    }

    return normal
  }
}
