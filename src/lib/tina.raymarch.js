const TINA_RAYMARCH = /* glsl */ `

struct RayMarch {
  vec3 pos;
  int materialIndex;
};

struct SdScene {
  float distance;
  int materialIndex;
};

SdScene sdScene(vec3 p) {
  SdScene sd = SdScene(1e10, -1);
  for (int i = 0; i < materials.length(); i++) {
    Material m = materials[i];
    float d = 1e10;
    if (m.shape == 1) {
      d = sdSphere(p - m.pos, m.radius);
    } else if (m.shape == 2) {
      d = sdBox(p - m.pos, m.dimensions);
    }
    d = abs(d);
    if (d < sd.distance) {
      sd.distance = d;
      sd.materialIndex = i;
    }
  }
  return sd;
}

RayMarch rayMarch(vec3 ro, vec3 rd) {
  RayMarch rm = RayMarch(vec3(0.), -1);
  float z = 0.;
  for(int i = 0; i < 1024; i++) {
    rm.pos = ro + z * rd;
    SdScene sd = sdScene(rm.pos);
    if(sd.distance < 1e-3) {
      rm.materialIndex = sd.materialIndex;
      break;
    }
    z += sd.distance;
    if(z > 1e4) {
      break;
    }
  }
  return rm;
}

vec3 calcSceneNormal(vec3 p) {
  float eps = 1e-6;
  vec3 h = vec3(eps, 0.0, 0.0);
  return normalize(vec3(
    sdScene(p + h.xyy).distance - sdScene(p - h.xyy).distance,
    sdScene(p + h.yxy).distance - sdScene(p - h.yxy).distance,
    sdScene(p + h.yyx).distance - sdScene(p - h.yyx).distance
  ));
}

float shotScene(vec3 origin, vec3 target) {
  vec3 lightDir = normalize(target - origin);
  RayMarch rm = rayMarch(
    origin, lightDir
  );
  float obstacleDist = length(rm.pos - target);
  return obstacleDist;
}
`
