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
