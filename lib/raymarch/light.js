// Blinn-Phong shading adapted from https://en.wikipedia.org/wiki/Blinn-Phong_reflection_model
const buildLights = (POINT_LIGHTS) => /* glsl */ `

struct PointLight {
  vec3 pos;
  vec3 color;
  float power;
  bool computeShadows;
  float offsetRadius;
  float shadowStrength;
};

${POINT_LIGHTS > 0
    ? /* glsl */ `uniform PointLight pointLights[${POINT_LIGHTS}];`
    : ''
  }

vec3 applyPointLight(
  Material material,
  vec3 pos, vec3 normal,
  PointLight pointLight, vec3 viewDir, bool lightIsInside, bool hitByLight
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

  float shadow = 0.;
  float specular = 0.;
  if (lambertian > 0.) {
    vec3 halfDir = normalize(lightDir + viewDir);
    float specAngle = max(dot(halfDir, normal), 0.);
    specular = pow(specAngle, shininess);
  }

  if(!lightIsInside) { // if is not something like sphere with light inside
    lambertian = (initialLambertian + 1.) / 2.;
    lambertian = softClamp(lambertian, 0., 1.);
    lambertian *= lambertian;
    if(!hitByLight) shadow = pointLight.shadowStrength;
  }

  vec3 lightPower = pointLight.color * pointLight.power / distance;
  vec3 colorLinear = /* ambientColor + */
    diffuseColor *    lambertian * lightPower +
    /* specColor * */ specular   * lightPower;

  // const float screenGamma = 1.;
  // vec3 colorGammaCorrected = pow(colorLinear, vec3(1.0 / screenGamma));
  // return colorGammaCorrected;

  return colorLinear * (1. - shadow);
}


vec3 applyShadowlessLight(
  Material material,
  vec3 pos, vec3 normal, vec3 viewDir, vec3 ro
) {
  vec3 diffuseColor = material.color;
  float shininess = material.shininess;

  vec3 lightDir = ro - pos;
  lightDir = normalize(lightDir);

  float lambertian = abs(dot(normal, lightDir));
  vec3 halfDir = normalize(lightDir + viewDir);
  float specAngle = abs(dot(halfDir, normal));
  float specular = pow(specAngle, shininess);
  vec3 colorLinear = diffuseColor * lambertian + specular;

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
  bool lightHits;
};

LightHits lightHits(PointLight pl, vec3 target, int targetIndex) {
  vec3 lightOrigin = pl.pos;
  vec3 lightDir = normalize(target - lightOrigin);
  lightOrigin += lightDir * pl.offsetRadius;
  float targetDist = length(lightOrigin - target);

  LightHits lh = LightHits(false, false);

  // Obstacle
  float oDist = 0.;
  vec3 oPos = vec3(0.);

  for(int i = 0; i < RM_MAX_ITER; i++) {
    oPos = lightOrigin + oDist * lightDir;
    float distance = sdScenePositive(oPos).distance * .8;
    if(distance < 4e-4) {
      break;
    }
    oDist += distance;
    if(targetDist < oDist) {
      lh.lightIsInside = true;
      break;
    }
    if(oDist > RM_MAX_DIST) {
      break;
    }
  }

  lh.lightHits = lh.lightIsInside || length(oPos - target) < 0.01;

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

  ${POINT_LIGHTS > 0
    ? /* glsl */ `
  for(int i = 0; i < pointLights.length(); i++) {
    PointLight pl = pointLights[i];
    bool lightIsInside = false;
    bool hitByLight = true;
    if(pl.computeShadows) {
      LightHits lh = lightHits(pl, pos, rm.materialIndex);
      hitByLight = lh.lightHits;
      lightIsInside = lh.lightIsInside;
    }
    vec3 lightning = applyPointLight(
      material, pos, normal, pl, viewDir, lightIsInside, hitByLight
    );
    totalLightning = max(totalLightning, lightning);
  }`
    : /* glsl */ `
    totalLightning = applyShadowlessLight(material, pos, normal, viewDir, ro);
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
  shadowStrength = 1,
}) {
  this.pos = pos
  this.color = color
  this.power = power
  this.computeShadows = computeShadows
  this.offsetRadius = offsetRadius
  this.shadowStrength = shadowStrength
  this.getUniforms = (index) => ({
    [`pointLights[${index}].pos`]: this.pos,
    [`pointLights[${index}].color`]: this.color,
    [`pointLights[${index}].power`]: this.power,
    [`pointLights[${index}].computeShadows`]: this.computeShadows,
    [`pointLights[${index}].offsetRadius`]: this.offsetRadius,
    [`pointLights[${index}].shadowStrength`]: this.shadowStrength,
  })
}
