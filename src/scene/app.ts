// Chapter 2's app as a 3D object: the main screenshot cut into its layers, plus the other windows.
// The page's scroll timeline writes `AppProgress`; `update` turns it into transforms each frame.
import * as THREE from 'three/webgpu';
import { abs, color, dot, float, length, materialColor, max, mix, normalView, positionViewDirection, pow, smoothstep, step, texture, uniform, uv, vec2 } from 'three/tsl';
import type { Preset } from './presets';

export type AppProgress = { build: number; sub: number; mag: number; rules: number; conns: number; dim: number };
// Where the packet stops on the window (main.webp pixels): the Frankfurt row, the power button.
export const ROW = [300, 164] as const, POWER = [296, 743] as const;

const W = 1440, H = 787; // main.webp
const AH = H / W; // the window's height when its width is 1
// Layers of main.webp in its pixels (x, y, w, h) and how far each one floats out when exploded.
const LAYERS: { r: [number, number, number, number]; z: number }[] = [
  { r: [0, 0, 248, 787], z: 0.55 }, // sidebar
  { r: [248, 0, 1192, 64], z: 0.9 }, // toolbar
  { r: [248, 64, 900, 640], z: 0.3 }, // usage, column headers and the list
  { r: [1160, 72, 270, 715], z: 1.1 }, // inspector
  { r: [258, 148, 878, 33], z: 1.5 }, // the selected Frankfurt row
  { r: [265, 712, 866, 64], z: 1.9 }, // the glass connection bar
];
// Delay column, Frankfurt row → London row, for the magnifier (main.webp pixels).
const MAG_X = 840, MAG_Y0 = 170, MAG_Y1 = 384, MAG_R = 110;

/** Window-local place of a main.webp pixel: x right, y up, the window 1 wide, centered on 0. */
export const local = (px: number, py: number) => new THREE.Vector2(px / W - 0.5, (0.5 - py / H) * AH);

/** Rounded corners: alpha 1 inside a rect of the given aspect, 0 outside (radius as a share of width). */
function rounded(aspect: number, radius: number) {
  const p = uv().sub(0.5).mul(vec2(1, aspect));
  const half = vec2(0.5, aspect / 2).sub(radius);
  const q = max(abs(p).sub(half), 0);
  return smoothstep(radius, radius - 0.002, length(q));
}

