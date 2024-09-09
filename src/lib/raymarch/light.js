// Blinn-Phong shading adapted from https://en.wikipedia.org/wiki/Blinn-Phong_reflection_model
const buildLights = (POINT_LIGHTS) => /* glsl */ `

struct PointLight {
  vec3 pos;
  vec3 color;
  float power;
};

uniform PointLight pointLights[${POINT_LIGHTS}];

const vec3 specColor = vec3(1.); // For now, white is fine
vec3 applyPointLight(
  vec3 pos, vec3 diffuseColor, float shininess,
  vec3 normal, vec3 ambientColor, PointLight pointLight
) {
  vec3 lightDir = pointLight.pos - pos;
  float distance = length(lightDir);
  lightDir = normalize(lightDir);
  distance *= distance;
  float lambertian = max(dot(normal, lightDir), 0.);
  float specular = 0.;

  if (lambertian > 0.) {
    vec3 viewDir = normalize(pos);
    vec3 halfDir = normalize(lightDir + viewDir);
    float specAngle = max(dot(halfDir, normal), 0.);
    specular = pow(specAngle, shininess);
  }

  vec3 colorLinear = ambientColor
    + diffuseColor * lambertian * pointLight.color * pointLight.power / distance
    + specColor    * specular   * pointLight.color * pointLight.power / distance;

  // const float screenGamma = 1.;
  // vec3 colorGammaCorrected = pow(colorLinear, vec3(1.0 / screenGamma));
  // return colorGammaCorrected;

  return colorLinear;
}

vec3 calcLighting(vec3 ro, vec3 rd) {
  RayMarch rm = rayMarch(ro, rd);
  vec3 lighting = vec3(0.);

  if(rm.materialIndex == -1) {
    return lighting;
  }

  vec3 pos = rm.pos;
  Material material = materials[rm.materialIndex];

  vec3 normal = calcSceneNormal(pos);
  const float minLight = 0.;
  vec3 ambientColor = material.color * minLight;
  vec3 diffuseColor = material.color;
  float shininess = material.shininess;

  float visibility, obstacleDist;
  ${new Array(POINT_LIGHTS)
    .fill()
    .map((_, i) => {
      return /* glsl */ `
        visibility = minLight;
        obstacleDist = shotScene(pointLights[${i}].pos, pos);
        if(obstacleDist <= 1e-2) visibility = 1.;
        lighting = max(
          lighting,
          visibility * applyPointLight(
            pos, diffuseColor, shininess,
            normal, ambientColor, pointLights[${i}]
          )
        );
      `
    })
    .join('')}

  return lighting;
}
`

function PointLight({ pos, color, power }) {
  this.pos = pos ?? [0, 0, 0]
  this.color = color ?? [1, 1, 1]
  this.power = power ?? 1
  this.getUniforms = (index) => ({
    [`pointLights[${index}].pos`]: this.pos,
    [`pointLights[${index}].color`]: this.color,
    [`pointLights[${index}].power`]: this.power,
  })
}
