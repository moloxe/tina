function keyboardListener(actions) {
  const codes = {}
  const keys = Object.keys(actions)
  window.addEventListener('keydown', (event) => {
    event.preventDefault()
    codes[event.code] = true
  })
  window.addEventListener('keyup', (event) => {
    event.preventDefault()
    codes[event.code] = false
  })
  setInterval(() => {
    keys.forEach((key) => {
      if (codes[key]) actions[key]()
    })
  }, 1000 / 60)
}

const TINA_COMMON = /* glsl */ `
#define PI 3.1415926535897932384626433832795
#define TWO_PI 2. * PI

vec3 toSpherical(vec3 p) {
  float r = length(p);
  float theta = acos(p.z / r); // polar angle (0, PI)
  float phi = atan(p.y, p.x); // azimuthal angle (-PI, PI)
  return vec3(r, theta, phi);
}

vec3 toCartesian(vec3 spherical) {
  float r = spherical.x;
  float theta = spherical.y;
  float phi = spherical.z;
  float x = r * sin(theta) * cos(phi);
  float y = r * sin(theta) * sin(phi);
  float z = r * cos(theta);
  return vec3(x, y, z);
}

vec2 toPolar(vec2 p) {
  float r = length(p);
  float theta = atan(p.y, p.x);
  return vec2(r, theta);
}

vec2 toCartesian(vec2 polar) {
  float r = polar.x;
  float theta = polar.y;
  float x = r * cos(theta);
  float y = r * sin(theta);
  return vec2(x, y);
}

float getAngularDist(float angle1, float angle2) {
  float angle = angle1 - angle2;
  if (angle > PI) {
    angle -= 2.0 * PI;
  } else if (angle <= -PI) {
    angle += 2.0 * PI;
  }
  return angle;
}

// https://iquilezles.org/articles/distfunctions/

float dot2(in vec2 v) {
  return dot(v, v);
}
float dot2(in vec3 v) {
  return dot(v, v);
}
float ndot(in vec2 a, in vec2 b) {
  return a.x * b.x - a.y * b.y;
}

float sdSphere(vec3 p, float s) {
  return length(p) - s;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float udQuad(vec3 p, vec3 a, vec3 b, vec3 c, vec3 d) {
  vec3 ba = b - a;
  vec3 pa = p - a;
  vec3 cb = c - b;
  vec3 pb = p - b;
  vec3 dc = d - c;
  vec3 pc = p - c;
  vec3 ad = a - d;
  vec3 pd = p - d;
  vec3 nor = cross(ba, ad);

  return sqrt((sign(dot(cross(ba, nor), pa)) +
    sign(dot(cross(cb, nor), pb)) +
    sign(dot(cross(dc, nor), pc)) +
    sign(dot(cross(ad, nor), pd)) < 3.0) ? min(min(min(dot2(ba * clamp(dot(ba, pa) / dot2(ba), 0.0, 1.0) - pa), dot2(cb * clamp(dot(cb, pb) / dot2(cb), 0.0, 1.0) - pb)), dot2(dc * clamp(dot(dc, pc) / dot2(dc), 0.0, 1.0) - pc)), dot2(ad * clamp(dot(ad, pd) / dot2(ad), 0.0, 1.0) - pd)) : dot(nor, pa) * dot(nor, pa) / dot2(nor));
}

float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

// https://www.shadertoy.com/view/Ws3Xzr by jaybird
float smoothClamp(float x, float a, float b) {
  return smoothstep(0., 1., (x - a) / (b - a)) * (b - a) + a;
}

float softClamp(float x, float a, float b) {
  return smoothstep(0., 1., (2. / 3.) * (x - a) / (b - a) + (1. / 6.)) * (b - a) + a;
}

// https://gist.github.com/983/e170a24ae8eba2cd174f

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 hsv2rgb(float h, float s, float v) {
  vec3 c = vec3(h, s, v);
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

mat3 rotateY(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(c, 0., s, 0., 1., 0., -s, 0., c);
}

mat3 rotateX(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(1., 0., .0, 0., c, -s, 0., s, c);
}

mat3 rotateZ(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(c, -s, 0., s, c, 0., 0., 0., 1.);
}

mat2 rotate(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

mat3 rotate(vec3 angles) {
  float cx = cos(angles.x);
  float sx = sin(angles.x);
  float cy = cos(angles.y);
  float sy = sin(angles.y);
  float cz = cos(angles.z);
  float sz = sin(angles.z);

  mat3 rotX = mat3(1., 0., 0., 0., cx, -sx, 0., sx, cx);

  mat3 rotY = mat3(cy, 0., sy, 0., 1., 0., -sy, 0., cy);

  mat3 rotZ = mat3(cz, -sz, 0., sz, cz, 0., 0., 0., 1.);

  return rotZ * rotY * rotX;
}

// https://github.com/ashima/webgl-noise/blob/master/src/noise3D.glsl

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 10.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

//   x0 = x0 - 0.0 + 0.0 * C.xxx;
//   x1 = x0 - i1  + 1.0 * C.xxx;
//   x2 = x0 - i2  + 2.0 * C.xxx;
//   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

//vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
//vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

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

  // Could be better, this needs more work
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

      let prevPos = [...this.pos]
      let collisions = [0, 0, 0]

      // Prevents staying inside an object
      for (let it = 0; it < 8 /* MAX_ITER */; it++) {
        const colDir = this.getCollisionDir()
        const module = colDir.module
        if (module < 0.01) {
          this.pos = prevPos
          break
        }
        collisions = [...colDir.collisions]
        prevPos = [...this.pos]
        for (let i = 0; i < 3; i++) this.pos[i] += 5e-3 * collisions[i]
      }

      // Prevents crossing walls
      for (let i = 0; i < 3; i++)
        if (abs(collisions[i]) > 0.01) this.vel[i] += 5e-3 * collisions[i]

      cb(collisions, delta)
    }, freq)
  }
}

const sdSceneFunc = /* glsl */ `(vec3 p) {
  SdScene sd = SdScene(1e10, -1);
  float accDist = 0.;
  float smoothFactor = 0.;
  for (int i = 0; i < materials.length(); i++) {
    Material m = materials[i];
    if(m.shape == 0) continue; // shape 0: Group
    procDist(sd, i, sdMaterial(p, m), accDist, smoothFactor);
  }
  return sd;
}`

const buildRaymarch = (materials) => /* glsl */ `

