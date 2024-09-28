let tina

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(100 * (width / height), 100)

  tina.build(/* glsl */ `
    uniform sampler2D graphics;

    float getState(vec2 p) {
      vec4 data = texture(graphics, p);
      return step(.5, length(data.rgb));
    }

    ---

    vec2 res = vec2(width, height);

    float n = 0.;
    for(float i = -1.; i <= 1.; i++)
      for(float j = -1.; j <= 1.; j++)
        n += getState(
          uv + vec2(i, j) / res
        );

    float live = getState(uv);
    n -= live;

    vec2 circlePos = (2. * uv - 1.);
    circlePos.x *= width / height;
    circlePos += vec2(cos(time) * .5, sin(time) * .5);
    float circleDist = length(circlePos);

    if(circleDist < .1) {
      fragColor = vec4(1.);
    } else {
      if(n == 3.) live = 1.;
      else if(n > 3. || n <= 1.) live = 0.;
      fragColor = vec4(vec3(live), 1.);
    }
  `)

  frameRate(24)
  noSmooth()
}

let graphics
function draw() {
  const uniforms = {}
  if (graphics) uniforms.graphics = graphics
  graphics = tina.update(uniforms)
  image(graphics, 0, 0, width, height)
}
