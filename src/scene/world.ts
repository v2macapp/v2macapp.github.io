// Everything the 3D draws, built for one preset. All motion runs in the vertex shaders from a few
// uniforms, so a preset change only rebuilds this and keeps the story's state.
import * as THREE from 'three/webgpu';
import {
  abs, clamp, color, cos, dot, float, instancedBufferAttribute, length, min, mix, normalView,
  positionViewDirection, pow, sin, smoothstep, sqrt, step, time, uniform, uv, vec2, vec3, vec4,
} from 'three/tsl';
import { CONFIG, type Preset } from './presets';

export const U = {
  burst: uniform(0), // 0 = glass V, 1 = the V's particles form chapter 2's title
  title: uniform(0), // which title the particles draw: 0 = chapter 2's … TITLES - 1 = the last chapter's
  out: uniform(0), // 1 = particles faded out (past the last title)
  cursor: uniform(new THREE.Vector2(9, 9)), // in NDC
  lens: uniform(0), // Einstein radius of the cursor's black hole, in screen units (screen height = 2)
  aspect: uniform(1),
  px: uniform(0.01), // one CSS pixel at the stars' distance
  titleAlpha: uniform(0.3),
  vGlow: uniform(1), // the V's edge glow; faded as the camera passes through, where it would bloom into a white cloud
};

export const TITLES = 3; // chapters 2 to 4
export const FOV = 40;
export const DIST = 10; // the camera of chapters 2 and 3, straight at the z = 0 plane
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
export const STAR_DIST = 50;

const BLUE = 0x0a84ff;
const PALE = 0xbfe0ff;

