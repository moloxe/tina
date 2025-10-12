let capture, tina

function setup() {
  const RATIO = windowWidth / windowHeight
  createCanvas(windowWidth, windowHeight)
  const dim = [width, height]
  capture = createCapture(VIDEO, { flipped: false })
  capture.size(...dim)
  capture.hide()

  tina = new Tina(...dim)

  tina.build(/* glsl */ `
    // https://www.shadertoy.com/view/llBGWc
    #define padding 0.05
    #define threshold 0.55
    uniform sampler2D capture;
    const float ratio = (4. / 3.) / ${RATIO.toFixed(4)};

    vec4 getBg() {
      vec2 xy = uv.xy * 2. - 1.;
      xy *= vec2(width / height, -1.);
      
      vec2 origin = xy * 3.;
      float x = origin.x;
      float y = origin.y;
      vec2 target = vec2(x * x - y * y - 4., 2. * x * y);

      float t = sin(time + PI) * .5 + .5;
      target = (1. - t) * origin + t * target;

      float angleO = atan(origin.y, origin.x);
      float angleT = atan(target.y, target.x);

      float eDist = length(origin - target);
      float aDist = getAngularDist(angleO, angleT);
      aDist = aDist / (2. * PI);

      vec3 bg = hsv2rgb(vec3(aDist, 1., log(1. + eDist)));
      return vec4(bg, 1.);
    }

    vec4 getCameraPix() {
      vec2 fixedUv = vec2(
        1. - (uv.x / ratio) * 2.,
        uv.y * 2. - 1.
      );
      if(
        fixedUv.x > 1. || fixedUv.x < 0. ||
        fixedUv.y > 1. || fixedUv.y < 0.
      ) return vec4(0., 1., 0., 1.);
      vec4 pix = texture(capture, fixedUv);
      return pix;
    }

    vec4 mixCapture(vec4 bg, vec4 cameraPix) {
      vec3 diff = cameraPix.rgb - vec3(0., 1., 0.);
      float fac = smoothstep(
        threshold - padding,
        threshold + padding,
        dot(diff, diff)
      );
      return mix(cameraPix, bg, 1. - fac);
    }
    ---
    vec4 bg = getBg();
    vec4 cameraPix = getCameraPix();
	  fragColor = mixCapture(bg, cameraPix);
  `)
}

const uniforms = {}
function draw() {
  if (capture) uniforms.capture = capture
  const graphics = tina.update(uniforms)
  image(graphics, 0, 0, width, height)
}
