// Chapter 4: a glass tunnel the camera flies through, out above a globe of dots. Click a country to
// send it through your server, straight out, or nowhere: its dots and its routes take the rule's colour.
import * as THREE from 'three/webgpu';
import {
  abs, color, dot, float, fract, instancedBufferAttribute, length, mix, normalView, positionViewDirection,
  pow, smoothstep, step, texture, uniform, uv, vec2, vec4,
} from 'three/tsl';
import type { Preset } from './presets';

export type Rule = 'proxy' | 'direct' | 'block';
const RULE_COLOR: Record<Rule, number> = { proxy: 0xff9f0a, direct: 0x30d158, block: 0xff453a };

const MW = 720, MH = 360; // countries.png, half a degree per pixel
const FLIGHT = 85; // how far the tunnel and the globe travel toward the camera
const TUNNEL = 60, TUBE_R = 2.4;

// Where your requests go (demo sites, by where they are served) and the server they go through.
const SERVER: [number, number] = [50.1, 8.7]; // Frankfurt 01
const SITES: [number, number][] = [
  [37.4, -122.1], [51.5, -0.1], [35.7, 139.7], [-23.5, -46.6], [19.1, 72.9],
  [-33.9, 151.2], [43.7, -79.4], [59.3, 18.1], [1.35, 103.8], [-26.2, 28.0],
];

/** Roughly where the visitor is, from the time zone the browser already knows; it never leaves the page. */
function here(): [number, number] {
  const zones: Record<string, [number, number]> = {
    'Asia/Tehran': [35.7, 51.4], 'Europe/Moscow': [55.8, 37.6], 'Asia/Shanghai': [31.2, 121.5],
    'Asia/Dubai': [25.2, 55.3], 'Europe/Istanbul': [41, 29], 'America/New_York': [40.7, -74],
    'America/Los_Angeles': [34, -118.2], 'Europe/London': [51.5, -0.1], 'Europe/Berlin': [52.5, 13.4],
    'Asia/Tokyo': [35.7, 139.7], 'Asia/Kolkata': [19, 72.8], 'Asia/Karachi': [24.9, 67],
  };
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zones[tz] ?? [30, (-new Date().getTimezoneOffset() / 60) * 15];
}

const onSphere = (lat: number, lon: number, r = 1, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(lat), b = THREE.MathUtils.degToRad(lon);
  return out.set(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)).multiplyScalar(r);
};

/** A point along the great circle from a to b (unit vectors), lifted into an arc. */
function arc(a: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) {
  const angle = a.angleTo(b);
  const s = Math.sin(angle) || 1;
  out.copy(a).multiplyScalar(Math.sin((1 - t) * angle) / s).addScaledVector(b, Math.sin(t * angle) / s);
  return out.multiplyScalar(1.01 + (0.03 + 0.12 * angle / Math.PI) * Math.sin(Math.PI * t));
}