// The two bars of the logo, traced from logo-mark-glass.jpg (corners TL, TR, BR, BL).
const S = 1.3;
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
  const stars = buildStars(cfg.stars);
  root.add(v, particles.sprite);
  return {
    root,
    v,
    stars, // the scene hangs these on the camera, so scrolling never moves them
    setTitle: particles.setTitle,
    dispose() {
      // Sprites share one geometry across three.js; disposing it breaks every sprite.
      for (const o of [root, stars]) o.traverse((o: any) => { if (!o.isSprite) o.geometry?.dispose(); o.material?.dispose(); });
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
    m.emissiveNode = color(BLUE).mul(fresnel.mul(2.2).add(0.08)).mul(U.vGlow);
    material = m;
  } else if (glass === 'fake') {
    const m = new THREE.MeshPhysicalNodeMaterial({
      color: 0x1f6fe0, metalness: 0, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.7,
    });
    m.emissiveNode = color(BLUE).mul(fresnel.mul(2.4).add(0.12)).mul(U.vGlow);
    material = m;
  } else {
    const m = new THREE.MeshBasicNodeMaterial({ color: BLUE, transparent: true });
    m.opacityNode = U.vGlow.mul(0.6).add(0.25); // see-through as the camera passes
    material = m;
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
  group.userData.material = material;
  // Opaque, so the glass refracts them; the scene shrinks them away before they blow up to fill the screen.
  group.userData.glow = group.children.slice(BARS.length);
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
  const titled = count;
  const start = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    randomOnV(p);
    p.toArray(start, i * 3);
    seed.set([Math.random(), Math.random(), 0.008 + Math.random() * 0.02, 0], i * 4);
  }
  const startAttr = new THREE.InstancedBufferAttribute(start, 3);
  const titles = Array.from({ length: TITLES }, () => new THREE.InstancedBufferAttribute(new Float32Array(start), 3));
  U.titleAlpha.value = Math.min(0.9, 9000 / titled);

  const s = instancedBufferAttribute(new THREE.InstancedBufferAttribute(seed, 4));
  const step = (k: any) => smoothstep(0, 1, clamp(k.mul(1.5).sub(s.x.mul(0.5)), 0, 1)); // staggered 0 → 1
  // e[0]: the V → the first title; e[i]: title i - 1 → title i.
  const e = [step(U.burst), ...titles.slice(1).map((_, i) => step(clamp(U.title.sub(i), 0, 1)))];
  const moving = e.reduce((a: any, k) => a.add(k.mul(float(1).sub(k))), float(0));
  const turn = e.reduce((a: any, k, i) => a.add(k.mul(4 + i)), float(0));
  const swirl = vec3(sin(s.y.mul(6.28).add(turn)), cos(s.y.mul(9.1).add(turn.mul(0.7))), sin(s.y.mul(4.7)))
    .mul(moving.mul(2.5));
  const drift = vec3(sin(time.mul(0.4).add(s.y.mul(40))), cos(time.mul(0.3).add(s.y.mul(30))), 0)
    .mul(0.006); // barely moving, so the words stay sharp
  const pos = titles.reduce((a: any, t, i) => mix(a, instancedBufferAttribute(t), e[i]), instancedBufferAttribute(startAttr))
    .add(swirl).add(drift);

  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  // Titles sit on the z = 0 plane, DIST in front of the camera: bend them around the cursor too.
  material.positionNode = vec3(lensed(pos.xy.div(DIST * TAN), float(0)).at.mul(DIST * TAN), pos.z);
  material.scaleNode = s.z;
  const glow = smoothstep(0.5, 0, length(uv().sub(0.5)));
  const alpha = U.titleAlpha.mul(e[0]).mul(float(1).sub(U.out));
  material.colorNode = vec4(mix(color(BLUE), color(PALE), s.y).mul(1.4), glow.mul(alpha));
  const sprite = new THREE.Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false;
  sprite.renderOrder = 5; // after the glass, so the V's transmission doesn't blur them into a white blob

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

/** A point-mass gravitational lens at the cursor, in screen units (screen height = 2). Every point
 *  has two images: the outer one (`inner` = 0) pushed out past the Einstein ring and brightened, and a
 *  faint mirrored one inside it (`inner` = 1). Returns the image's place and its magnification. */
function lensed(q: any, inner: any) {
  const c = vec2(U.cursor.x.mul(U.aspect), U.cursor.y);
  const d = q.sub(c);
  const r = length(d).add(1e-4);
  const e = U.lens.add(1e-4);
  const root = sqrt(r.mul(r).add(e.mul(e).mul(4)));
  const at = c.add(d.div(r).mul(mix(r.add(root), r.sub(root), inner).mul(0.5)));
  const u = r.div(e);
  const mu = u.mul(u).add(2).div(u.mul(2).mul(sqrt(u.mul(u).add(4))));
  return { at, mag: abs(mu.add(mix(0.5, -0.5, inner))) };
}

/** A night sky: mostly faint stars, a few bright ones, white, blue-white and a few warm. */
function buildStars(count: number) {
  const n = count * 2; // each star twice: its outer and its inner image
  const at = new Float32Array(n * 2), seed = new Float32Array(n * 4), inner = new Float32Array(n);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 2.3, y = (Math.random() - 0.5) * 2.3; // a little past the edges, for the lens to pull in
    const sd = [0.06 + 0.94 * Math.pow(Math.random(), 6), Math.random() * 6.28, Math.random() < 0.3 ? 0.35 : 0.08, Math.random()];
    for (const k of [0, 1]) {
      at.set([x, y], (i * 2 + k) * 2);
      seed.set(sd, (i * 2 + k) * 4);
      inner[i * 2 + k] = k;
    }
  }
  const p = instancedBufferAttribute(new THREE.InstancedBufferAttribute(at, 2));
  const s = instancedBufferAttribute(new THREE.InstancedBufferAttribute(seed, 4));
  const img = instancedBufferAttribute(new THREE.InstancedBufferAttribute(inner, 1));
  const l = lensed(vec2(p.x.mul(U.aspect), p.y), img);

  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  material.positionNode = vec3(l.at.mul(STAR_DIST * TAN), -STAR_DIST);
  material.scaleNode = U.px.mul(s.x.mul(2.4).add(1.3));
  const twinkle = sin(time.mul(s.w.mul(3).add(1.2)).add(s.y)).mul(s.z).add(1);
  const tint = mix(mix(color(0xe4ecff), color(0xaecbff), step(0.6, s.w)), color(0xffdcb4), step(0.88, s.w));
  const light = s.x.mul(min(l.mag, 6)).mul(twinkle);
  const glow = smoothstep(0.5, 0.1, length(uv().sub(0.5)));
  material.colorNode = vec4(tint.mul(light.mul(1.6).max(1)), glow.mul(clamp(light, 0, 1)));
  const sprite = new THREE.Sprite(material);
  sprite.count = n;
  sprite.frustumCulled = false;

  // The black hole's shadow: a dark disc inside the Einstein ring, drawn under the stars.
  const shadow = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
  shadow.positionNode = vec3(vec2(U.cursor.x.mul(U.aspect), U.cursor.y).mul(STAR_DIST * TAN), -STAR_DIST);
  shadow.scaleNode = U.lens.mul(STAR_DIST * TAN * 1.3);
  shadow.colorNode = vec4(0, 0, 0, smoothstep(0.5, 0.3, length(uv().sub(0.5))).mul(0.9));
  const hole = new THREE.Sprite(shadow);
  hole.renderOrder = -1;
  hole.frustumCulled = false;
  sprite.add(hole);
  return sprite;
}
