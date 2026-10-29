// Everything the 3D draws, built for one preset. All motion runs in the vertex shaders from a few
// uniforms, so a preset change only rebuilds this and keeps the story's state.
import * as THREE from 'three/webgpu';
import {
  abs, clamp, color, cos, dot, float, instancedBufferAttribute, length, max, mix, normalView,
  positionViewDirection, pow, sin, smoothstep, time, uniform, uv, vec3, vec4,
} from 'three/tsl';
import { CONFIG, type Preset } from './presets';

export const U = {
  burst: uniform(0), // 0 = glass V, 1 = the V's particles form chapter 2's title
  title: uniform(0), // 0 = chapter 2's title, 1 = chapter 3's
  out: uniform(0), // 1 = particles faded out (past the last title)
  cursor: uniform(new THREE.Vector3(99, 99, 0)), // on the z = 0 plane
  titleAlpha: uniform(0.3),
};

const BLUE = 0x0a84ff;
const PALE = 0xbfe0ff;
const AMBIENT = 0.15; // share of particles that are background dust, never part of the V

// The two bars of the logo, traced from logo-mark-glass.jpg (corners TL, TR, BR, BL).
const S = 1.3;
export const V_HEIGHT = 2 * S;
const BARS = [
  [[-1.14, 1], [-0.52, 1], [0.58, -1], [-0.04, -1]],
  [[0.51, 1], [1.14, 1], [0.05, -1], [-0.58, -1]],
].map((bar) => bar.map(([x, y]) => new THREE.Vector2(x * S, y * S)));
const BAR_Z = [-0.3, 0];
const BAR_DEPTH = 0.22;

const fresnel = pow(float(1).sub(abs(dot(normalView, positionViewDirection))), 3);

export type World = ReturnType<typeof buildWorld>;

export function buildWorld(preset: Preset) {
  const cfg = CONFIG[preset];
  const root = new THREE.Group();
  const v = buildV(cfg.glass);
  const particles = buildParticles(cfg.particles);
  root.add(v, particles.sprite);
  return {
    root,
    v,
    setTitle: particles.setTitle,
    dispose() {
      // Sprites share one geometry across three.js; disposing it breaks every sprite.
      root.traverse((o: any) => { if (!o.isSprite) o.geometry?.dispose(); o.material?.dispose(); });
    },
  };
}

function buildV(glass: (typeof CONFIG)[Preset]['glass']) {
  const group = new THREE.Group();
  let material: THREE.Material;
  if (glass === 'dispersion' || glass === 'refraction') {
    const m = new THREE.MeshPhysicalNodeMaterial({
      color: 0x5aa8ff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.6, ior: 1.5,
      dispersion: glass === 'dispersion' ? 6 : 0, attenuationColor: new THREE.Color(0x0a5cff),
      attenuationDistance: 1.2, clearcoat: 1,
    });
    m.emissiveNode = color(BLUE).mul(fresnel.mul(2.2).add(0.08));
    material = m;
  } else if (glass === 'fake') {
    const m = new THREE.MeshPhysicalNodeMaterial({
      color: 0x1f6fe0, metalness: 0, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.7,
    });
    m.emissiveNode = color(BLUE).mul(fresnel.mul(2.4).add(0.12));
    material = m;
  } else {
    material = new THREE.MeshBasicNodeMaterial({ color: BLUE, transparent: true, opacity: 0.85 });
  }

  BARS.forEach((corners, i) => {
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(corners), {
      depth: BAR_DEPTH, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 3,
    });
    group.add(new THREE.Mesh(geo, material).translateZ(BAR_Z[i]));
  });

  // The three nodes and two links drawn inside the logo.
  const dots = [[-0.74, 0.76, -0.19], [0.73, 0.76, 0.11], [0, -0.54, -0.04]].map(
    ([x, y, z]) => new THREE.Vector3(x * S, y * S, z),
  );
  const dotGeo = new THREE.SphereGeometry(0.045, 16, 12);
  const dotMat = new THREE.MeshBasicNodeMaterial({ color: new THREE.Color(PALE).multiplyScalar(3) });
  for (const p of dots) group.add(new THREE.Mesh(dotGeo, dotMat).translateX(p.x).translateY(p.y).translateZ(p.z));
  group.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([dots[0], dots[2], dots[1], dots[2]]),
    new THREE.LineBasicNodeMaterial({ color: new THREE.Color(BLUE).multiplyScalar(2) }),
  ));
  return group;
}

