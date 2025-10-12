let tina

function setup() {
  createCanvas(windowWidth, windowHeight)
  tina = new Tina(width * 2, height * 2)

  tina.build(/* glsl */ `
    #define turn(x) pow(abs(cos(x)), 2.)
    float dWave(vec2 xy, float A) {
      float d = xy.y - A * (
        asin(sin(xy.x)) * turn(time * .1) +
        sin(xy.x)       * turn(time * .1 + PI/2.)
      );
      return d;
    }
    float dFilledWave(vec2 xy, float A, float w) {
      float d1 = dWave(xy + vec2(0.,  w), A);
      float d2 = dWave(xy + vec2(0., -w), A);
      return d1 * d2;
    }
    float dShape(vec2 xy, float offset) {
      float A =
        .06 * turn(time * .1) +
        .03 * turn(time * .1 + PI/2.);
      float w = A * PI / 2.;
      float f = 1. / A;
      float s = A * TWO_PI;
      xy.y = xy.y - s * round(xy.y / s);
      xy = xy * vec2(f, 1.) + vec2(-offset, 0.);
      return dFilledWave(xy, A, w);
    }
    ---
    vec2 xy = uv * 2. - 1.; xy.x *= (width / height);

    vec2 polar = toPolar(xy);
    float sections = 8.;
    polar.y = mod(polar.y, PI / (sections / 2.));
    xy = toCartesian(polar);

    vec3 c1 = hsv2rgb(.0, 1., 1.);
    c1 *= step(dShape(xy,  time), 0.); // smoothstep(.0005, 0., dShape(xy,  time))
    vec3 c2 = hsv2rgb(.5, 1., 1.);
    c2 *= step(dShape(xy, -time), 0.);

    fragColor = vec4(max(c1, c2), 1.);
  `)
}

function draw() {
  const graphics = tina.update()
  image(graphics, 0, 0, width, height)
}
