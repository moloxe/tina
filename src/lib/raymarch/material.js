// TODO: Add more shapes
const MATERIAL_ID = {
  sphere: 1,
  box: 2,
  capsule: 15,
}

const buildMaterials = (scene) => /* glsl */ `

struct Material {
  vec3 pos;
  vec3 rotation;
  vec3 color;
  float shininess;
  int shape; // 1: sphere, 2: box
  float radius;
  vec3 dimensions;
  vec3 start;
  vec3 end;
  int collisionGroup;
};

uniform Material materials[${scene.materials.length}];

${TINA_RAYMARCH}

${buildLights(scene.pointLights.length)}
`

function Material({
  pos = [0, 0, 0],
  rotation = [0, 0, 0],
  color = [1, 1, 1],
  shape = 'box',
  radius = 0.1,
  dimensions = [0.1, 0.1, 0.1],
  shininess = 1,
  start = [0, 0, 0],
  end = [0, 0, 0],
  collisionGroup = -1,
}) {
  this.pos = pos
  this.rotation = rotation
  this.color = color
  this.shape = shape
  this.radius = radius
  this.dimensions = dimensions
  this.shininess = shininess
  this.start = start
  this.end = end
  this.collisionGroup = collisionGroup
  this.getUniforms = (index) => ({
    [`materials[${index}].pos`]: this.pos,
    [`materials[${index}].rotation`]: this.rotation,
    [`materials[${index}].color`]: this.color,
    [`materials[${index}].shape`]: MATERIAL_ID[this.shape],
    [`materials[${index}].radius`]: this.radius,
    [`materials[${index}].dimensions`]: this.dimensions,
    [`materials[${index}].shininess`]: this.shininess,
    [`materials[${index}].start`]: this.start,
    [`materials[${index}].end`]: this.end,
    [`materials[${index}].collisionGroup`]: this.collisionGroup,
  })
}
