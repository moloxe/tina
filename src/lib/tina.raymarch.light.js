// TODO: Add support for Blinn-Phong shading
const buildLights = (POINT_LIGHTS) => /* glsl */ `

struct PointLight {
  vec3 pos;
  vec3 color;
};

uniform PointLight pointLights[${POINT_LIGHTS}];

vec3 applyPointLight(
  vec3 pos, vec3 baseColor, vec3 normal,
  vec3 lightPos, vec3 lightColor) {
  vec3 lightDir = normalize(lightPos - pos);
  float diff = max(dot(normal, lightDir), 0.);
  return lightColor * baseColor * diff;
}

vec3 calcNormal(vec3 p) {
  const float eps = 1e-4;
  vec3 h = vec3(eps, 0.0, 0.0);
  return normalize(vec3(
    sdScene(p + h.xyy) - sdScene(p - h.xyy),
    sdScene(p + h.yxy) - sdScene(p - h.yxy),
    sdScene(p + h.yyx) - sdScene(p - h.yyx)
  ));
}

vec3 calcLighting(vec3 pos, float minLight) {
  vec3 lighting = vec3(0.);
  vec3 normal = calcNormal(pos);

  float visibility, obstacleDist;
  ${new Array(POINT_LIGHTS)
    .fill()
    .map((_, i) => {
      return `
        visibility = minLight;
        obstacleDist = rayShot(pointLights[${i}].pos, pos);
        if(obstacleDist < 0.01) visibility = 1.;
        lighting = max(
          lighting,
          visibility * applyPointLight(
            pos, vec3(1.), normal,
            pointLights[${i}].pos, pointLights[${i}].color
          )
        );
      `
    })
    .join('')}

  return lighting;
}
`

function PointLight({ pos, color }) {
  this.pos = pos ?? [0, 0, 0]
  this.color = color ?? [1, 1, 1]
  this.build = (index) => ({
    [`pointLights[${index}].pos`]: this.pos,
    [`pointLights[${index}].color`]: this.color,
  })
}
