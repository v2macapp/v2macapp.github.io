// Graphics presets (plan: Loading and devices).
export const PRESETS = ['ultra', 'high', 'medium', 'low'] as const;
export type Preset = (typeof PRESETS)[number];
export type Choice = Preset | 'auto';

export const CONFIG: Record<Preset, {
  particles: number;
  stars: number;
  glass: 'dispersion' | 'refraction' | 'fake' | 'flat';
  bloom: number; // resolution scale, 0 = off
  dpr: number;
}> = {
  ultra: { particles: 200_000, stars: 3000, glass: 'dispersion', bloom: 1, dpr: 2 },
  high: { particles: 100_000, stars: 3000, glass: 'refraction', bloom: 1, dpr: 2 },
  medium: { particles: 40_000, stars: 2000, glass: 'fake', bloom: 0.5, dpr: 1.5 },
  low: { particles: 12_000, stars: 1200, glass: 'flat', bloom: 0, dpr: 1 },
};

const KEY = 'graphics';

export function savedChoice(): Choice {
  try {
    const v = localStorage.getItem(KEY) as Choice | null;
    return v && (v === 'auto' || PRESETS.includes(v as Preset)) ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function saveChoice(c: Choice) {
  try { localStorage.setItem(KEY, c); } catch { /* private mode: not remembered */ }
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => matchMedia('(pointer: coarse)').matches;

/** The preset Auto starts from. */
export function startPreset(webgpu: boolean): Preset {
  if (reducedMotion()) return 'low';
  if (webgpu) return isMobile() ? 'high' : 'ultra';
  return isMobile() ? 'low' : 'medium';
}

/** Steps down below ~50 FPS for 2 s; steps back up after 8 s at full speed, but never into a preset
 *  that failed: each change stalls a frame. Loading and the change's own stall aren't measured. */
export class FpsWatcher {
  private frames = 0;
  private windowStart = 0;
  private goodSince = 0;
  private failed = new Set<Preset>();
  fps = 60;

  constructor(private onChange: (p: Preset) => void) {}

  private settle(now: number) {
    this.frames = 0;
    this.windowStart = this.goodSince = now + 1500;
  }

  tick(now: number, current: Preset, auto: boolean) {
    if (!this.windowStart) { this.settle(now + 1500); return; }
    if (now < this.windowStart) return;
    this.frames++;
    const span = now - this.windowStart;
    if (span < 2000) return;
    this.fps = (this.frames * 1000) / span;
    this.frames = 0;
    this.windowStart = now;
    if (!auto || reducedMotion()) return;
    const i = PRESETS.indexOf(current);
    if (this.fps < 50) {
      this.goodSince = now;
      if (i < PRESETS.length - 1) {
        this.failed.add(current);
        this.settle(now);
        this.onChange(PRESETS[i + 1]);
      }
    } else if (this.fps >= 57 && now - this.goodSince > 8000 && i > 0) {
      if (!this.failed.has(PRESETS[i - 1])) {
        this.settle(now);
        this.onChange(PRESETS[i - 1]);
      }
    } else if (this.fps < 57) {
      this.goodSince = now;
    }
  }
}
