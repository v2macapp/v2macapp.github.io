// Everything drawn in chapters 1 and 2, built for one preset. All motion runs in the vertex
// shaders from a few uniforms, so a preset change only rebuilds this and keeps the story's state.
import * as THREE from 'three/webgpu';
import {
  abs, attribute, clamp, color, cos, dot, float, fract, instancedBufferAttribute, length, max, min,
  mix, normalView, positionLocal, positionViewDirection, pow, rotate, sign, sin, smoothstep, time,
  uniform, uv, vec3, vec4,
} from 'three/tsl';
import { CONFIG, type Preset } from './presets';

export const U = {
  burst: uniform(0), // 0 = glass V, 1 = node constellation
  shatter: uniform(0), // 0 = wall whole, 1 = wall gone
  style: uniform(new THREE.Vector4(1, 0, 0, 0)), // one-hot: REALITY, Hysteria2, Trojan, Shadowsocks
  cursor: uniform(new THREE.Vector3(99, 99, 0)), // on the z = 0 plane
};

const BLUE = 0x0a84ff;
const PALE = 0xbfe0ff;
const MAC = new THREE.Vector3(-7, 0, 0); // packets start here and wait at the wall (x = 0)
const SERVER = new THREE.Vector3(7, 0, 0);

// The two bars of the logo, traced from logo-mark-glass.jpg (corners TL, TR, BR, BL).
const S = 1.3;
const BARS = [
  [[-1.14, 1], [-0.52, 1], [0.58, -1], [-0.04, -1]],
  [[0.51, 1], [1.14, 1], [0.05, -1], [-0.58, -1]],
].map((bar) => bar.map(([x, y]) => new THREE.Vector2(x * S, y * S)));
const BAR_Z = [-0.3, 0];
const BAR_DEPTH = 0.22;

const fresnel = pow(float(1).sub(abs(dot(normalView, positionViewDirection))), 3);

export type World = {
  root: THREE.Group;
  v: THREE.Group;
  bars: THREE.Mesh[];
  dispose(): void;
};

export function buildWorld(preset: Preset): World {
  const cfg = CONFIG[preset];
  const root = new THREE.Group();
  const v = buildV(cfg.glass);
  root.add(v.group, buildParticles(cfg.particles), buildPackets(Math.round(cfg.particles / 150)), buildWall(cfg.shards, cfg.spin));
  return {
    root,
    v: v.group,
    bars: v.bars,
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

  const bars = BARS.map((corners, i) => {
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(corners), {
      depth: BAR_DEPTH, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 3,
    });
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.z = BAR_Z[i];
    group.add(mesh);
    return mesh;
  });

  // The three nodes and two links drawn inside the logo.
  const dots = [[-0.74, 0.76, -0.19], [0.73, 0.76, 0.11], [0, -0.54, -0.04]].map(
    ([x, y, z]) => new THREE.Vector3(x * S, y * S, z),
  );
  const dotGeo = new THREE.SphereGeometry(0.045, 16, 12);
  const dotMat = new THREE.MeshBasicNodeMaterial({ color: new THREE.Color(PALE).multiplyScalar(3) });
  for (const p of dots) group.add(new THREE.Mesh(dotGeo, dotMat).translateX(p.x).translateY(p.y).translateZ(p.z));
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([dots[0], dots[2], dots[1], dots[2]]),
    new THREE.LineBasicNodeMaterial({ color: new THREE.Color(BLUE).multiplyScalar(2) }),
  );
  group.add(lines);
  return { group, bars };
}

function randomOnV(out: THREE.Vector3) {
  const bar = BARS[Math.random() < 0.5 ? 0 : 1];
  const i = bar === BARS[0] ? 0 : 1;
  const u = Math.random(), w = Math.random();
  out.set(
    bar[0].x + u * (bar[1].x - bar[0].x) + w * (bar[3].x - bar[0].x),
    bar[0].y + w * (bar[3].y - bar[0].y),
    BAR_Z[i] + Math.random() * BAR_DEPTH,
  );
}

/** The constellation the V bursts into: random nodes, each linked to its two nearest. */
function constellation() {
  const nodes = [MAC.clone(), SERVER.clone()];
  while (nodes.length < 30) {
    nodes.push(new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 9, -7 + Math.random() * 8));
  }
  const links: [THREE.Vector3, THREE.Vector3][] = [];
  for (const a of nodes) {
    const near = nodes.filter((b) => b !== a).sort((p, q) => p.distanceTo(a) - q.distanceTo(a));
    links.push([a, near[0]], [a, near[1]]);
  }
  return { nodes, links };
}