struct RayMarch {
  vec3 pos;
  int materialIndex;
};

struct SdScene {
  float distance;
  int materialIndex;
};

vec3 transformedPos(Material m, vec3 p) {
  if (length(m.rotation) == 0.) return p - m.pos;
  return (p - m.pos) * rotate(m.rotation);
}

float sdMaterial(vec3 rmPos, Material m) {
  vec3 pos = transformedPos(m, rmPos);
  if (m.parentIndex != -1) {
    Material parent = materials[m.parentIndex];
    pos = transformedPos(parent, pos);
  }
  float d = 1e10;
  if (m.shape == 1) {
    d = sdSphere(pos, m.radius);
  } else if (m.shape == 2) {
    d = sdBox(pos, m.dimensions);
  } else if(m.shape == 15) {
    d = sdCapsule(pos, m.start, m.end, m.radius);
  }
  ${materials
    .map(({ sdFunc, customShapeId }) => {
      if (sdFunc) {
        return /* glsl */ `else if(m.shape == ${customShapeId}) {
          d = ${sdFunc};
        }`
      }
      return ''
    })
    .join('\n')}
  return d;
}

void procDist(
  inout SdScene sd, int i, float distance,
  inout float accDist, inout float smoothFactor
) {
  if (distance < sd.distance) {
    sd.materialIndex = i;
  }
  if(smoothFactor > 0.) {
    accDist = opSmoothUnion(accDist, distance, smoothFactor);
  } else {
    accDist = distance;
  }
  if (accDist < sd.distance) {
    sd.distance = accDist;
  }
  smoothFactor = materials[i].smoothFactor;
}