function plane(tex: THREE.Texture, w: number, h: number, crop?: [number, number, number, number], round = 0) {
  const map = crop ? tex.clone() : tex;
  if (crop) {
    const [x, y, cw, ch] = crop;
    map.repeat.set(cw / W, ch / H);
    map.offset.set(x / W, 1 - (y + ch) / H);
  }
  const m = new THREE.MeshBasicNodeMaterial({ map, toneMapped: false, transparent: !crop && round > 0 });
  if (round) m.opacityNode = rounded(h / w, round);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

async function load(src: string) {
  const t = await new THREE.TextureLoader().loadAsync(src);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const rim = pow(float(1).sub(abs(dot(normalView, positionViewDirection))), 4);
function lensMaterial(preset: Preset) {
  const m = preset === 'ultra' || preset === 'high'
    ? new THREE.MeshPhysicalNodeMaterial({ roughness: 0, transmission: 1, thickness: 0.35, ior: 1.7, dispersion: preset === 'ultra' ? 3 : 0, clearcoat: 1 })
    : new THREE.MeshPhysicalNodeMaterial({ color: 0x9ccaff, roughness: 0.05, transparent: true, opacity: 0.18, clearcoat: 1 });
  m.emissiveNode = color(0xbfe0ff).mul(rim.mul(1.6));
  return m;
}

const apart = uniform(1); // 1 = exploded: the back shows holes where the layers were

export async function buildApp(preset: Preset) {
  const [main, sub, rules, conns] = await Promise.all(
    ['/app/main.webp', '/app/add-subscription.webp', '/app/rules.webp', '/app/connections.webp'].map(load),
  );
  const root = new THREE.Group(); // placed and sized by the page layout; 1 unit = the window's width
  const tilt = new THREE.Group(); // exploded angle and cursor tilt
  root.add(tilt);

  const back = plane(main, 1, AH, undefined, 0.02);
  back.material.transparent = false;
  back.material.alphaTest = 0.5;
  // The back is the empty window: where a layer floats away it leaves the window's own grey, not a copy.
  const holes = LAYERS.reduce((a: any, { r: [x, y, w, h] }) => {
    const u = uv(), u0 = x / W, u1 = (x + w) / W, v0 = 1 - (y + h) / H, v1 = 1 - y / H;
    return max(a, step(u0, u.x).mul(step(u.x, u1)).mul(step(v0, u.y)).mul(step(u.y, v1)));
  }, float(0));
  back.material.colorNode = mix(texture(main), color(0x1d1e22), holes.mul(apart)).mul(materialColor);
  tilt.add(back);
  const layers = LAYERS.map(({ r, z }, i) => {
    const [x, y, w, h] = r;
    const m = plane(main, w / W, h / W, r, 14 / w); // rounded, so the window's white corner pixels never show
    m.material.alphaTest = 0.5;
    const c = local(x + w / 2, y + h / 2);
    m.position.set(c.x, c.y, 0.001 * (i + 1));
    tilt.add(m);
    return { m, z };
  });

  // The other windows, where the HTML places them (Showcase.astro): left, top as shares of the window.
  const over = (tex: THREE.Texture, left: number, top: number, width: number) => {
    const h = (width * tex.image.height) / tex.image.width;
    const m = plane(tex, width, h, undefined, 0.012 / width);
    m.position.set(left + width / 2 - 0.5, AH / 2 - top * AH - h / 2, 0.2);
    m.visible = false;
    tilt.add(m);
    return m;
  };
  const sheet = over(sub, 0.25, 0.07, 0.5);
  const ruleEditor = over(rules, 0.3, -0.12, 0.54); // left of the HTML place: the 3D window has no dimmed shrink to make room
  const connWindow = over(conns, 0.02, -0.06, 0.96);

  // The magnifier: a flattened sphere of liquid glass hovering over the Delay column.
  const lens = new THREE.Mesh(new THREE.SphereGeometry(MAG_R / W, 48, 24), lensMaterial(preset));
  lens.scale.z = 0.5;
  lens.visible = false;
  tilt.add(lens);

  const aim = new THREE.Vector2();
  return {
    root,
    /** The world place of a main.webp pixel, on the window as it is drawn now. */
    worldOf(px: number, py: number, z = 0, out = new THREE.Vector3()) {
      const l = local(px, py);
      return tilt.localToWorld(out.set(l.x, l.y, z));
    },
    update(p: AppProgress, cursor: THREE.Vector2) {
      const e = 1 - THREE.MathUtils.smootherstep(p.build, 0, 1); // 1 = fully exploded
      apart.value = e;
      aim.lerp(cursor, 0.06);
      const on = Math.min(1, p.mag * 5, (1 - p.mag) * 5); // the magnifier is out
      tilt.position.z = 0.18 * THREE.MathUtils.smootherstep(on, 0, 1); // and the window comes closer
      tilt.rotation.set(0.42 * e - aim.y * 0.06, -0.62 * e + aim.x * 0.08, 0.06 * e);
      for (const { m, z } of layers) m.position.z = z * 0.45 * e + 0.004 + aim.length() * 0.004 * z;
      // Dimmed while the Rule Editor and Connections windows are in front.
      const d = 1 - 0.65 * p.dim;
      for (const m of [back, ...layers.map((l) => l.m)]) (m.material as THREE.MeshBasicNodeMaterial).color.setScalar(d);

      const fade = (m: THREE.Mesh, k: number, from: THREE.Vector3) => {
        m.visible = k > 0.001;
        (m.material as THREE.Material).opacity = Math.min(1, k * 1.5);
        m.userData.home ??= m.position.clone();
        m.position.copy(m.userData.home).addScaledVector(from, 1 - k);
      };
      fade(sheet, p.sub, new THREE.Vector3(0, 0.05, 0.1));
      fade(ruleEditor, p.rules, new THREE.Vector3(0.25, 0, -0.1));
      fade(connWindow, p.conns, new THREE.Vector3(0, -0.12, -0.05));
      ruleEditor.rotation.y = -0.4 * (1 - p.rules);

      // The magnifier comes in over Frankfurt, slides down to London and leaves.
      lens.visible = on > 0.01;
      const at = local(MAG_X, THREE.MathUtils.lerp(MAG_Y0, MAG_Y1, THREE.MathUtils.smoothstep(p.mag, 0.15, 0.85)));
      lens.position.set(at.x, at.y, 0.06);
      lens.scale.set(on, on, 0.5 * on);
      root.updateMatrixWorld(true); // worldOf reads it this frame
    },
    setPreset(p: Preset) {
      (lens.material as THREE.Material).dispose();
      lens.material = lensMaterial(p);
    },
  };
}

export type App = Awaited<ReturnType<typeof buildApp>>;
