let tina, fft, mic, spectrum

function setup() {
  createCanvas(windowWidth, windowHeight)

  tina = new Tina(width, height)

  const bands = 512

  fft = new p5.FFT(0, bands)
  mic = new p5.AudioIn()
  mic.start()
  fft.setInput(mic)

  spectrum = fft.analyze()

  setInterval(() => {
    spectrum = fft.analyze()
    for (let i = 0; i < spectrum.length; i++) {
      let spec = spectrum[i] || 0
      spec = map(spec, 0, 255, 0, 1)
      spectrum[i] = spec
    }
  }, 1000 / 30)

  tina.build(/* glsl */ `
    uniform sampler2D graphics;
    uniform float spectrum[${bands}];

    ---

    float i = uv.x * width;
    float j = height - uv.y * height;
    i = i + 1.0;

    vec4 prev = texture(
      graphics,
      vec2(i / width, j / height)
    );

    bool isCurrent = i > width - 1.0;

    if(isCurrent) {
      float freq = uv.y;
      float spec = spectrum[int(freq * ${bands}.0)];
      float amp = pow(sin(spec * PI/2.), 2.);
      fragColor = vec4(
        hsv2rgb(freq, 1. - amp, amp), 1.0
      );
    } else {
      fragColor = vec4(prev.rgb, 1.0);
    }
  `)
}

let graphics
function draw() {
  const uniforms = { spectrum }
  if (graphics) uniforms.graphics = graphics
  graphics = tina.update(uniforms)
  image(graphics, 0, 0, width, height)
}
