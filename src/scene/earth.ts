// The page's backdrop: a slice of the real Earth turning below the frame, data flying between cities,
// a little fog in the air. It hangs on the camera, like the stars, so scrolling never moves it.
import * as THREE from 'three/webgpu';
import {
  abs, attribute, bumpMap, clamp, color, dot, float, fract, instancedBufferAttribute, length, max, mix, mx_fractal_noise_float,
  normalLocal, normalize, oneMinus, PI, positionLocal, positionViewDirection, pow, screenUV, sin, smoothstep,
  texture, uniform, uv, vec2, vec3, vec4,
} from 'three/tsl';
import { reducedMotion, type Preset } from './presets';

const R = 36; // far enough that everything else on the page stays in front of its nearest point
const SUN = normalize(vec3(-0.85, 0.3, 0.1)); // in camera space: day on the left, city lights on the right
const AIR = 0x6fb2ff;

const CITIES: [number, number][] = [
  [40.7, -74], [34, -118.2], [41.9, -87.6], [49.3, -123.1], [43.7, -79.4], [19.4, -99.1], [25.8, -80.2], [-23.5, -46.6],
  [-34.6, -58.4], [4.7, -74.1], [51.5, -0.1], [48.9, 2.4], [52.5, 13.4], [50.1, 8.7], [52.4, 4.9], [59.3, 18.1],
  [40.4, -3.7], [41.9, 12.5], [55.8, 37.6], [41, 29], [35.7, 51.4], [25.2, 55.3], [30, 31.2], [6.5, 3.4],
  [-1.3, 36.8], [-26.2, 28], [19.1, 72.9], [28.6, 77.2], [24.9, 67], [13.8, 100.5], [1.35, 103.8], [31.2, 121.5],
  [39.9, 116.4], [22.3, 114.2], [37.6, 127], [35.7, 139.7], [-6.2, 106.8], [-33.9, 151.2], [64.1, -21.9], [61.2, -149.9],
];

// The same axes as three's SphereGeometry, so a city lands on its place in the textures.
const onEarth = ([lat, lon]: [number, number]) => {
  const a = THREE.MathUtils.degToRad(lat), b = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(a), -Math.cos(a) * Math.sin(b));
};