function buildParticles(count: number) {
  const start = new Float32Array(count * 3);
  const end = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  const { nodes, links } = constellation();
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    let bright = Math.random() * 0.4;
    if (r < 0.15) {
      // ambient dust: never part of the V
      p.set((Math.random() - 0.5) * 34, (Math.random() - 0.5) * 18, -14 + Math.random() * 12);
      q.copy(p);
    } else {
      randomOnV(p);
      if (r < 0.27) {
        q.copy(nodes[(Math.random() * nodes.length) | 0]).addScaledVector(
          new THREE.Vector3().randomDirection(), Math.pow(Math.random(), 2) * 0.25);
        bright = 0.6 + Math.random() * 0.4;
      } else {
        const [a, b] = links[(Math.random() * links.length) | 0];
        q.lerpVectors(a, b, Math.random()).addScaledVector(new THREE.Vector3().randomDirection(), 0.03);
      }
    }
    p.toArray(start, i * 3);
    q.toArray(end, i * 3);
    seed.set([Math.random(), Math.random(), 0.012 + Math.random() * 0.03, bright], i * 4);
  }

  const s = instancedBufferAttribute(new THREE.InstancedBufferAttribute(seed, 4));
  const b = clamp(U.burst.mul(1.4).sub(s.x.mul(0.4)), 0, 1);
  const e = smoothstep(0, 1, b);
  const swirl = vec3(sin(s.y.mul(6.28).add(e.mul(4))), cos(s.y.mul(9.1).add(e.mul(3))), sin(s.y.mul(4.7)))
    .mul(e.mul(float(1).sub(e)).mul(3));
  const drift = vec3(sin(time.mul(0.4).add(s.y.mul(40))), cos(time.mul(0.3).add(s.y.mul(30))), 0).mul(0.04);
  const pos = mix(
    instancedBufferAttribute(new THREE.InstancedBufferAttribute(start, 3)),
    instancedBufferAttribute(new THREE.InstancedBufferAttribute(end, 3)), e,
  ).add(swirl).add(drift);

  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  material.positionNode = partAroundCursor(pos);
  material.scaleNode = s.z;
  const glow = smoothstep(0.5, 0, length(uv().sub(0.5)));
  material.colorNode = vec4(mix(color(BLUE), color(PALE), s.w).mul(s.w.mul(1.2).add(0.5)), glow.mul(mix(0, 0.8, e)));
  const sprite = new THREE.Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false;
  return sprite;
}

function partAroundCursor(p: any) {
  const d = p.xy.sub(U.cursor.xy);
  const f = max(float(1).sub(length(d).div(1.3)), 0);
  return vec3(p.xy.add(d.div(length(d).add(0.001)).mul(f.mul(f).mul(0.8))), p.z);
}

/** Packets flow from the Mac node to the server; until the wall breaks they pile up in front of it. */
function buildPackets(count: number) {
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) seed.set([Math.random(), Math.random() - 0.5, Math.random() - 0.5, Math.random()], i * 4);
  const s = instancedBufferAttribute(new THREE.InstancedBufferAttribute(seed, 4));

  const x0 = fract(s.x.add(time.mul(0.09))).mul(SERVER.x - MAC.x).add(MAC.x);
  const limit = mix(s.w.mul(-0.9).sub(0.12), SERVER.x + 1, smoothstep(0, 0.6, U.shatter));
  const x = min(x0, limit);
  const stuck = smoothstep(limit.sub(0.001), limit, x0).mul(float(1).sub(U.shatter));
  const spread = smoothstep(MAC.x, MAC.x + 4, x).mul(smoothstep(SERVER.x, SERVER.x - 4, x)).mul(3.4);

  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  material.positionNode = vec3(x, s.y.mul(spread), s.z.mul(spread));
  material.scaleNode = float(0.045);
  const tint = mix(mix(color(PALE), color(0x30d158), U.shatter), color(0xff453a), stuck);
  const glow = smoothstep(0.5, 0, length(uv().sub(0.5)));
  material.colorNode = vec4(tint.mul(1.8), glow.mul(smoothstep(0.75, 1, U.burst)));
  const sprite = new THREE.Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false;
  return sprite;
}

