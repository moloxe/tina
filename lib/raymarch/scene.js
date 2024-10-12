const TINA_RAYMARCH_SCENE = /* glsl */ `
struct ScemeCam {
  vec3 pos;
  vec3 spherical;
  float fov;
};

uniform ScemeCam sceneCam;

vec4 calcScene() {
#ifdef USE_INTERLACING
  int y = int(uv.y * height);
  if(y % 2 == frameCount % 2) return vec4(0.);
#endif

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

  vec3 lighting = calcLightning(ro, rd);

  return vec4(lighting, 1.);
}
`
