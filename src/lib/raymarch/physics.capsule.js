const TINA_RAYMARCH_PHYSICS_CAPSULE = /* glsl */ `
uniform Material capsule; // this material is not part of the scene

vec3 rayMarchCapsuleSurface(vec3 ro, vec3 rd) {
  float z = 0.;
  vec3 pos;
  for(int i = 0; i < 1024; i++) {
    pos = ro + z * rd;
    float distance = abs(
      sdCapsule(pos - capsule.pos, capsule.start, capsule.end, capsule.radius)
    );
    if(distance < 1e-4) return ro + (z + 1e-3) * rd;
    z += distance;
  }
  return vec3(0.); // this should never happen
}

RayMarch rayMarchCollision(vec3 ro, vec3 rd) {
  RayMarch rm = RayMarch(vec3(0.), -1);
  float z = 0.;
  for(int i = 0; i < 1024; i++) {
    rm.pos = ro + z * rd;
    SdScene sd = sdScene(rm.pos, capsule.collisionGroup);
    float distance = sd.distance;
    if(distance < 1e-4) {
      rm.materialIndex = sd.materialIndex;
      break;
    }
    z += distance;
    if(z > 1e-3) {
      break;
    }
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

ro = rayMarchCapsuleSurface(ro, rd);
RayMarch rm = rayMarchCollision(ro, rd);

vec3 color = vec3(.5);

if (rm.materialIndex != -1) {
  // Normals ​​can be used to calculate the collision direction
  // They are mapped (0-255) for use with P5js
  color = (calcSceneNormal(rm.pos, capsule.collisionGroup) + 1.) / 2.;
}

fragColor = vec4(color, 1.);
`

function CapsulePhysics({
  pos = [0, 0, 0],
  start = [0, 0, 0],
  end = [0, 0, 0],
  radius = 0.1,
  collisionGroup = -1,
}) {
  this.pos = pos
  this.start = start
  this.end = end
  this.radius = radius
  this.collisionGroup = collisionGroup
  this.physics = new Tina(180, 180, TINA_SCENE)
  this.build = (tina) => {
    if (tina?.mode !== TINA_SCENE)
      throw new Error(
        'CapsulePhysics requires a Tina instance with TINA_SCENE mode'
      )
    this.physics.materials = tina.materials
    this.physics.build(TINA_RAYMARCH_PHYSICS_CAPSULE)
  }
  this.getCollisionMap = () => {
    return this.physics.update({
      ['capsule.pos']: this.pos,
      ['capsule.start']: this.start,
      ['capsule.end']: this.end,
      ['capsule.radius']: this.radius,
      ['capsule.collisionGroup']: this.collisionGroup,
    })
  }
}
