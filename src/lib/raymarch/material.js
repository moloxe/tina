const MATERIAL_ID = {
  sphere: 1,
  box: 2,
}

const buildMaterials = (scene) => /* glsl */ `

struct Material {
  vec3 pos;
  vec3 color;
  float shininess;
  int shape; // 1: sphere, 2: box
  float radius;
  vec3 dimensions;
};

uniform Material materials[${scene.materials.length}];

${TINA_RAYMARCH}

${buildLights(scene.pointLights.length)}
`

// TODO: Add more shapes and rotation
function Material({
  pos = [0, 0, 0],
  color = [1, 1, 1],
  shape = 'box',
  radius = 0.1,
  dimensions = [0.1, 0.1, 0.1],
  shininess = 1,
}) {
  this.pos = pos
  this.color = color
  this.shape = shape
  this.radius = radius
  this.dimensions = dimensions
  this.shininess = shininess
  this.getUniforms = (index) => ({
    [`materials[${index}].pos`]: this.pos,
    [`materials[${index}].color`]: this.color,
    [`materials[${index}].shape`]: MATERIAL_ID[this.shape],
    [`materials[${index}].radius`]: this.radius,
    [`materials[${index}].dimensions`]: this.dimensions,
    [`materials[${index}].shininess`]: this.shininess,
  })
}
