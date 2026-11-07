# Tina

A shader helper and raymarching engine for **p5.js**.

Tina bridges the p5.js creative coding workflow with custom GLSL shaders. It removes WebGL setup boilerplate, manages uniform pipelines, and provides a built-in Signed Distance Field (SDF) raymarching engine for interactive 2D and 3D sketches.

> **Note:** For native WebGPU and WGSL without external libraries, see [ReTina](https://moloxe.com/re-tina/).

---

## What It Offers

### 1. Shader Pipeline Automation

- **Zero-Boilerplate Context**: Automatically creates and manages the underlying WebGL graphics buffer and vertex shader quad.
- **Automatic Uniforms**: Continuously updates `time`, `frameCount`, `width`, `height`, camera coordinates, and object parameters each frame.
- **Split GLSL Syntax (`---`)**: Write definitions, structs, and helper functions above `---`, and fragment coloring logic below `---`. Tina compiles and binds them into a single `#version 300 es` shader.

### 2. 3D Raymarching & SDF Scene Graph

- **Primitive Builders**: Instantiate analytical SDF shapes directly from JavaScript:
  - `tina.sphere({ pos, radius, color, shininess })`
  - `tina.box({ pos, dimensions, color, smoothFactor })`
  - `tina.capsule({ start, end, radius, color })`
  - `tina.shape({ sdFunc })` for custom implicit equations.
  - `tina.parent()` for hierarchical grouping.
- **Smooth Blending**: Built-in polynomial smooth minimum (`opSmoothUnion`) for organic modeling.
- **Lighting & Shadows**: Configurable point lights with distance attenuation, Blinn-Phong specular reflections, ambient terms, and raymarched soft shadows.
- **Orbital Camera**: Built-in spherical camera controls (`tina.spherical`, `tina.pos`, `tina.fov`).

### 3. Performance Controls

- **Scanline Interlacing**: Optional interlacing mode (`useInterlacing: true`) renders alternate rows each frame, significantly improving framerates on heavy raymarching evaluations.
- **Decoupled Resolution**: Render shaders at lower internal resolutions while scaling smoothly to the canvas dimensions.

### 4. Built-in Math & Helper Library

- Bundles Inigo Quilez distance functions, coordinate conversions (`toPolar`, `toCartesian`, `toSpherical`), procedural noise, and color helpers (`hsv2rgb`).

### 5. Native p5.js Compositing

- `tina.update()` returns a standard `p5.Graphics` object.
- Combine shader passes directly with p5.js drawing APIs, mouse/keyboard inputs, audio analysis (`p5.sound` / FFT), and webcam video streams.

---

## Quick Start

### 2D Procedural Shader

```javascript
let tina

function setup() {
  createCanvas(windowWidth, windowHeight)
  tina = new Tina(width, height)

  // Use '---' to split helper functions from main() logic
  tina.build(`
    vec2 toPolar(vec2 p) {
      return vec2(length(p), atan(p.y, p.x));
    }
    ---
    vec2 st = uv * 2.0 - 1.0;
    st.x *= width / height;

    float d = length(st) - 0.5 + sin(time * 2.0) * 0.1;
    vec3 col = vec3(smoothstep(0.01, 0.0, abs(d)));

    fragColor = vec4(col, 1.0);
  `)
}

function draw() {
  const gfx = tina.update()
  image(gfx, 0, 0, width, height)
}
```

---

### 3D Raymarched Scene

```javascript
let tina
const spherical = [2.5, 0, 0] // [distance, theta, phi]

function setup() {
  createCanvas(windowWidth, windowHeight)

  // Downscale internal resolution and enable interlacing for fast raymarching
  tina = new Tina(240 * (width / height), 240, { useInterlacing: true })

  // Point lighting with shadows
  tina.pointLight({
    pos: [1, 2, 2],
    color: [1, 0.9, 0.8],
    power: 5,
    computeShadows: true,
  })

  // SDF primitives
  tina.sphere({
    pos: [0, 0, 0],
    radius: 0.35,
    color: [0.9, 0.3, 0.2],
    shininess: 32,
  })

  tina.box({
    pos: [0, -0.4, 0],
    dimensions: [1.0, 0.05, 1.0],
    color: [0.2, 0.6, 0.8],
    shininess: 8,
  })

  // Compile raymarching scene shader
  tina.build()
}

function draw() {
  tina.spherical = spherical
  const gfx = tina.update()
  image(gfx, 0, 0, width, height)
}

function mouseDragged() {
  spherical[1] -= movedX * 0.01
  spherical[2] -= movedY * 0.01
}
```

---

## Included Sketches

Interactive sketches located under `src/pages/_sketches/`:

| Sketch                         | Description                                                     |
| ------------------------------ | --------------------------------------------------------------- |
| `rm-modeling.js`               | 3D character modeled with smooth-unioned primitives and shadows |
| `rm-simplex-noise-terrain.js`  | Raymarched dynamic terrain driven by simplex noise              |
| `rm-simplex-noise-ocean.js`    | Procedural ocean surface simulation                             |
| `rm-periodic-surface.js`       | Repeating mathematical implicit surfaces                        |
| `rm-physics.js`                | Raymarching with simple physics and capsule collisions          |
| `basic-fft-mic.js`             | Audio-reactive 2D shader powered by `p5.AudioIn` and `p5.FFT`   |
| `basic-camera-green-screen.js` | Real-time webcam processing and chroma keying                   |
| `basic-2d-vector-field.js`     | Dynamic 2D vector field visualization                           |
| `basic-game-of-life.js`        | Cellular automata computed in fragment shader                   |
| `basic-k-means.js`             | GPU clustering and Voronoi distance experiments                 |

---

## Next Generation: ReTina

For projects requiring modern GPU pipelines, compute passes, and native performance without external dependencies, check out **[ReTina](https://moloxe.com/re-tina/)**.

ReTina rebuilds the raymarching core on **WebGPU & WGSL**:

- Direct WebGPU pipeline (TypeScript, no p5.js dependency).
- Enhanced Sphere Tracing for accelerated SDF evaluation.
- Compute passes (`RTCompute` / `RTComputeScene`) for GPU-driven distance maps.
- Ping-pong buffers for motion blur and fluid simulations.

---

## Local Development

```bash
# Install dependencies
bun install

# Start local dev server
bun dev

# Build production assets
bun build
```

---

## License

All content and sketches are licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
