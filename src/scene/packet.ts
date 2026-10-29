// The one packet the page follows: a bright head and a trail of where it has just been.
import * as THREE from 'three/webgpu';
import { color, float, instanceIndex, instancedBufferAttribute, length, smoothstep, uv, vec4 } from 'three/tsl';

const N = 48; // trail points; the last one is the head

export function buildPacket() {
  const at = new Float32Array(N * 3);
  const attr = new THREE.InstancedBufferAttribute(at, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  const k = float(instanceIndex).div(N - 1); // 0 = tail end, 1 = head
  const m = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  m.positionNode = instancedBufferAttribute(attr);
  m.scaleNode = k.mul(k).mul(0.16).add(0.02).add(smoothstep(0.97, 1, k).mul(0.1));
  const glow = smoothstep(0.5, 0, length(uv().sub(0.5)));
  m.colorNode = vec4(color(0xbfe0ff).mul(k.mul(2).add(0.6)), glow.mul(k.mul(k)).mul(0.9));
  const sprite = new THREE.Sprite(m);
  sprite.count = N;
  sprite.frustumCulled = false;
  sprite.renderOrder = 10;

  let fresh = true;
  return {
    sprite,
    /** Moves the head; the trail follows a step behind each frame. */
    move(p: THREE.Vector3) {
      if (fresh) { for (let i = 0; i < N; i++) p.toArray(at, i * 3); fresh = false; }
      at.copyWithin(0, 3);
      for (let i = 0; i < N - 1; i++) {
        // each point eases toward the next, so a still packet gathers into one glow
        for (let c = 0; c < 3; c++) at[i * 3 + c] += (at[(i + 1) * 3 + c] - at[i * 3 + c]) * 0.25;
      }
      p.toArray(at, (N - 1) * 3);
      attr.needsUpdate = true;
    },
  };
}
