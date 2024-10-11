// Blinn-Phong shading adapted from https://en.wikipedia.org/wiki/Blinn-Phong_reflection_model
const buildLights = (POINT_LIGHTS) => /* glsl */ `

struct PointLight {
  vec3 pos;
  vec3 color;
  float power;
  bool computeShadows;
};

uniform PointLight pointLights[${POINT_LIGHTS}];

vec3 applyPointLight(
  Material material,
  vec3 pos, vec3 normal,
  PointLight pointLight, vec3 viewDir
) {
  vec3 diffuseColor = material.color;
  float shininess = material.shininess;

  vec3 lightDir = pointLight.pos - pos;
  float distance = length(lightDir);
  distance *= distance;
  lightDir = normalize(lightDir);

  float lambertian = max(dot(normal, lightDir), 0.);
  float specular = 0.;

  if (lambertian > 0.) {
    vec3 halfDir = normalize(lightDir + viewDir);
    float specAngle = max(dot(halfDir, normal), 0.);
    specular = pow(specAngle, shininess);
  }

  vec3 colorLinear = /* ambientColor + */
    diffuseColor *    lambertian * pointLight.color * pointLight.power / distance +
    /* specColor * */ specular   * pointLight.color * pointLight.power / distance;

  // const float screenGamma = 1.;
  // vec3 colorGammaCorrected = pow(colorLinear, vec3(1.0 / screenGamma));
  // return colorGammaCorrected;

  return colorLinear;
}

bool lightHits(vec3 lightOrigin, vec3 target) {
  vec3 lightDir = normalize(target - lightOrigin);
  RayMarch rm = rayMarch(lightOrigin, lightDir);
  if(length(target - rm.pos) < /* I hate this -> */  1e-2) return true;
  return false;
}

vec3 calcLightning(vec3 ro, vec3 rd) {
  RayMarch rm = rayMarch(ro, rd);
  vec3 totalLightning = vec3(0.);

  if(rm.materialIndex == -1) {
    return totalLightning;
  }

  vec3 pos = rm.pos;
  vec3 normal = calcSceneNormal(pos);
  vec3 viewDir = -rd;
  Material material = materials[rm.materialIndex];

  for(int i = 0; i < pointLights.length(); i++) {
    PointLight pl = pointLights[i];
    if(pl.computeShadows) {
      bool hitByLight = lightHits(pl.pos, pos);
      if(!hitByLight) continue;
    }
    vec3 lightning = applyPointLight(
      material, pos, normal, pl, viewDir
    );
    totalLightning = max(totalLightning, lightning);
  }

  return totalLightning;
}
`

function PointLight({
  pos = [0, 0, 0],
  color = [1, 1, 1],
  power = 1,
  computeShadows = false,
}) {
  this.pos = pos
  this.color = color
  this.power = power
  this.computeShadows = computeShadows
  this.getUniforms = (index) => ({
    [`pointLights[${index}].pos`]: this.pos,
    [`pointLights[${index}].color`]: this.color,
    [`pointLights[${index}].power`]: this.power,
    [`pointLights[${index}].computeShadows`]: this.computeShadows,
  })
}
