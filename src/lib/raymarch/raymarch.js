const TINA_RAYMARCH = /* glsl */ `

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
  return d;
}

SdScene sdScene(vec3 p, int excludeGroup) {
  SdScene sd = SdScene(1e10, -1);
  float smoothFactor = 0.;
  float totalDistance = 0.;

  for (int i = 0; i < materials.length(); i++) {
    Material m = materials[i];

    if(
      (excludeGroup != -1 && m.collisionGroup == excludeGroup) ||
      (m.shape == 0)
    ) continue;

    float distance = sdMaterial(p, m);

    if (distance < sd.distance) {
      sd.materialIndex = i;
    }
    if(smoothFactor > 0.) {
      totalDistance = opSmoothUnion(totalDistance, distance, smoothFactor);
    } else {
      totalDistance = distance;
    }
    if (totalDistance < sd.distance) {
      sd.distance = totalDistance;
    }

    smoothFactor = m.smoothFactor;
  }
  return sd;
}

RayMarch rayMarch(vec3 ro, vec3 rd) {
  RayMarch rm = RayMarch(vec3(0.), -1);
  float z = 0.;
  for(int i = 0; i < 1024; i++) {
    rm.pos = ro + z * rd;
    SdScene sd = sdScene(rm.pos, -1);
    float distance = abs(sd.distance);
    if(distance < 1e-4) {
      rm.materialIndex = sd.materialIndex;
      break;
    }
    z += distance;
    if(z > 1e4) {
      break;
    }
  }
  return rm;
}

vec3 calcSceneNormal(vec3 p, int excludeGroup) {
  float eps = 1e-4;
  vec3 h = vec3(eps, 0.0, 0.0);
  return normalize(vec3(
    sdScene(p + h.xyy, excludeGroup).distance - sdScene(p - h.xyy, excludeGroup).distance,
    sdScene(p + h.yxy, excludeGroup).distance - sdScene(p - h.yxy, excludeGroup).distance,
    sdScene(p + h.yyx, excludeGroup).distance - sdScene(p - h.yyx, excludeGroup).distance
  ));
}
`