async function loadMap() {
  const [png, names] = await Promise.all([
    fetch('/globe/countries.png').then((r) => r.blob()),
    fetch('/globe/countries.json').then((r) => r.json() as Promise<string[]>),
  ]);
  const img = await createImageBitmap(png, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const c = new OffscreenCanvas(MW, MH);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const rgba = ctx.getImageData(0, 0, MW, MH).data;
  const map = new Uint8Array(MW * MH);
  for (let i = 0; i < map.length; i++) map[i] = rgba[i * 4];
  /** Country index + 1 at a place, 0 for sea. */
  const at = (lat: number, lon: number) =>
    map[Math.min(MH - 1, Math.floor((90 - lat) / 0.5)) * MW + Math.min(MW - 1, Math.floor((lon + 180) / 0.5))];
  return { at, names };
}

function buildTunnel() {
  const trip = new THREE.Group();
  const tube = new THREE.CylinderGeometry(TUBE_R, TUBE_R, TUNNEL, 64, 1, true).rotateX(Math.PI / 2).translate(0, 0, -TUNNEL / 2);
  const m = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const graze = pow(float(1).sub(abs(dot(normalView, positionViewDirection))), 2);
  const seams = smoothstep(0.94, 1, fract(uv().x.mul(36))).mul(0.5);
  const ends = smoothstep(0, 0.08, uv().y).mul(smoothstep(1, 0.92, uv().y)); // fade in at both mouths
  m.colorNode = vec4(color(0x0a84ff).mul(1.2), graze.mul(0.12).add(seams.mul(graze).mul(0.6)).mul(ends));
  trip.add(new THREE.Mesh(tube, m));
  // Rings of light every few metres: they rush past and sell the speed.
  const ring = new THREE.TorusGeometry(TUBE_R * 0.98, 0.012, 6, 128);
  const rm = new THREE.MeshBasicNodeMaterial({ color: new THREE.Color(0xbfe0ff).multiplyScalar(2.2), transparent: true, opacity: 0.8, depthWrite: false });
  for (let z = -3; z > -TUNNEL + 2; z -= 2.6) trip.add(new THREE.Mesh(ring, rm).translateZ(z));
  return trip;
}

export async function buildGlobe(preset: Preset) {
  const { at, names } = await loadMap();
  const trip = buildTunnel();
  const root = new THREE.Group(); // placed by the page layout; the globe has radius 1
  const spin = new THREE.Group();
  root.add(spin);

  const base = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshBasicNodeMaterial({ color: 0x06142e }));
  spin.add(base);
  const air = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  air.colorNode = vec4(color(0x0a84ff), pow(float(1).sub(abs(dot(normalView, positionViewDirection))), 3).mul(0.9));
  root.add(new THREE.Mesh(new THREE.SphereGeometry(1.14, 64, 48), air));

  // Land as dots on a Fibonacci sphere, each knowing its country.
  // shortcut: the dot count follows the starting preset only; rebuild on preset change if it matters.
  const tries = { ultra: 90_000, high: 60_000, medium: 30_000, low: 12_000 }[preset];
  const pos: number[] = [], idx: number[] = [];
  const p = new THREE.Vector3();
  for (let i = 0; i < tries; i++) {
    const y = 1 - (2 * (i + 0.5)) / tries, lon = ((i * 137.50776) % 360) - 180;
    const lat = THREE.MathUtils.radToDeg(Math.asin(y));
    const k = at(lat, lon);
    if (!k) continue;
    onSphere(lat, lon, 1.006, p).toArray(pos, pos.length);
    idx.push(k - 1);
  }
  const rules = new THREE.DataTexture(new Uint8Array(256 * 4), 256, 1);
  rules.needsUpdate = true;
  const hover = uniform(-1);
  const dots = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
  const country = instancedBufferAttribute(new THREE.InstancedBufferAttribute(new Float32Array(idx), 1));
  dots.positionNode = instancedBufferAttribute(new THREE.InstancedBufferAttribute(new Float32Array(pos), 3));
  dots.scaleNode = float(1.6 / Math.sqrt(idx.length));
  const rule = texture(rules, vec2(country.add(0.5).div(256), 0.5));
  const lit = float(1).add(float(1).sub(step(0.5, abs(country.sub(hover)))).mul(0.9)); // the hovered country lights up
  const tint = mix(color(0x8fb8ff).mul(0.55), rule.rgb.mul(1.3), rule.a).mul(lit);
  dots.colorNode = vec4(tint, smoothstep(0.5, 0.2, length(uv().sub(0.5))));
  const land = new THREE.Sprite(dots);
  land.count = idx.length;
  land.frustumCulled = false;
  spin.add(land);

  // Routes: a faint line per leg and dots flowing along it.
  const you = onSphere(...here()), server = onSphere(...SERVER), sites = SITES.map(([a, b]) => onSphere(a, b));
  const siteCountry = SITES.map(([a, b]) => at(a, b) - 1);
  const ruleOf = new Map<number, Rule>();
  const K = 18; // flowing dots per leg
  const legs: { a: THREE.Vector3; b: THREE.Vector3; end: number; c: THREE.Color }[] = [];
  const flowAt = new Float32Array(SITES.length * 2 * K * 3), flowColor = new Float32Array(SITES.length * 2 * K * 3);
  const flowPos = new THREE.InstancedBufferAttribute(flowAt, 3), flowCol = new THREE.InstancedBufferAttribute(flowColor, 3);
  flowPos.setUsage(THREE.DynamicDrawUsage);
  const fm = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  fm.positionNode = instancedBufferAttribute(flowPos);
  fm.scaleNode = float(0.03);
  fm.colorNode = vec4(instancedBufferAttribute(flowCol).mul(2), smoothstep(0.5, 0, length(uv().sub(0.5))));
  const flow = new THREE.Sprite(fm);
  flow.frustumCulled = false;
  spin.add(flow);
  const lines = new THREE.Group();
  spin.add(lines);

  function route() {
    legs.length = 0;
    sites.forEach((s, i) => {
      const r = ruleOf.get(siteCountry[i]) ?? 'proxy';
      const c = new THREE.Color(RULE_COLOR[r]);
      if (r === 'proxy') legs.push({ a: you, b: server, end: 1, c }, { a: server, b: s, end: 1, c });
      else legs.push({ a: you, b: s, end: r === 'block' ? 0.3 : 1, c }); // blocked: it never gets far
    });
    lines.children.forEach((l: any) => { l.geometry.dispose(); l.material.dispose(); });
    lines.clear();
    for (const l of legs) {
      const pts = Array.from({ length: 48 }, (_, k) => arc(l.a, l.b, (k / 47) * l.end, new THREE.Vector3()));
      lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicNodeMaterial({ color: l.c, transparent: true, opacity: 0.35, depthWrite: false })));
    }
    flow.count = legs.length * K;
    legs.forEach((l, i) => { for (let k = 0; k < K; k++) l.c.toArray(flowColor, (i * K + k) * 3); });
    flowCol.needsUpdate = true;
  }
  route();

  // Pins: you and your server.
  const pin = (at: THREE.Vector3, c: number, size: number) => {
    const m = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    m.colorNode = vec4(color(c).mul(2.5), smoothstep(0.5, 0, length(uv().sub(0.5))));
    const s = new THREE.Sprite(m);
    s.scale.setScalar(size);
    s.position.copy(at).multiplyScalar(1.01);
    spin.add(s);
    return s;
  };
  pin(you, 0xffffff, 0.09);
  pin(server, 0x0a84ff, 0.09);

  // Start facing the server, tilted to show the north.
  const turn = { y: -THREE.MathUtils.degToRad(SERVER[1] + 15), x: 0.45, v: 0 };
  let dragging = false;
  const ray = new THREE.Raycaster(), hit = new THREE.Vector3(), inv = new THREE.Matrix4();

  return {
    trip,
    root,
    names,
    /** The country under a screen point (NDC), or -1. */
    pick(ndc: THREE.Vector2, camera: THREE.Camera) {
      if (!root.visible) return -1;
      ray.setFromCamera(ndc, camera);
      spin.updateMatrixWorld();
      inv.copy(spin.matrixWorld).invert();
      const r = ray.ray.clone().applyMatrix4(inv);
      if (!r.intersectSphere(new THREE.Sphere(new THREE.Vector3(), 1), hit)) return -1;
      hit.normalize();
      return at(THREE.MathUtils.radToDeg(Math.asin(hit.y)), THREE.MathUtils.radToDeg(Math.atan2(hit.x, hit.z))) - 1;
    },
    hover(i: number) { hover.value = i; },
    rule(i: number) { return ruleOf.get(i); },
    setRule(i: number, r: Rule | null) {
      if (r) ruleOf.set(i, r); else ruleOf.delete(i);
      const px = rules.image.data as Uint8Array;
      const c = new THREE.Color(r ? RULE_COLOR[r] : 0);
      px.set(r ? [c.r * 255, c.g * 255, c.b * 255, 255] : [0, 0, 0, 0], i * 4);
      rules.needsUpdate = true;
      route();
    },
    /** Dragging turns the globe; letting go keeps it turning a little. */
    drag(dx: number, dy: number) {
      dragging = true;
      turn.y += dx * 3;
      turn.x = THREE.MathUtils.clamp(turn.x + dy * 2, -0.6, 1.1);
      turn.v = dx * 3;
    },
    release() { dragging = false; },
    /** `t`: 0 = the tunnel ahead and the globe far behind it, 1 = flown through, the globe in place. */
    update(t: number, now: number) {
      trip.position.z = -12 + t * FLIGHT;
      trip.visible = t > 0.001 && t < 0.999;
      root.position.z = -10 - (1 - t) * FLIGHT;
      root.visible = t > 0.001;
      if (!dragging) { turn.v *= 0.95; turn.y += turn.v + 0.0008; }
      spin.rotation.set(turn.x, turn.y, 0);
      for (let i = 0; i < legs.length; i++) {
        const l = legs[i];
        for (let k = 0; k < K; k++) {
          const f = (k / K + now * 0.00025 * (1 + (i % 3) * 0.3)) % 1;
          arc(l.a, l.b, f * l.end, p).toArray(flowAt, (i * K + k) * 3);
        }
      }
      flowPos.needsUpdate = true;
    },
  };
}

export type Globe = Awaited<ReturnType<typeof buildGlobe>>;
