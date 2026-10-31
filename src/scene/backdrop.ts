// The inner pages' 3D: only the turning Earth from the main page, nothing else to load.
import * as THREE from 'three/webgpu';
import { color, length, mix, screenUV, smoothstep, vec2 } from 'three/tsl';
import { CONFIG, savedChoice, startPreset } from './presets';
import { FOV } from './world';
import { buildEarth } from './earth';

export async function startBackdrop(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  await renderer.init();
  const choice = savedChoice();
  const preset = choice === 'auto' ? startPreset(!!(renderer.backend as any).isWebGPUBackend) : choice;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setPixelRatio(Math.min(devicePixelRatio, CONFIG[preset].dpr));

  const scene = new THREE.Scene();
  scene.backgroundNode = mix(color(0x0b1a36), color(0x02050c), smoothstep(0, 0.85, length(screenUV.sub(vec2(0.5, 0.4)))));
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  scene.add(camera);
  const earth = buildEarth();
  earth.setPreset(preset);
  camera.add(earth.object);

  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();
  renderer.setAnimationLoop(() => {
    earth.update(performance.now(), 1);
    renderer.render(scene, camera);
    document.documentElement.classList.add('live');
  });
}
