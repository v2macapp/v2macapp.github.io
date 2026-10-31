// The one lazy 3D island: renderer, camera, cursor and tilt, presets. The page's ScrollTriggers
// write `progress`; the page's DOM says where the titles and the menu bar icon sit.
import * as THREE from 'three/webgpu';
import { color, length, mix, pass, screenUV, smoothstep, vec2, vec4 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js';
import { film } from 'three/addons/tsl/display/FilmNode.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CONFIG, FpsWatcher, PRESETS, startPreset, type Choice, type Preset } from './presets';
import { DIST, FOV, STAR_DIST, U, buildWorld, type World } from './world';
import { buildApp, type AppProgress } from './app';
import { buildEarth } from './earth';

export type Progress = { burst: number; title: number; out: number } & AppProgress;
/** An element and the pinned section it sits in: its place on screen is taken as when that section is pinned. */
export type Pinned = { el: HTMLElement; section: HTMLElement };


/** `frame`: where the HTML puts the app window in chapter 2; the 3D window follows it. */
export async function startScene(canvas: HTMLCanvasElement, choice: Choice, progress: Progress, titles: Pinned[], frame: Pinned) {
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
  scene.add(camera); // the stars hang on it

  let preset: Preset = choice === 'auto' ? startPreset(webgpu) : choice;
  let auto = choice === 'auto';
  let world: World;
  let pipeline: THREE.RenderPipeline | null = null;
  const onPreset = new Set<(p: Preset) => void>();
  const app = await buildApp();
  scene.add(app.root);
  const appAt = new THREE.Vector3();
  const earth = buildEarth();
  camera.add(earth.object);

  function apply(p: Preset) {
    preset = p;
    earth.setPreset(p);
    if (world) { world.dispose(); scene.remove(world.root); camera.remove(world.stars); }
    world = buildWorld(p);
    scene.add(world.root);
    camera.add(world.stars);
    renderer.setPixelRatio(Math.min(devicePixelRatio, CONFIG[p].dpr));
    pipeline?.dispose();
    pipeline = null;
    if (CONFIG[p].bloom) {
      const out = pass(scene, camera).getTextureNode('output');
      const glow = bloom(out, 0.6, 0.4, 0.85); // high threshold: the screenshots' white text stays crisp
      glow.setResolutionScale(CONFIG[p].bloom);
      // The camera look: colour fringes toward the edges (High and up), grain and a vignette.
      let img: any = out.add(glow);
      if (p === 'ultra' || p === 'high') img = chromaticAberration(img, 0.08, vec2(0.5, 0.5));
      img = film(img, 0.18);
      const edge = smoothstep(0.35, 0.95, length(screenUV.sub(0.5).mul(vec2(1.2, 1))));
      pipeline = new THREE.RenderPipeline(renderer, vec4(img.rgb.mul(edge.mul(-0.45).add(1)), 1));
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
    const pad = r.width * 0.2; // room on both sides: the canvas text can come out wider than the HTML box (phones)
    const c = document.createElement('canvas');
    c.width = Math.ceil((r.width + 2 * pad) * k);
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
        if (data[(y * c.width + x) * 4 + 3] > 128) pts.push(...toWorld(r.left - pad + x / k, r.top + y / k));
      }
    }
    return { pts: new Float32Array(pts), cell: (2 * halfH) / innerHeight / k };
  }

  function layout() {
    titles.forEach((t, i) => { const { pts, cell } = sampleTitle(t); world.setTitle(i, pts, cell); });
    const r = pinnedRect(frame);
    const [x, y] = toWorld(r.left + r.width / 2, r.top + r.height / 2);
    appAt.set(x, y, 0);
    app.root.scale.setScalar((r.width / innerHeight) * 2 * halfH);
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    U.aspect.value = camera.aspect;
    U.px.value = (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * STAR_DIST) / innerHeight;
    layout();
  }
  addEventListener('resize', resize);
  document.fonts?.ready.then(layout);

  // The cursor (or a finger) is a small black hole that bends the stars and titles; it and phone tilt aim the V.
  const aim = new THREE.Vector2(), aimNow = new THREE.Vector2();
  let lensTarget = 0;
  addEventListener('pointermove', (e) => {
    aim.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    U.cursor.value.copy(aim);
    lensTarget = 0.15;
  });
  const lensOff = () => { lensTarget = 0; };
  document.addEventListener('pointerleave', lensOff);
  addEventListener('pointerup', (e) => e.pointerType === 'touch' && lensOff());
  addEventListener('pointercancel', lensOff);
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    aim.set(THREE.MathUtils.clamp(e.gamma / 30, -1, 1), THREE.MathUtils.clamp((45 - e.beta) / 30, -1, 1));
  });
  // iOS asks before it sends orientation, and only from a tap.
  const D = DeviceOrientationEvent as any;
  if (typeof D?.requestPermission === 'function') {
    addEventListener('touchend', () => D.requestPermission().catch(() => {}), { once: true });
  }

  // Drag the V with a mouse and throw it: it spins on, slows and settles on a whole turn.
  const spin = new THREE.Vector2(), spinV = new THREE.Vector2(), last = new THREE.Vector2();
  let dragging = false;
  addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || progress.burst > 0.05 || (e.target as Element).closest('a, button')) return;
    dragging = true;
    last.set(e.clientX, e.clientY);
    document.documentElement.classList.add('grabbing');
  });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    spinV.set((e.clientY - last.y) / innerHeight * 4, (e.clientX - last.x) / innerWidth * 6);
    spin.add(spinV);
    last.set(e.clientX, e.clientY);
  });
  addEventListener('pointerup', () => { dragging = false; document.documentElement.classList.remove('grabbing'); });
  const TAU = Math.PI * 2;

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
    U.lens.value += (lensTarget - U.lens.value) * 0.08;
    const b = THREE.MathUtils.smoothstep(progress.burst, 0, 1);

    const fit = Math.max(1, 1.1 / camera.aspect) * (1 - b) + b; // pull back on portrait screens in chapter 1
    eye.lerpVectors(eye0, eye1, b).multiplyScalar(fit);
    look.lerpVectors(look0, look1, b).multiplyScalar(fit);
    camera.position.copy(eye);
    camera.lookAt(look);

    // The V tilts toward the cursor; scrolling brings it at the camera, which passes through the
    // glass and sees the app window refracted in it (the liquid glass zoom).
    aimNow.lerp(aim, 0.08);
    if (!dragging) {
      for (const k of ['x', 'y'] as const) {
        spinV[k] = (spinV[k] + (Math.round(spin[k] / TAU) * TAU - spin[k]) * 0.015) * 0.94;
        spin[k] += spinV[k];
      }
    }
    world.v.rotation.set(spin.x - aimNow.y * 0.3 * (1 - b), spin.y + aimNow.x * 0.45 * (1 - b), 0);
    const k = 0.985 * Math.pow(progress.burst, 1.6);
    world.v.position.copy(eye).multiplyScalar(k);
    world.v.visible = k < 0.97;
    U.vGlow.value = 1 - 0.75 * THREE.MathUtils.smoothstep(progress.burst, 0.05, 0.4);
    // Up close the room light's reflection would fill the screen with a white cloud, and thick glass
    // would smear the window: the glass thins and stops reflecting as the camera passes through.
    const glass = world.v.userData.material;
    glass.specularIntensity = glass.clearcoat = 1 - THREE.MathUtils.smoothstep(progress.burst, 0.05, 0.3);
    glass.thickness = 0.6 * (1 - 0.95 * b);
    const nodes = 1 - THREE.MathUtils.smoothstep(progress.burst, 0.05, 0.3);
    for (const o of world.v.userData.glow) { o.visible = nodes > 0; if (o.isMesh) o.scale.setScalar(nodes); }

    // The window rides with its section until the section pins.
    const top = frame.section.getBoundingClientRect().top;
    app.root.position.copy(appAt).setY(appAt.y - (top / innerHeight) * 2 * halfH);
    earth.update(now, b);
    app.root.visible = progress.build > 0.01; // its exploded corner would peek into the hero
    app.update(progress, aimNow);


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
