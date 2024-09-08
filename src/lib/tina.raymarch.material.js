const buildMaterials = (MATERIALS, LIGHTS) => /* glsl */ `
  struct Material {
    vec3 pos;
    vec3 color;
    int shape; // 1: sphere, 2: box
    float radius;
    vec3 dimensions;
  };

  uniform Material materials[${MATERIALS}];

  float sdScene(vec3 p) {
    float d = 1e10;
    for (int i = 0; i < ${MATERIALS}; i++) {
      Material m = materials[i];
      if (m.shape == 1) {
        d = min(d, sdSphere(p - m.pos, m.radius));
      } else if (m.shape == 2) {
        d = min(d, sdBox(p - m.pos, m.dimensions));
      }
    }
    return d;
  }

  ${TINA_RAYMARCH}

  ${buildLights(LIGHTS)}
`

const MATERIAL_ID = {
  sphere: 1,
  box: 2,
}

// TODO: Add more shapes and rotation
function Material({ pos, color, shape, radius, dimensions }) {
  this.pos = pos ?? [0, 0, 0]
  this.color = color ?? [1, 1, 1]
  this.shape = shape ?? 'box'
  this.radius = radius ?? 0.1
  this.dimensions = dimensions ?? [0.1, 0.1, 0.1]
  this.build = (index) => ({
    [`materials[${index}].pos`]: this.pos,
    [`materials[${index}].color`]: this.color,
    [`materials[${index}].shape`]: MATERIAL_ID[this.shape],
    [`materials[${index}].radius`]: this.radius,
    [`materials[${index}].dimensions`]: this.dimensions,
  })
}
