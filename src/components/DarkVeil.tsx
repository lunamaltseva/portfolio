import { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl';

interface DarkVeilProps {
  hueShift?: number;
  noiseIntensity?: number;
  scanlineIntensity?: number;
  warpAmount?: number;
  scanlineFrequency?: number;
  speed?: number;
  resolutionScale?: number;
}

const vertex = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uHueShift;
  uniform float uNoiseIntensity;
  uniform float uScanlineIntensity;
  uniform float uWarpAmount;
  uniform float uScanlineFrequency;

  #define PI 3.14159265359

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  float cppn(vec2 p, float t) {
    float n1 = snoise(p * 2.0 + t * 0.3);
    float n2 = snoise(p * 4.0 - t * 0.2);
    float n3 = snoise(p * 8.0 + t * 0.1);

    float v = sin(p.x * 3.0 + n1 * 2.0) * cos(p.y * 3.0 + n2 * 2.0);
    v += sin(length(p) * 5.0 - t) * 0.5;
    v += n3 * 0.25;

    return v * 0.5 + 0.5;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 p = (uv - 0.5) * 2.0;
    p.x *= uResolution.x / uResolution.y;

    // Warp effect
    float warp = snoise(p * 2.0 + uTime * 0.2) * uWarpAmount;
    p += warp;

    // Base pattern
    float pattern = cppn(p, uTime);

    // Dark purple/blue veil color palette
    vec3 color1 = vec3(0.0, 0.0, 0.0);
    vec3 color2 = vec3(0.15, 0.05, 0.25);
    vec3 color3 = vec3(0.08, 0.02, 0.18);

    vec3 color = mix(color1, color2, pattern * 0.6);
    color = mix(color, color3, snoise(p * 3.0 - uTime * 0.1) * 0.5 + 0.5);

    // Hue shift (for grayscale, this creates subtle color tints)
    if (uHueShift > 0.0) {
      vec3 hsv = rgb2hsv(color);
      hsv.x += uHueShift / 360.0;
      color = hsv2rgb(hsv);
    }

    // Noise grain
    float noise = snoise(uv * 500.0 + uTime * 10.0) * uNoiseIntensity * 0.1;
    color += noise;

    // Scanlines
    float scanline = sin(uv.y * uScanlineFrequency * PI * 2.0) * 0.5 + 0.5;
    color -= scanline * uScanlineIntensity * 0.1;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function DarkVeil({
  hueShift = 0,
  noiseIntensity = 0.5,
  scanlineIntensity = 0,
  warpAmount = 0.3,
  scanlineFrequency = 0,
  speed = 1,
  resolutionScale = 1,
}: DarkVeilProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      alpha: false,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2) * resolutionScale,
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uResolution: { value: new Vec2(gl.canvas.width, gl.canvas.height) },
        uTime: { value: 0 },
        uHueShift: { value: hueShift },
        uNoiseIntensity: { value: noiseIntensity },
        uScanlineIntensity: { value: scanlineIntensity },
        uWarpAmount: { value: warpAmount },
        uScanlineFrequency: { value: scanlineFrequency },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      renderer.setSize(container!.offsetWidth, container!.offsetHeight);
      program.uniforms.uResolution.value.set(gl.canvas.width, gl.canvas.height);
    }

    window.addEventListener('resize', resize);
    resize();

    let animationId: number;
    let startTime = performance.now();

    function animate() {
      const elapsed = (performance.now() - startTime) / 1000;
      program.uniforms.uTime.value = elapsed * speed;
      program.uniforms.uHueShift.value = hueShift;
      program.uniforms.uNoiseIntensity.value = noiseIntensity;
      program.uniforms.uScanlineIntensity.value = scanlineIntensity;
      program.uniforms.uWarpAmount.value = warpAmount;
      program.uniforms.uScanlineFrequency.value = scanlineFrequency;

      renderer.render({ scene: mesh });
      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [hueShift, noiseIntensity, scanlineIntensity, warpAmount, scanlineFrequency, speed, resolutionScale]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
      }}
    />
  );
}
