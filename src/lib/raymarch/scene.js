function Scene() {
  this.materials = []
  this.pointLights = []
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
    return uniforms
  }
}
