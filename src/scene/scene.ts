// The one lazy 3D island: renderer, camera, cursor and tilt, presets. The page's ScrollTriggers
// write `progress`; the page's DOM says where the titles and the menu bar icon sit.
import * as THREE from 'three/webgpu';
import { color, length, mix, pass, screenUV, smoothstep, vec2 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CONFIG, FpsWatcher, PRESETS, startPreset, type Choice, type Preset } from './presets';
import { U, V_HEIGHT, buildWorld, type World } from './world';

export type Progress = { burst: number; title: number; out: number };
/** An element and the pinned section it sits in: its place on screen is taken as when that section is pinned. */
export type Pinned = { el: HTMLElement; section: HTMLElement };

const FOV = 40;
const DIST = 10; // the camera of chapters 2 and 3, straight at the z = 0 plane

export async function startScene(canvas: HTMLCanvasElement, choice: Choice, progress: Progress, titles: Pinned[], icon: Pinned) {
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
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

  let preset: Preset = choice === 'auto' ? startPreset(webgpu) : choice;
  let auto = choice === 'auto';
  let world: World;
  let pipeline: THREE.RenderPipeline | null = null;
  const onPreset = new Set<(p: Preset) => void>();
  const iconAt = new THREE.Vector3();
  let iconScale = 0.1;

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

  // Screen pixels → the z = 0 plane, as seen by the chapter 2 and 3 camera.
  const halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * DIST;
  const toWorld = (x: number, y: number) => [(x / innerWidth * 2 - 1) * halfH * camera.aspect, -(y / innerHeight * 2 - 1) * halfH];
  const pinnedRect = ({ el, section }: Pinned) => {
    const r = el.getBoundingClientRect(), s = section.getBoundingClientRect();
    return { left: r.left, top: r.top - s.top, width: r.width, height: r.height };
  };

  /** The title's glyphs as points, drawn with its own font at a third of its size. */
  function sampleTitle(t: Pinned) {
    const r = pinnedRect(t), k = 1 / 3, cs = getComputedStyle(t.el);
    const c = document.createElement('canvas');
    c.width = Math.ceil(r.width * k);
    c.height = Math.ceil(r.height * k);
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * k}px ${cs.fontFamily}`;
    (ctx as any).letterSpacing = `${(parseFloat(cs.letterSpacing) || 0) * k}px`;
    ctx.textAlign = 'center';
    const text = t.el.textContent!.trim();
    const m = ctx.measureText(text);
    ctx.fillText(text, c.width / 2, c.height / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const pts: number[] = [];
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        if (data[(y * c.width + x) * 4 + 3] > 128) pts.push(...toWorld(r.left + x / k, r.top + y / k));
      }
    }
    return { pts: new Float32Array(pts), cell: (2 * halfH) / innerHeight / k };
  }

  function layout() {
    titles.forEach((t, i) => { const { pts, cell } = sampleTitle(t); world.setTitle(i, pts, cell); });
    const r = pinnedRect(icon);
    const [x, y] = toWorld(r.left + r.width / 2, r.top + r.height / 2);
    iconAt.set(x, y, 0);
    iconScale = ((r.height / innerHeight) * 2 * halfH) / V_HEIGHT;
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    layout();
  }
  addEventListener('resize', resize);
  document.fonts?.ready.then(layout);

  // Cursor (or finger) on the z = 0 plane parts the particles; it and phone tilt aim the V.
  const aim = new THREE.Vector2(), aimNow = new THREE.Vector2();
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  addEventListener('pointermove', (e) => {
    aim.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(aim, camera);
    if (ray.ray.intersectPlane(plane, hit)) U.cursor.value.copy(hit);
  });
  document.addEventListener('pointerleave', () => U.cursor.value.set(99, 99, 0));
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    aim.set(THREE.MathUtils.clamp(e.gamma / 30, -1, 1), THREE.MathUtils.clamp((45 - e.beta) / 30, -1, 1));
  });
  // iOS asks before it sends orientation, and only from a tap.
  const D = DeviceOrientationEvent as any;
  if (typeof D?.requestPermission === 'function') {
    addEventListener('touchend', () => D.requestPermission().catch(() => {}), { once: true });
  }

  const watcher = new FpsWatcher((p) => apply(p));
  const eye0 = new THREE.Vector3(0, 0, DIST), eye1 = new THREE.Vector3(0, 0, DIST);
  const look0 = new THREE.Vector3(0, -1.7, 0), look1 = new THREE.Vector3();
  const eye = new THREE.Vector3(), look = new THREE.Vector3();
  let started = false;

  apply(preset);
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    watcher.tick(now, preset, auto);
    U.burst.value = progress.burst;
    U.title.value = progress.title;
    U.out.value = progress.out;
    const b = THREE.MathUtils.smoothstep(progress.burst, 0, 1);

    // The V tilts toward the cursor, then flies into the menu bar icon as its particles leave.
    aimNow.lerp(aim, 0.08);
    world.v.rotation.set(-aimNow.y * 0.3 * (1 - b), aimNow.x * 0.45 * (1 - b), 0);
    world.v.position.copy(iconAt).multiplyScalar(b);
    world.v.scale.setScalar(THREE.MathUtils.lerp(1, iconScale, b));
    world.v.visible = progress.burst < 0.98; // the HTML icon takes over

    const fit = Math.max(1, 1.1 / camera.aspect) * (1 - b) + b; // pull back on portrait screens in chapter 1
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
    layout,
    setChoice(c: Choice) {
      auto = c === 'auto';
      apply(auto ? startPreset(webgpu) : c);
    },
  };
}

export type Stage = Awaited<ReturnType<typeof startScene>>;
export { PRESETS };