function randomOnV(out: THREE.Vector3) {
  const i = Math.random() < 0.5 ? 0 : 1;
  const bar = BARS[i];
  const u = Math.random(), w = Math.random();
  out.set(
    bar[0].x + u * (bar[1].x - bar[0].x) + w * (bar[3].x - bar[0].x),
    bar[0].y + w * (bar[3].y - bar[0].y),
    BAR_Z[i] + Math.random() * BAR_DEPTH,
  );
}

function buildParticles(count: number) {
  const titled = Math.round(count * (1 - AMBIENT)); // particles [0, titled) come from the V
  const start = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    if (i < titled) randomOnV(p);
    else p.set((Math.random() - 0.5) * 34, (Math.random() - 0.5) * 18, -14 + Math.random() * 12);
    p.toArray(start, i * 3);
    seed.set([Math.random(), Math.random(), 0.008 + Math.random() * 0.02, i < titled ? 1 : 0], i * 4);
  }
  const startAttr = new THREE.InstancedBufferAttribute(start, 3);
  const titles = [new Float32Array(start), new Float32Array(start)].map((a) => new THREE.InstancedBufferAttribute(a, 3));
  U.titleAlpha.value = Math.min(0.9, 9000 / titled);

  const s = instancedBufferAttribute(new THREE.InstancedBufferAttribute(seed, 4));
  const step = (k: any) => smoothstep(0, 1, clamp(k.mul(1.5).sub(s.x.mul(0.5)), 0, 1)); // staggered 0 → 1
  const e1 = step(U.burst), e2 = step(U.title);
  const moving = e1.mul(float(1).sub(e1)).add(e2.mul(float(1).sub(e2)));
  const swirl = vec3(sin(s.y.mul(6.28).add(e1.mul(4)).add(e2.mul(5))), cos(s.y.mul(9.1).add(e1.mul(3))), sin(s.y.mul(4.7)))
    .mul(moving.mul(2.5));
  const drift = vec3(sin(time.mul(0.4).add(s.y.mul(40))), cos(time.mul(0.3).add(s.y.mul(30))), 0)
    .mul(mix(0.04, 0.006, s.w)); // title particles barely move, so the words stay sharp
  const pos = mix(
    mix(instancedBufferAttribute(startAttr), instancedBufferAttribute(titles[0]), e1),
    instancedBufferAttribute(titles[1]), e2,
  ).add(swirl).add(drift);

  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  material.positionNode = partAroundCursor(pos);
  material.scaleNode = s.z;
  const glow = smoothstep(0.5, 0, length(uv().sub(0.5)));
  const alpha = mix(float(0.35), U.titleAlpha.mul(e1).mul(float(1).sub(U.out)), s.w);
  material.colorNode = vec4(mix(color(BLUE), color(PALE), s.y).mul(1.4), glow.mul(alpha));
  const sprite = new THREE.Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false;

  /** Points of title `i` on the z = 0 plane (x, y pairs); `cell` is their spacing. */
  function setTitle(i: number, pts: Float32Array, cell: number) {
    const out = titles[i].array as Float32Array;
    const n = pts.length / 2;
    for (let j = 0; j < titled; j++) {
      if (!n) { out.set(start.subarray(j * 3, j * 3 + 3), j * 3); continue; }
      const k = (Math.random() * n) | 0;
      out[j * 3] = pts[k * 2] + (Math.random() - 0.5) * cell;
      out[j * 3 + 1] = pts[k * 2 + 1] + (Math.random() - 0.5) * cell;
      out[j * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }
    titles[i].needsUpdate = true;
  }
  return { sprite, setTitle };
}

function partAroundCursor(p: any) {
  const d = p.xy.sub(U.cursor.xy);
  const f = max(float(1).sub(length(d).div(1.3)), 0);
  return vec3(p.xy.add(d.div(length(d).add(0.001)).mul(f.mul(f).mul(0.8))), p.z);
}
