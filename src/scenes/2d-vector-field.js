let tina

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(width, height)

  tina.build(/* glsl */ `
    #define scale vec2(3.)

    vec2 getTarget(vec2 origin) {
      float x = origin.x;
      float y = origin.y;
      return vec2(
        x*x - y*y - 4.,
        2. * x*y
      );
    }

    float getAngularDist(float angle1, float angle2) {
      float angle = angle1 - angle2;
      if (angle > PI) {
        angle -= 2.0 * PI;
      } else if (angle <= -PI) {
        angle += 2.0 * PI;
      }
      return angle;
    }

    ---

    uv = uv.xy * 2. - 1.;
    uv.x *= width / height;

    vec2 origin = vec2(uv.x, uv.y) * scale;
    vec2 target = getTarget(origin);

    float t = sin(time + PI) * .5 + .5;
    target = (1. - t) * origin + t * target;

    float angleO = atan(origin.y, origin.x);
    float angleT = atan(target.y, target.x);

    float eDist = length(origin - target);
    float aDist = getAngularDist(angleO, angleT);
    aDist = aDist / (2. * PI);

    vec3 c = hsv2rgb(vec3(aDist, 1., log(1. + eDist)));

    fragColor = vec4(c, 1.0);
  `)
}

function draw() {
  const graphics = tina.update()
  image(graphics, 0, 0, width, height)
}