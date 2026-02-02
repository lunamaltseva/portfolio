import { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec2, Texture } from 'ogl';

interface PrismaticBurstProps {
  intensity?: number;
  speed?: number;
  animationType?: 'rotate' | 'rotate3d' | 'hover';
  colors?: string[];
  distort?: number;
  offset?: [number, number];
  rayCount?: number;
  paused?: boolean;
  hoverDampness?: number;
  mixBlendMode?: string;
  grain?: number;
  saturation?: number;
}

const vertex = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uDistort;
  uniform float uRayCount;
  uniform vec2 uMouse;
  uniform vec2 uOffset;
  uniform sampler2D uColorTexture;
  uniform float uGrain;
  uniform float uSaturation;

  varying vec2 vUv;

  #define PI 3.14159265359

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Film grain noise
  float grain(vec2 uv, float t) {
    return hash(uv + fract(t * 0.001)) * 2.0 - 1.0;
  }

  // Desaturate color
  vec3 desaturate(vec3 color, float amount) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(color, vec3(gray), 1.0 - amount);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
    uv += uOffset;

    float angle = atan(uv.y, uv.x);
    float dist = length(uv);

    // Slow rotation
    angle += uTime * 0.08;

    // Organic distortion with multiple noise layers
    float distortion = noise(uv * 2.0 + uTime * 0.2) * uDistort;
    distortion += noise(uv * 4.0 - uTime * 0.15) * uDistort * 0.5;
    angle += distortion;

    // Create soft rays with varying widths
    float rays = 0.0;
    rays += sin(angle * uRayCount + uTime * 0.3) * 0.5 + 0.5;
    rays += sin(angle * uRayCount * 0.5 + uTime * 0.2 + 1.0) * 0.3 + 0.3;
    rays = pow(rays * 0.6, 1.5);

    // Smooth center falloff - rays don't reach center
    float innerDark = smoothstep(0.15, 0.5, dist);
    float outerFade = 1.0 - smoothstep(0.6, 1.4 + uIntensity * 0.3, dist);
    float falloff = innerDark * outerFade;

    // Color sampling from gradient
    float colorIndex = fract(angle / (2.0 * PI) + uTime * 0.05);
    vec3 color = texture2D(uColorTexture, vec2(colorIndex, 0.5)).rgb;

    // Apply ray pattern and falloff
    color *= rays * falloff;
    color *= uIntensity;

    // Desaturate for muted look
    color = desaturate(color, uSaturation);

    // Add film grain
    float grainNoise = grain(gl_FragCoord.xy * 0.5, uTime) * uGrain;
    color += grainNoise * 0.15;

    // Subtle vignette
    vec2 vignetteUv = vUv * 2.0 - 1.0;
    float vignette = 1.0 - dot(vignetteUv, vignetteUv) * 0.3;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [0, 0, 0];
}

function createGradientTexture(gl: any, colors: string[]): Texture {
  const width = 256;
  const data = new Uint8Array(width * 4);

  for (let i = 0; i < width; i++) {
    const t = i / (width - 1);
    const colorIndex = t * (colors.length - 1);
    const index1 = Math.floor(colorIndex);
    const index2 = Math.min(index1 + 1, colors.length - 1);
    const blend = colorIndex - index1;

    const color1 = hexToRgb(colors[index1]);
    const color2 = hexToRgb(colors[index2]);

    data[i * 4] = Math.round((color1[0] * (1 - blend) + color2[0] * blend) * 255);
    data[i * 4 + 1] = Math.round((color1[1] * (1 - blend) + color2[1] * blend) * 255);
    data[i * 4 + 2] = Math.round((color1[2] * (1 - blend) + color2[2] * blend) * 255);
    data[i * 4 + 3] = 255;
  }

  const texture = new Texture(gl, {
    image: data,
    width: width,
    height: 1,
    generateMipmaps: false,
  });

  return texture;
}

export default function PrismaticBurst({
  intensity = 1,
  speed = 1,
  animationType = 'rotate',
  colors = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'],
  distort = 0.3,
  offset = [0, 0],
  rayCount = 8,
  paused = false,
  hoverDampness = 0.05,
  mixBlendMode = 'normal',
  grain = 0.5,
  saturation = 1.0,
}: PrismaticBurstProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const colorTexture = createGradientTexture(gl, colors);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uResolution: { value: new Vec2(gl.canvas.width, gl.canvas.height) },
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uDistort: { value: distort },
        uRayCount: { value: rayCount },
        uMouse: { value: new Vec2(0.5, 0.5) },
        uOffset: { value: new Vec2(offset[0], offset[1]) },
        uColorTexture: { value: colorTexture },
        uGrain: { value: grain },
        uSaturation: { value: saturation },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      renderer.setSize(container!.offsetWidth, container!.offsetHeight);
      program.uniforms.uResolution.value.set(gl.canvas.width, gl.canvas.height);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      mouseRef.current.targetX = (e.clientX - rect.left) / rect.width;
      mouseRef.current.targetY = 1 - (e.clientY - rect.top) / rect.height;
    }

    window.addEventListener('resize', resize);
    if (animationType === 'hover') {
      container.addEventListener('mousemove', onMouseMove);
    }
    resize();

    let animationId: number;
    let startTime = performance.now();

    function animate() {
      if (!paused) {
        const elapsed = (performance.now() - startTime) / 1000;
        program.uniforms.uTime.value = elapsed * speed;

        // Smooth mouse movement
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * hoverDampness;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * hoverDampness;
        program.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);

        program.uniforms.uIntensity.value = intensity;
        program.uniforms.uDistort.value = distort;
        program.uniforms.uRayCount.value = rayCount;
        program.uniforms.uOffset.value.set(offset[0], offset[1]);
        program.uniforms.uGrain.value = grain;
        program.uniforms.uSaturation.value = saturation;

        renderer.render({ scene: mesh });
      }
      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (animationType === 'hover') {
        container.removeEventListener('mousemove', onMouseMove);
      }
      container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [intensity, speed, animationType, colors, distort, offset, rayCount, paused, hoverDampness, grain, saturation]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
        mixBlendMode: mixBlendMode as any,
      }}
    />
  );
}