SdScene sdScene ${sdSceneFunc}

// Performance observation:
// When using sdScene in raymarching and to calculate
// normals in lib/raymarch/light.js the performance gets worse,
// having a specific sdScene for raymarch solves this performance problem.
// I don't know the reason... 🥲
SdScene sdScene_ONLYFORRAYMARCH ${sdSceneFunc}

const int   RM_MAX_ITER = 1024;
const float RM_MIN_DIST = 1e-4;
const float RM_MAX_DIST =  1e4;

RayMarch rayMarch(vec3 ro, vec3 rd) {
  RayMarch rm = RayMarch(vec3(0.), -1);
  float z = 0.;
  for(int i = 0; i < RM_MAX_ITER; i++) {
    rm.pos = ro + z * rd;
    SdScene sd = sdScene_ONLYFORRAYMARCH(rm.pos);
    float distance = abs(sd.distance);
    if(distance < RM_MIN_DIST) {
      rm.materialIndex = sd.materialIndex;
      break;
    }
    z += distance;
    if(z > RM_MAX_DIST) {
      break;
    }
  }
  return rm;
}

// lib/raymarch/light.js may be the right place,
// but if you don't use lights you don't have access to this feature
vec3 calcSceneNormal(vec3 p) {
  float eps = 1e-4;
  vec3 h = vec3(eps, 0.0, 0.0);
  return normalize(vec3(
    sdScene(p + h.xyy).distance - sdScene(p - h.xyy).distance,
    sdScene(p + h.yxy).distance - sdScene(p - h.yxy).distance,
    sdScene(p + h.yyx).distance - sdScene(p - h.yyx).distance
  ));
}
`

const MATERIAL_ID = {
  parent: 0, // Represents a group of materials
  // Overengineered
  sphere: 1,
  box: 2,
  capsule: 15,
}

const buildMaterials = (MATERIALS) => /* glsl */ `

struct Material {
  vec3 pos;
  vec3 rotation;
  vec3 color;
  float shininess;
  int shape;
  float radius;
  vec3 dimensions;
  vec3 start;
  vec3 end;
  int collisionGroup;
  float smoothFactor;
  int parentIndex;
};

uniform Material materials[${MATERIALS}];
`

function Material({
  pos = [0, 0, 0],
  rotation = [0, 0, 0],
  color = [1, 1, 1],
  shape = 'box',
  radius = 0.1,
  dimensions = [0.1, 0.1, 0.1],
  shininess = 1,
  start = [0, 0, 0],
  end = [0, 0, 0],
  collisionGroup = -1,
  smoothFactor = 0,
  parentIndex = -1,
  sdFunc = '',
}) {
  this.pos = pos
  this.rotation = rotation
  this.color = color
  this.shape = shape
  this.radius = radius
  this.dimensions = dimensions
  this.shininess = shininess
  this.start = start
  this.end = end
  this.collisionGroup = collisionGroup
  this.smoothFactor = smoothFactor
  this.parentIndex = parentIndex
  this.sdFunc = sdFunc

  this.customShapeId = (() => {
    if (this.sdFunc) {
      this.shape = this.sdFunc
      MATERIAL_ID[this.sdFunc] = floor(100 + random(1000))
      return MATERIAL_ID[this.sdFunc]
    }
    return null
  })()

  this.getUniforms = (index) => ({
    [`materials[${index}].pos`]: this.pos,
    [`materials[${index}].rotation`]: this.rotation,
    [`materials[${index}].color`]: this.color,
    [`materials[${index}].shape`]: MATERIAL_ID[this.shape],
    [`materials[${index}].radius`]: this.radius,
    [`materials[${index}].dimensions`]: this.dimensions,
    [`materials[${index}].shininess`]: this.shininess,
    [`materials[${index}].start`]: this.start,
    [`materials[${index}].end`]: this.end,
    [`materials[${index}].collisionGroup`]: this.collisionGroup,
    [`materials[${index}].smoothFactor`]: this.smoothFactor,
    [`materials[${index}].parentIndex`]: this.parentIndex,
  })
}

const TINA_RAYMARCH_SCENE = /* glsl */ `
struct ScemeCam {
  vec3 pos;
  vec3 spherical;
  float fov;
};