/** Every city sends data to two others less than 120° away. */
function buildRoutes(clock: any) {
  const ends = CITIES.map(onEarth);
  const routes: { a: THREE.Vector3; b: THREE.Vector3; h: number; phase: number; speed: number }[] = [];
  for (const a of ends) {
    const near = ends.filter((b) => b !== a && a.angleTo(b) < 2.1).sort(() => Math.random() - 0.5).slice(0, 2);
    for (const b of near) routes.push({ a, b, h: 0.015 + 0.09 * a.angleTo(b) / Math.PI, phase: Math.random(), speed: 0.05 + Math.random() * 0.06 });
  }
  const along = (r: (typeof routes)[number], t: number) =>
    r.a.clone().lerp(r.b, t).normalize().multiplyScalar(1 + r.h * Math.sin(Math.PI * t));

  const STEPS = 48;
  const pos: number[] = [], ts: number[] = [], phases: number[] = [], speeds: number[] = [];
  for (const r of routes) {
    for (let i = 0; i < STEPS; i++) {
      for (const t of [i / STEPS, (i + 1) / STEPS]) {
        pos.push(...along(r, t).toArray());
        ts.push(t);
        phases.push(r.phase);
        speeds.push(r.speed);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('t', new THREE.Float32BufferAttribute(ts, 1));
  geo.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
  geo.setAttribute('speed', new THREE.Float32BufferAttribute(speeds, 1));

  // A faint line, and along it a bright stretch with a tail that runs from end to end. The head
  // overshoots both ends so a packet leaves and arrives instead of popping in.
  const head = fract(clock.mul(attribute('speed')).add(attribute('phase'))).mul(1.5).sub(0.05);
  const behind = head.sub(attribute('t'));
  const tail = smoothstep(0, 0.02, behind).mul(oneMinus(smoothstep(0, 0.32, behind)));
  const lm = new THREE.LineBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  lm.colorNode = vec4(mix(color(0x4f9dff), color(0xd8ecff), tail).mul(tail.mul(1.1).add(0.5)), tail.mul(0.7).add(0.05));
  const lines = new THREE.LineSegments(geo, lm);
  lines.frustumCulled = false;

  // The packet itself: a soft dot on the head of each route.
  const seed = new Float32Array(routes.length * 2), from = new Float32Array(routes.length * 3), to = new Float32Array(routes.length * 3), lift = new Float32Array(routes.length);
  routes.forEach((r, i) => { seed.set([r.phase, r.speed], i * 2); r.a.toArray(from, i * 3); r.b.toArray(to, i * 3); lift[i] = r.h; });
  const s = instancedBufferAttribute(new THREE.InstancedBufferAttribute(seed, 2));
  const f = fract(clock.mul(s.y).add(s.x)).mul(1.5).sub(0.05);
  const on = smoothstep(0, 0.03, f).mul(oneMinus(smoothstep(0.97, 1, f)));
  const dm = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  dm.positionNode = normalize(mix(instancedBufferAttribute(new THREE.InstancedBufferAttribute(from, 3)), instancedBufferAttribute(new THREE.InstancedBufferAttribute(to, 3)), clamp(f, 0, 1)))
    .mul(sin(clamp(f, 0, 1).mul(PI)).mul(instancedBufferAttribute(new THREE.InstancedBufferAttribute(lift, 1))).add(1));
  dm.scaleNode = float(0.0045);
  dm.colorNode = vec4(color(0xd8ecff).mul(1.6), smoothstep(0.5, 0, length(uv().sub(0.5))).mul(on));
  const dots = new THREE.Sprite(dm);
  dots.count = routes.length;
  dots.frustumCulled = false;

  // The cities: small steady lights.
  const cm = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  cm.positionNode = instancedBufferAttribute(new THREE.InstancedBufferAttribute(new Float32Array(ends.flatMap((e) => e.clone().multiplyScalar(1.001).toArray())), 3));
  cm.scaleNode = float(0.0035);
  cm.colorNode = vec4(color(0x9fd0ff).mul(1.1), smoothstep(0.5, 0, length(uv().sub(0.5))));
  const cities = new THREE.Sprite(cm);
  cities.count = ends.length;
  cities.frustumCulled = false;

  return [lines, dots, cities];
}

export function buildEarth() {
  const root = new THREE.Group();
  root.position.set(0, -46, -41); // the limb crosses low on the screen, under the hero text
  root.scale.setScalar(R);
  root.visible = false; // until the textures are here

  const spin = new THREE.Group(); // the planet's own turn, under a tilted axis
  const axis = new THREE.Group();
  axis.rotation.set(-0.5, 0, 0.25); // the lived-in latitudes face us, not the Arctic
  axis.add(spin);
  root.add(axis);

  const clock = uniform(0), turn = uniform(0), bright = uniform(0);
  const loader = new THREE.TextureLoader();
  const load = (name: string, srgb: boolean) => loader.loadAsync(`/earth/earth_${name}_4096.jpg`).then((t) => {
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.wrapS = THREE.RepeatWrapping;
    return t;
  });
  // Placeholders keep the shaders valid until the real images arrive; the Earth stays hidden until then.
  const dayMap = texture(new THREE.Texture()), nightMap = texture(new THREE.Texture()), detail = texture(new THREE.Texture());
  Promise.all([load('day', true), load('night', true), load('bump_roughness_clouds', false)]).then(([d, n, b]) => {
    dayMap.value = d; nightMap.value = n; detail.value = b;
    root.visible = true;
  }).catch((e) => console.warn('Earth textures unavailable', e));

  // The ground: sun, ocean glint, city lights on the night side. Unlit by the scene, so the glass V
  // and the rest of the page keep the light they had. Camera space: the sun stays put while the Earth turns.
  const n = bumpMap(detail.r, float(0.6));
  const sun = dot(n, SUN);
  const day = dayMap.rgb.mul(smoothstep(-0.08, 0.8, sun).mul(0.7));
  const glint = pow(max(dot(n, normalize(SUN.add(positionViewDirection))), 0), 90).mul(oneMinus(detail.g)).mul(smoothstep(0, 0.2, sun)).mul(0.5);
  const night = nightMap.rgb.mul(oneMinus(smoothstep(-0.15, 0.12, sun))).mul(1.5);
  const edge = oneMinus(abs(dot(n, positionViewDirection)));
  const ground = new THREE.MeshBasicNodeMaterial();
  ground.colorNode = mix(day.add(glint).add(night), color(AIR).mul(smoothstep(-0.1, 0.5, sun)), pow(edge, 3).mul(0.55)).mul(bright);
  const globe = new THREE.SphereGeometry(1, 128, 96);
  spin.add(new THREE.Mesh(globe, ground));

  // Clouds: their own shell, drifting slowly over the ground.
  const cloud = smoothstep(0.25, 0.95, detail.sample(uv().add(vec2(turn.mul(0.08), 0))).b);
  const clouds = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  clouds.colorNode = vec4(color(0xffffff).mul(smoothstep(-0.05, 0.7, sun).mul(0.42).add(0.008)).mul(bright), cloud.mul(0.8));
  const cloudMesh = new THREE.Mesh(globe, clouds);
  cloudMesh.scale.setScalar(1.004);
  cloudMesh.renderOrder = 1;
  spin.add(cloudMesh);

  spin.add(...buildRoutes(clock).map((o) => { o.renderOrder = 3; return o; }));

  // The air: a thin blue line on the lit limb. It doesn't spin, so its local normal is in camera space.
  const air = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const rim = oneMinus(abs(dot(normalLocal, positionViewDirection)));
  air.colorNode = vec4(color(AIR).mul(smoothstep(-0.25, 0.6, dot(normalLocal, SUN)).mul(0.8)).mul(bright), pow(oneMinus(smoothstep(0.72, 1, rim)), 3));
  const airMesh = new THREE.Mesh(globe, air);
  airMesh.scale.setScalar(1.035);
  airMesh.renderOrder = 2;
  root.add(airMesh);

  // Fog low over the ground: 3D noise sampled on the shell, so it has depth as the Earth turns under it.
  const fogNoise = mx_fractal_noise_float(positionLocal.mul(9).add(vec3(clock.mul(0.012), clock.mul(0.005), 0)), 4);
  const fog = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  fog.colorNode = vec4(color(0xa9ccf5).mul(dot(normalLocal, SUN).max(0.04)).mul(bright), smoothstep(0, 0.55, fogNoise).mul(0.2));
  const fogMesh = new THREE.Mesh(globe, fog);
  fogMesh.scale.setScalar(1.012);
  fogMesh.renderOrder = 2;
  root.add(fogMesh);

  // Haze hanging in front of it all, thickest low on the screen, and always behind the page's content.
  const hazeNoise = mx_fractal_noise_float(vec3(screenUV.mul(vec2(5, 3)), clock.mul(0.025)), 3);
  const hazeM = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  hazeM.colorNode = vec4(color(0x2b6fc4).mul(bright), smoothstep(-0.1, 0.6, hazeNoise).mul(oneMinus(smoothstep(0.1, 0.72, screenUV.y.oneMinus()))).mul(0.11));
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), hazeM);
  haze.position.z = -24;
  haze.renderOrder = -1;
  haze.frustumCulled = false;

  const object = new THREE.Group();
  object.add(root, haze);
  const still = reducedMotion();
  const shown = { now: 0 };

  return {
    object,
    setPreset(p: Preset) {
      fogMesh.visible = p !== 'low';
      haze.visible = p === 'ultra' || p === 'high';
    },
    /** `dim`: 0 = full brightness behind the hero, 1 = quietly behind the chapters' content. */
    update(now: number, dim: number) {
      if (!still) {
        clock.value = now / 1000;
        turn.value = now * 0.000022;
        spin.rotation.y = turn.value + 0.6;
      }
      if (root.visible) shown.now = Math.min(1, shown.now + 0.012); // fade in once loaded
      bright.value = shown.now * (1 - 0.5 * dim);
    },
  };
}
