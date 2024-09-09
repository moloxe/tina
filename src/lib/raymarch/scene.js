function Scene() {
  this.materials = []
  this.pointLights = []
  this.box = function (props) {
    this.materials.push(
      new Material({
        ...props,
        shape: 'box',
      })
    )
  }
  this.sphere = function (props) {
    this.materials.push(
      new Material({
        ...props,
        shape: 'sphere',
      })
    )
  }
  this.pointLight = function (props) {
    this.pointLights.push(new PointLight(props))
  }
  this.getUniforms = function () {
    const uniforms = {}
    this.materials.forEach((material, index) => {
      Object.assign(uniforms, material.getUniforms(index))
    })
    this.pointLights.forEach((pointLight, index) => {
      Object.assign(uniforms, pointLight.getUniforms(index))
    })
    return uniforms
  }
}