uniform ScemeCam sceneCam;

struct Scene {
  vec3 rd;
  int materialIndex;
  vec3 pos;
  vec3 normal;
  vec4 color;
  bool interlaced;
};

Scene calcScene() {
  vec2 dir2d = uv * 2. - 1.;
  dir2d *= vec2(width / height, -1);

  vec3 pos = sceneCam.pos;
  vec3 spherical = sceneCam.spherical;

  float radFov = radians(sceneCam.fov);
  float focalLength = 1. / tan(radFov * .5);

  vec3 ro = vec3(0.);
  ro.z += spherical.x;
  ro *= rotateX(spherical.z);
  ro *= rotateY(spherical.y);
  ro += pos;

  vec3 rd = normalize(vec3(dir2d, -focalLength));
  rd *= rotateX(spherical.z);
  rd *= rotateY(spherical.y);

  SceneLightning sl = calcSceneLightning(ro, rd);

  return Scene(rd, sl.materialIndex, sl.pos, sl.normal, vec4(sl.light, 1.), false);
}
`

// Blinn-Phong shading adapted from https://en.wikipedia.org/wiki/Blinn-Phong_reflection_model
const buildLights = (POINT_LIGHTS) => /* glsl */ `

struct PointLight {
  vec3 pos;
  vec3 color;
  float power;
  bool computeShadows;
  float offsetRadius;
  float shadowness;
};

${
  POINT_LIGHTS > 0
    ? /* glsl */ `uniform PointLight pointLights[${POINT_LIGHTS}];`
    : ''
}

vec3 applyPointLight(
  Material material,
  vec3 pos, vec3 normal,
  PointLight pointLight, vec3 viewDir, bool lightIsInside, float shadowness
) {
  vec3 diffuseColor = material.color;
  float shininess = material.shininess;

  vec3 lightDir = pointLight.pos - pos;
  float distance = length(lightDir);
  distance *= distance;
  lightDir = normalize(lightDir);

  float lambertian = dot(normal, lightDir);
  float initialLambertian = lambertian;
  if(lightIsInside) lambertian = abs(lambertian);
  else              lambertian = max(lambertian, 0.);

  float specular = 0.;
  if (lambertian > 0.) {
    vec3 halfDir = normalize(lightDir + viewDir);
    float specAngle = max(dot(halfDir, normal), 0.);
    specular = pow(specAngle, shininess);
  }

  vec3 lightPower = pointLight.color;
  if(pointLight.power > 0.) lightPower *= pointLight.power / distance;

  vec3 ambientColor = minBright * mix(diffuseColor, pointLight.color, .5);
  vec3 colorLinear = ambientColor +
    (
      diffuseColor *    lambertian * lightPower +
      /* specColor * */ specular   * lightPower
    ) * (1. - shadowness);

  // const float screenGamma = 1.;
  // vec3 colorGammaCorrected = pow(colorLinear, vec3(1.0 / screenGamma));
  // return colorGammaCorrected;

  return colorLinear;
}

SdScene sdScenePositive(vec3 p) {
  SdScene sd = SdScene(1e10, -1);
  float accDist = 0.;
  float smoothFactor = 0.;
  for (int i = 0; i < materials.length(); i++) {
    Material m = materials[i];
    if(m.shape == 0) continue; // shape 0: Group
    float mDist = sdMaterial(p, m);
    if(mDist < 0.) continue;
    procDist(sd, i, mDist, accDist, smoothFactor);
  }
  return sd;
}

struct LightHits {
  bool lightIsInside;
  float shadowness;
};

