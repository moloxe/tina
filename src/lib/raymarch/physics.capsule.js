const TINA_RAYMARCH_PHYSICS_CAPSULE = /* glsl */ `
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
  this.collisionGroup = collisionGroup // A collision group has to be set to ignore specific materials
  this.physics = new Tina(360, 360, TINA_SCENE)
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
