import { Renderer, Camera, Geometry, Program, Mesh } from 'https://esm.sh/ogl';

const COLORS    = ['#22c55e', '#6366f1', '#a78bfa', '#3b82f6', '#14b8a6', '#ffffff'];
const COUNT     = 800;
const SPREAD    = 30;
const SPEED     = 1.1;
const BASE_SIZE = 300;
const SIZE_RAND = 1;
const CAM_DIST  = 20;
const ALPHA     = true;
const DPR       = Math.min(window.devicePixelRatio || 1, 2);

const hexToRgb = hex => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
  const int = parseInt(hex, 16);
  return [((int>>16)&255)/255, ((int>>8)&255)/255, (int&255)/255];
};

const vertex = `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  varying vec4 vRandom;
  varying vec3 vColor;
  void main() {
    vRandom = random;
    vColor = color;
    vec3 pos = position * uSpread;
    pos.z *= 10.0;
    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
    vec4 mvPos = viewMatrix * mPos;
    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    }
    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = `
  precision highp float;
  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    if(uAlphaParticles < 0.5) {
      if(d > 0.5) discard;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`;

const container = document.getElementById('particles-bg');
if (!container) throw new Error('Missing #particles-bg');

const renderer = new Renderer({ dpr: DPR, depth: false, alpha: true });
const gl = renderer.gl;
gl.clearColor(0, 0, 0, 0);
container.insertBefore(gl.canvas, container.firstChild);

const camera = new Camera(gl, { fov: 15 });
camera.position.set(0, 0, CAM_DIST);

const resize = () => {
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
};
window.addEventListener('resize', resize);
resize();

const positions = new Float32Array(COUNT * 3);
const randoms   = new Float32Array(COUNT * 4);
const colors    = new Float32Array(COUNT * 3);

for (let i = 0; i < COUNT; i++) {
  let x, y, z, len;
  do {
    x = Math.random()*2-1; y = Math.random()*2-1; z = Math.random()*2-1;
    len = x*x + y*y + z*z;
  } while (len > 1 || len === 0);
  const r = Math.cbrt(Math.random());
  positions.set([x*r, y*r, z*r], i*3);
  randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i*4);
  const col = hexToRgb(COLORS[Math.floor(Math.random() * COLORS.length)]);
  colors.set(col, i*3);
}

const geometry = new Geometry(gl, {
  position: { size: 3, data: positions },
  random:   { size: 4, data: randoms },
  color:    { size: 3, data: colors },
});

const program = new Program(gl, {
  vertex, fragment,
  uniforms: {
    uTime:           { value: 0 },
    uSpread:         { value: SPREAD },
    uBaseSize:       { value: BASE_SIZE * DPR },
    uSizeRandomness: { value: SIZE_RAND },
    uAlphaParticles: { value: ALPHA ? 1 : 0 },
  },
  transparent: true,
  depthTest: false,
});

const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });

let lastTime = performance.now();
let elapsed  = 0;

(function loop(t) {
  requestAnimationFrame(loop);
  const delta = t - lastTime;
  lastTime = t;
  elapsed += delta * SPEED;
  program.uniforms.uTime.value = elapsed * 0.001;
  renderer.render({ scene: mesh, camera });
})(performance.now());
