const TINA_RAYMARCH_SCENE = /* glsl */ `
struct ScemeCam {
  vec3 pos;
  vec3 spherical;
  float fov;
};

uniform ScemeCam sceneCam;

struct Scene {
  vec3 rd;
  int materialIndex;
  vec3 pos;
  vec3 normal;
  vec4 color;
  bool interlaced;
};

Scene calcScene() {
  vec2 dir2d = uv * 2. - 1.;
  dir2d *= vec2(width / height, -1);

  vec3 pos = sceneCam.pos;
  vec3 spherical = sceneCam.spherical;

  float radFov = radians(sceneCam.fov);
  float focalLength = 1. / tan(radFov * .5);

  vec3 ro = vec3(0.);
  ro.z += spherical.x;
  ro *= rotateX(spherical.z);
  ro *= rotateY(spherical.y);
  ro += pos;

  vec3 rd = normalize(vec3(dir2d, -focalLength));
  rd *= rotateX(spherical.z);
  rd *= rotateY(spherical.y);

  SceneLightning sl = calcSceneLightning(ro, rd);

  return Scene(rd, sl.materialIndex, sl.pos, sl.normal, vec4(sl.light, 1.), false);
}
`
