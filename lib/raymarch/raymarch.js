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

float sdMaterial(vec3 p, Material m) {
  vec3 pos = (p - m.pos) * rotate(m.rotation);
  if(m.parentIndex != -1) {
    Material parent = materials[m.parentIndex];
    pos = (pos - parent.pos) * rotate(parent.rotation);
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
`
