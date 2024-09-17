const TINA_RAYMARCH_SCENE = /* glsl */ `
struct ScemeCam {
  vec3 pos;
  vec3 spherical;
  float fov;
};
uniform ScemeCam sceneCam;

---

uv = uv * 2. - 1.;
uv.x *= width/height;

vec3 pos = sceneCam.pos;
vec3 spherical = sceneCam.spherical;

float radFov = radians(sceneCam.fov);
float focalLength = 1. / tan(radFov * .5);

vec3 ro = vec3(0.);
ro.z += spherical.x;
ro *= rotateX(spherical.z);
ro *= rotateY(spherical.y);
ro += pos;

vec3 rd = normalize(vec3(uv, -focalLength));
rd *= rotateX(spherical.z);
rd *= rotateY(spherical.y);

vec3 lighting = calcLightning(ro, rd);

fragColor = vec4(lighting, 1.);
`

function Scene() {
  this.materials = []
  this.pointLights = []
  this.pos = [0, 0, 0]
  this.spherical = [0, 0, 0]
  this.fov = 90
  this.box = function (props) {
    const index = this.materials.length
    this.materials.push(
      new Material({
        ...props,
        shape: 'box',
      })
    )
    return this.materials[index]
  }
  this.sphere = function (props) {
    const index = this.materials.length
    this.materials.push(
      new Material({
        ...props,
        shape: 'sphere',
      })
    )
    return this.materials[index]
  }
  this.capsule = function (props) {
    const index = this.materials.length
    this.materials.push(
      new Material({
        ...props,
        shape: 'capsule',
      })
    )
    return this.materials[index]
  }
  this.pointLight = function (props) {
    const index = this.pointLights.length
    this.pointLights.push(new PointLight(props))
    return this.pointLights[index]
  }
  this.getUniforms = function () {
    const uniforms = {}
    this.materials.forEach((material, index) => {
      Object.assign(uniforms, material.getUniforms(index))
    })
    this.pointLights.forEach((pointLight, index) => {
      Object.assign(uniforms, pointLight.getUniforms(index))
    })
    uniforms['sceneCam.pos'] = this.pos
    uniforms['sceneCam.spherical'] = this.spherical
    uniforms['sceneCam.fov'] = this.fov
    return uniforms
  }
}
