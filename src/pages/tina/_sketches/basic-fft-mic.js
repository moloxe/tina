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

    vec2 coord = uv * vec2(width, height);
    coord.x += 1.;

    vec4 prev = texture(
      graphics,
      coord / vec2(width, height)
    );

    bool isCurrent = coord.x > width - 1.;

    if(isCurrent) {
      float freq = 1. - uv.y;
      float spec = spectrum[int(freq * ${bands}.)];
      float amp = pow(sin(spec * PI / 2.), 2.);
      fragColor = vec4(
        hsv2rgb(freq, 1. - amp, amp), 1.
      );
    } else {
      fragColor = vec4(prev.rgb, 1.);
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