LightHits lightHits(PointLight pl, vec3 target, int targetIndex) {
  vec3 lightOrigin = pl.pos;
  vec3 lightDir = normalize(target - lightOrigin);
  lightOrigin += lightDir * pl.offsetRadius;
  float targetDist = length(lightOrigin - target);

  LightHits lh = LightHits(false, 0.);

  // Obstacle
  float oDist = 0.;
  vec3 oPos = vec3(0.);

  for(int i = 0; i < RM_MAX_ITER; i++) {
    oPos = lightOrigin + oDist * lightDir;
    float distance = sdScenePositive(oPos).distance * .8;
    if(distance < 4e-4) break;
    oDist += distance;
    if(targetDist < oDist) {
      lh.lightIsInside = true;
      break;
    }
    if(oDist > RM_MAX_DIST) {
      break;
    }
  }

  bool lightHits = lh.lightIsInside || length(oPos - target) < 0.01;
  if(!lightHits) lh.shadowness = pl.shadowness;

  return lh;
}

struct SceneLightning {
  int materialIndex;
  vec3 pos;
  vec3 normal;
  vec3 light;
};

SceneLightning calcSceneLightning(vec3 ro, vec3 rd) {
  RayMarch rm = rayMarch(ro, rd);
  vec3 totalLightning = vec3(0.);

  if(rm.materialIndex == -1) {
    return SceneLightning(-1, vec3(0.), vec3(0.), totalLightning);
  }

  vec3 pos = rm.pos;
  vec3 normal = calcSceneNormal(pos);
  vec3 viewDir = -rd;
  Material material = materials[rm.materialIndex];

  ${
    POINT_LIGHTS > 0
      ? /* glsl */ `
  for(int i = 0; i < pointLights.length(); i++) {
    PointLight pl = pointLights[i];
    bool lightIsInside = false;
    float shadowness = 0.;
    if(pl.computeShadows) {
      LightHits lh = lightHits(pl, pos, rm.materialIndex);
      shadowness = lh.shadowness;
      lightIsInside = lh.lightIsInside;
    }
    vec3 lightning = applyPointLight(
      material, pos, normal, pl, viewDir, lightIsInside, shadowness
    );
    totalLightning = mix(totalLightning, lightning, .5);
  }`
      : /* glsl */ `
    PointLight pl = PointLight(ro, vec3(1.), 0., false, 0., 0.);
    totalLightning = applyPointLight(
      material, pos, normal, pl, viewDir, false, 0.
    );
  `
  }

  return SceneLightning(rm.materialIndex, rm.pos, normal, totalLightning);
}
`

function PointLight({
  pos = [0, 0, 0],
  color = [1, 1, 1],
  power = 1,
  computeShadows = false,
  offsetRadius = 0,
  shadowness = 1,
}) {
  this.pos = pos
  this.color = color
  this.power = power
  this.computeShadows = computeShadows
  this.offsetRadius = offsetRadius
  this.shadowness = shadowness
  this.getUniforms = (index) => ({
    [`pointLights[${index}].pos`]: this.pos,
    [`pointLights[${index}].color`]: this.color,
    [`pointLights[${index}].power`]: this.power,
    [`pointLights[${index}].computeShadows`]: this.computeShadows,
    [`pointLights[${index}].offsetRadius`]: this.offsetRadius,
    [`pointLights[${index}].shadowness`]: this.shadowness,
  })
}

const vertShader = `#version 300 es
in vec3 aPosition;
out vec2 uv;
void main() {
  uv = aPosition.xy;
  gl_Position = vec4(uv * 2.0 - 1.0, 0., 1.0);
  uv.y = 1. - uv.y;
}`

function FragBuilder(tina) {
  this.mainContent = ``
  this.head = ``
  this.getFrag = () => {
    const nMaterials = tina.materials.length
    const nPointLights = tina.pointLights.length
    const shaders = []
    if (nMaterials > 0) {
      shaders.push(buildMaterials(nMaterials))
      shaders.push(buildRaymarch(tina.materials))
      shaders.push(buildLights(nPointLights))
      shaders.push(TINA_RAYMARCH_SCENE)
      if (!this.mainContent) this.mainContent = `fragColor = calcScene().color;`
    }
    return `#version 300 es
    precision mediump float;

    ${tina.useInterlacing ? '#define USE_INTERLACING' : ''}

    ${TINA_COMMON}

    in vec2 uv;
    uniform float time;
    uniform int frameCount;
    uniform float width;
    uniform float height;
    uniform float minBright;
    out vec4 fragColor;

    ${shaders.join('\n')}

    ${this.head}

    void main() {
      #ifdef USE_INTERLACING
      int _pixel_y = int(uv.y * height);
      if(_pixel_y % 2 == frameCount % 2) {
        fragColor =  vec4(0.);
        return;
      }
      #endif

      ${this.mainContent}
    }
  `
  }
}

function Tina(width, height, { useInterlacing } = {}) {
  this.width = width
  this.height = height
  this.useInterlacing = useInterlacing ?? false
  this.materials = []
  this.pointLights = []
  this.pos = [0, 0, 0]
  this.spherical = [0, 0, 0]
  this.minBright = 0.01
  this.fov = 100

  const graphics = createGraphics(this.width, this.height, WEBGL)
  graphics.pixelDensity(1)

  this.resize = (width, height) => {
    this.width = width
    this.height = height
    graphics.resizeCanvas(width, height)
  }

  this.shader
  this.build = (content = '') => {
    if (!content.includes('---')) content = `---${content}`
    const [head, mainContent] = content.split('---')

    const fragBuilder = new FragBuilder(this)
    fragBuilder.head = head
    fragBuilder.mainContent = mainContent
    const fragShader = fragBuilder.getFrag()

    this.shader = createShader(vertShader, fragShader)

    graphics.shader(this.shader)
    graphics.background(0)
  }
  this.frameCount = 0
  this.update = (uniforms = {}) => {
    if (!this.shader) throw new Error('Missed build: call Tina.build()')

    uniforms = { ...uniforms, ...this.getUniforms() }

    Object.entries(uniforms).forEach(([uniform, value]) =>
      this.shader.setUniform(uniform, value)
    )

    graphics.rect(0, 0, 0, 0)

    this.frameCount++
    return graphics
  }
  this.getUniforms = () => {
    const uniforms = {}

    uniforms['time'] = performance.now() / 1000
    uniforms['width'] = this.width
    uniforms['height'] = this.height
    uniforms['frameCount'] = this.frameCount
    uniforms['minBright'] = this.minBright

    this.materials.forEach((material, index) => {
      Object.assign(uniforms, material.getUniforms(index))
    })
    this.pointLights.forEach((pointLight, index) => {
      Object.assign(uniforms, pointLight.getUniforms(index))
    })

    uniforms['sceneCam.pos'] = this.pos
    uniforms['sceneCam.spherical'] = this.spherical
    uniforms['sceneCam.fov'] = this.fov

    return uniforms
  }
  this.pointLight = (props) => {
    const index = this.pointLights.length
    this.pointLights.push(new PointLight(props))
    return this.pointLights[index]
  }
  this.parent = (props) => {
    const index = this.materials.length
    this.materials.push(
      new Material({
        ...props,
        shape: 'parent', // Not really a shape, but it's a way to group materials
      })
    )
    return index
  }
  this.shape = (props) => {
    const index = this.materials.length
    this.materials.push(new Material(props))
    return this.materials[index]
  }
  this.box = (props) => {
    const index = this.materials.length
    this.materials.push(
      new Material({
        ...props,
        shape: 'box',
      })
    )
    return this.materials[index]
  }
  this.sphere = (props) => {
    const index = this.materials.length
    this.materials.push(
      new Material({
        ...props,
        shape: 'sphere',
      })
    )
    return this.materials[index]
  }
  this.capsule = (props) => {
    const index = this.materials.length
    this.materials.push(
      new Material({
        ...props,
        shape: 'capsule',
      })
    )
    return this.materials[index]
  }
}
