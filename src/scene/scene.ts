// The one lazy 3D island: renderer, camera, scroll, cursor and tilt, presets.
import * as THREE from 'three/webgpu';
import { color, length, mix, pass, screenUV, smoothstep, vec2 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CONFIG, FpsWatcher, PRESETS, startPreset, type Choice, type Preset } from './presets';
import { U, buildWorld, type World } from './world';

const STYLES = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

export async function startScene(canvas: HTMLCanvasElement, choice: Choice) {
  const renderer = new THREE.WebGPURenderer({
    canvas, antialias: true, forceWebGL: new URLSearchParams(location.search).has('webgl'),
  });
  await renderer.init();
  const webgpu = !!(renderer.backend as any).isWebGPUBackend;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.backgroundNode = mix(color(0x0b1a36), color(0x02050c), smoothstep(0, 0.85, length(screenUV.sub(vec2(0.5, 0.4)))));
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

  let preset: Preset = choice === 'auto' ? startPreset(webgpu) : choice;
  let auto = choice === 'auto';
  let world: World;
  let pipeline: THREE.RenderPipeline | null = null;
  const onPreset = new Set<(p: Preset) => void>();

  function apply(p: Preset) {
    preset = p;
    world?.dispose();
    if (world) scene.remove(world.root);
    world = buildWorld(p);
    scene.add(world.root);
    renderer.setPixelRatio(Math.min(devicePixelRatio, CONFIG[p].dpr));
    pipeline?.dispose();
    pipeline = null;
    if (CONFIG[p].bloom) {
      const out = pass(scene, camera).getTextureNode('output');
      const glow = bloom(out, 0.6, 0.4, 0.35);
      glow.setResolutionScale(CONFIG[p].bloom);
      pipeline = new THREE.RenderPipeline(renderer, out.add(glow));
    }
    resize();
    onPreset.forEach((f) => f(p));
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);

  // Cursor (or finger) on the z = 0 plane parts the particles; it and phone tilt aim the V.
  const aim = new THREE.Vector2(), aimNow = new THREE.Vector2();
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  addEventListener('pointermove', (e) => {
    aim.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(aim, camera);
    if (ray.ray.intersectPlane(plane, hit)) U.cursor.value.copy(hit);
  });
  addEventListener('pointerleave', () => U.cursor.value.set(99, 99, 0));
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    aim.set(THREE.MathUtils.clamp(e.gamma / 30, -1, 1), THREE.MathUtils.clamp((45 - e.beta) / 30, -1, 1));
  });
  // iOS asks before it sends orientation, and only from a tap.
  const D = DeviceOrientationEvent as any;
  if (typeof D?.requestPermission === 'function') {
    addEventListener('touchend', () => D.requestPermission().catch(() => {}), { once: true });
  }

  // Wall tween, driven by the page's Connect button and protocol chips.
  let tween: { from: number; to: number; t0: number; dur: number; done: () => void } | null = null;
  const shatterTo = (to: number, dur: number) => new Promise<void>((done) => {
    tween?.done();
    tween = { from: U.shatter.value, to, t0: performance.now(), dur: dur * 1000, done };
  });

  const watcher = new FpsWatcher((p) => apply(p));
  const eye0 = new THREE.Vector3(0, 0, 10), eye1 = new THREE.Vector3(9, 2.6, 14);
  const look0 = new THREE.Vector3(0, -1.7, 0), look1 = new THREE.Vector3(0, -3.2, 0);
  const eye = new THREE.Vector3(), look = new THREE.Vector3();
  let last = performance.now();
  let started = false;

  apply(preset);
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    watcher.tick(now, preset, auto);

    const target = THREE.MathUtils.clamp(scrollY / innerHeight, 0, 1);
    U.burst.value += (target - U.burst.value) * Math.min(1, dt * 5);
    const b = THREE.MathUtils.smoothstep(U.burst.value, 0, 1);

    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.dur);
      U.shatter.value = tween.from + (tween.to - tween.from) * k;
      if (k === 1) { tween.done(); tween = null; }
    }

    // The V tilts toward the cursor, then its bars fly apart as it bursts.
    aimNow.lerp(aim, Math.min(1, dt * 4));
    world.v.rotation.set(-aimNow.y * 0.3, aimNow.x * 0.45 + b * 1.5, 0);
    const gone = THREE.MathUtils.smoothstep(U.burst.value, 0.05, 0.4);
    world.v.scale.setScalar(Math.max(1 - gone, 0.0001));
    world.v.visible = gone < 1;
    world.bars[0].position.x = -gone * 2.5;
    world.bars[1].position.x = gone * 2.5;

    const fit = Math.max(1, 1.1 / camera.aspect); // pull back on portrait screens
    eye.lerpVectors(eye0, eye1, b).multiplyScalar(fit);
    look.lerpVectors(look0, look1, b).multiplyScalar(fit);
    camera.position.copy(eye);
    camera.lookAt(look);

    if (pipeline) pipeline.render(); else renderer.render(scene, camera);
    if (!started) { started = true; document.documentElement.classList.add('live'); }
  });

  return {
    webgpu,
    get preset() { return preset; },
    get fps() { return watcher.fps; },
    onPreset,
    setChoice(c: Choice) {
      auto = c === 'auto';
      apply(auto ? startPreset(webgpu) : c);
    },
    setStyle(i: number) { U.style.value.fromArray(STYLES[i]); },
    shatterTo,
  };
}

export type Stage = Awaited<ReturnType<typeof startScene>>;
export { PRESETS };