/** The wall at x = 0: a jittered grid of glass triangles. Each protocol sends them a different way. */
function buildWall(n: number, spin: boolean) {
  const size = 4.6;
  const grid: THREE.Vector2[][] = [];
  for (let i = 0; i <= n; i++) {
    grid.push([]);
    for (let j = 0; j <= n; j++) {
      const edge = i === 0 || j === 0 || i === n || j === n;
      const jit = edge ? 0 : 0.38 * (size / n);
      grid[i].push(new THREE.Vector2(
        (i / n - 0.5) * size + (Math.random() - 0.5) * jit,
        (j / n - 0.5) * size + (Math.random() - 0.5) * jit,
      ));
    }
  }
  const pos: number[] = [], center: number[] = [], rand: number[] = [], bary: number[] = [];
  const tri = (a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2) => {
    const cy = (a.x + b.x + c.x) / 3, cz = (a.y + b.y + c.y) / 3;
    const r = [Math.random(), Math.random(), Math.random(), Math.random()];
    for (const [k, p] of [a, b, c].entries()) {
      pos.push(0, p.x, p.y);
      center.push(0, cy, cz);
      rand.push(...r);
      bary.push(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0);
    }
  };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const [a, b, c, d] = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]];
      if ((i + j) % 2) { tri(a, b, c); tri(a, c, d); } else { tri(a, b, d); tri(b, c, d); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aCenter', new THREE.Float32BufferAttribute(center, 3));
  geo.setAttribute('aRand', new THREE.Float32BufferAttribute(rand, 4));
  geo.setAttribute('aBary', new THREE.Float32BufferAttribute(bary, 3));
  geo.computeVertexNormals();

  const c = attribute('aCenter', 'vec3');
  const r = attribute('aRand', 'vec4');
  const k = clamp(U.shatter.mul(1.35).sub(r.x.mul(0.35)), 0, 1);
  const ke = float(1).sub(pow(float(1).sub(k), 2)); // ease out
  const st = U.style;
  const dir = vec3(r.y.mul(0.6).add(0.3), c.y, c.z).normalize().mul(r.z.mul(2).add(3)).mul(st.x) // REALITY: blown open from the middle
    .add(vec3(r.y.mul(5).add(6), r.z.sub(0.5).mul(2.5), r.w.sub(0.5).mul(2.5)).mul(st.y)) // Hysteria2: punched forward
    .add(vec3(0, 0, sign(c.z).mul(2.8)).mul(st.z)) // Trojan: doors slide apart
    .add(vec3(r.y.mul(0.4), r.z.mul(-2).sub(6), r.w.sub(0.5)).mul(st.w)); // Shadowsocks: crumbles down
  const spinAmount = spin ? dot(st, vec4(1, 1.6, 0.05, 0.7)) : float(0);
  const euler = r.yzw.sub(0.5).mul(6.28).mul(ke).mul(spinAmount);
  const local = positionLocal.sub(c);

  const glass = !spin
    ? new THREE.MeshBasicNodeMaterial({ color: PALE, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    : new THREE.MeshPhysicalNodeMaterial({
      color: 0x8fc4ff, metalness: 0, roughness: 0.06, clearcoat: 1, transparent: true,
      side: THREE.DoubleSide, depthWrite: false,
    });
  const bary3 = attribute('aBary', 'vec3');
  const edge = smoothstep(0.035, 0, min(min(bary3.x, bary3.y), bary3.z));
  const lit = edge.mul(mix(0.6, 3, smoothstep(0, 0.15, U.shatter)));
  glass.positionNode = c.add(rotate(local, euler)).add(dir.mul(ke));
  glass.opacityNode = mix(spin ? 0.18 : 0.12, 1, edge)
    .mul(float(1).sub(smoothstep(0.55, 1, k)))
    .mul(smoothstep(0.75, 1, U.burst));
  if (glass instanceof THREE.MeshPhysicalNodeMaterial) {
    glass.emissiveNode = color(BLUE).mul(fresnel.add(lit));
  } else {
    glass.colorNode = mix(color(PALE), color(BLUE).mul(2), edge);
  }
  return new THREE.Mesh(geo, glass);
}
