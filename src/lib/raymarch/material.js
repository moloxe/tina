const MATERIAL_ID = {
  parent: 0, // Represents a group of materials
  // TODO: Add more shapes from https://iquilezles.org/articles/distfunctions/
  sphere: 1,
  box: 2,
  capsule: 15,
}

const buildMaterials = (MATERIALS) => /* glsl */ `

struct Material {
  vec3 pos;
  vec3 rotation;
  vec3 color;
  float shininess;
  int shape;
  float radius;
  vec3 dimensions;
  vec3 start;
  vec3 end;
  int collisionGroup;
  float smoothFactor;
  int parentIndex;
};

uniform Material materials[${MATERIALS}];
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
  smoothFactor = 0,
  parentIndex = -1,
  sdFunc = '',
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
  this.smoothFactor = smoothFactor
  this.parentIndex = parentIndex
  this.sdFunc = sdFunc

  this.customShapeId = (() => {
    if (this.sdFunc) {
      this.shape = this.sdFunc
      MATERIAL_ID[this.sdFunc] = floor(100 + random(1000))
      return MATERIAL_ID[this.sdFunc]
    }
    return null
  })()

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
    [`materials[${index}].smoothFactor`]: this.smoothFactor,
    [`materials[${index}].parentIndex`]: this.parentIndex,
  })
}
