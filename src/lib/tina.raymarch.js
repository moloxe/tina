const TINA_RAYMARCH = /* glsl */ `
struct RayMarch {
  vec3 pos;
  bool isSurface;
};

RayMarch rayMarch(vec3 ro, vec3 rd) {
  RayMarch rm = RayMarch(vec3(0.), false);
  float z = 0.;
  for(int i = 0; i < 1024; i++) {
    rm.pos = ro + z * rd;
    float d = abs(sdScene(rm.pos));
    if(d < 1e-4) {
      rm.isSurface = true;
      break;
    }
    z += d;
    if(z > 1e4) {
      break;
    }
  }
  return rm;
}

float rayShot(vec3 origin, vec3 target) {
  vec3 lightDir = normalize(target - origin);
  RayMarch rm = rayMarch(
    origin, lightDir
  );
  float obstacleDist = length(rm.pos - target);
  return obstacleDist;
}
`
