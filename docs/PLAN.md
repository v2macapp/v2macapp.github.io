# v2macapp.github.io: plan

The website for V2Mac, the Secure Sandbox and NoLeaker. Decided with the user on 2026-10-30.

## Look
- The app's own world: deep navy black, Apple blue `#0A84FF` light, Liquid Glass, network nodes.
  Sources: `../app/docs/images/logo-mark-glass.jpg`, `background-nodes.jpg`, the app screenshots,
  `../noleaker/docs/brand/`. Not retro, not CRT.
- App UI pieces rebuilt in HTML: the glass connection bar, Proxy / Direct / Block pills
  (orange `#FF9F0A`, green `#30D158`, red `#FF453A`), green delay numbers.
- Type: `-apple-system, BlinkMacSystemFont, "Geist", sans-serif`, so Apple devices show real SF Pro
  (it may not be served as a web font) and others download Geist. Mono: SF Mono, then Geist Mono.
- No sound.

## Main page `/`: four chapters
1. **Glass V**: the logo as real refractive glass (dispersion on Ultra), Download button.
2. **Through the wall**: the V bursts into the node constellation; packets wait at a wall.
   The visitor presses the power button on the app's connection bar and the wall shatters into
   glass shards ("Connected · 86 ms"). Protocol chips (REALITY, Hysteria2, Trojan, Shadowsocks)
   each break the wall their own way.
3. **Globe**: routes to servers; click a country to set Proxy / Direct / Block and the routes recolor.
4. **Secure Sandbox (Beta)**: routes pull into sealed glass capsules (mini VMs), each with its own
   color and exit city. Cut a capsule's server: it turns red and seals, nothing leaks (fail-closed).
   Orange BETA badge, link to `/sandbox`.

Then FAQ (FAQPage markup), a NoLeaker section (shield + drop), footer.
Cursor physics everywhere: particles part around the cursor, the V tilts toward it; phones use tilt.

## Other pages
- `/sandbox`: Secure Sandbox (Beta), full page.
- `/noleaker`: hero is a live leak test of the visitor's own browser (WebRTC, timezone vs IP country,
  language, QUIC); each leak is a drop the shield catches. Details to decide at M4 (which IP service
  allows browser access; no real DNS test without a DNS server). noleaker-flow is not on the site.
- `/v2rayn-for-mac`, `/v2rayx-alternative`: honest comparison pages.
- `/guides/vless-reality-mac`, `/guides/hysteria2-mac`; `/blog/` built from GitHub releases.

## Loading and devices
- Content first: text, Download button and a poster image paint at once (~40 KB); the 3D loads after.
- Full 3D on every device, with graphics presets:

  | Preset | Particles | Glass V | Wall | Bloom |
  |---|---|---|---|---|
  | Ultra | 200k (WebGPU compute) | refraction + dispersion | 3D shards | full |
  | High | 100k | refraction | 3D shards | full |
  | Medium | 40k (WebGL 2) | fake glass | fewer shards | half res |
  | Low | 12k | flat glow | flat crack | off |

  Auto: a GPU check picks the start preset, then an FPS watcher steps down below ~50 FPS for 2 s
  and back up with headroom. Reduced motion always gets Low. Footer switch
  "Graphics: Auto · Ultra · High · Medium · Low", remembered in the browser; `?fps` shows a counter.
- Phones: the main button becomes **Send to my Mac** (share sheet: AirDrop, Telegram, copy link).

## Download button
- The app's release CI also uploads `V2Mac.dmg`, so
  `https://github.com/v2macapp/v2mac/releases/latest/download/V2Mac.dmg` never breaks.
  Check the in-app updater ignores the extra asset.
- The same CI triggers a site rebuild, which bakes in "Version X.Y.Z · size · macOS 26+ · Apple Silicon".

## SEO
- English only at launch; all text in one strings file so fa (RTL), zh and ru can follow.
- Static HTML per page, titles and descriptions per page, JSON-LD `SoftwareApplication` and
  `FAQPage`, sitemap, robots.txt, Open Graph image per page, canonical URLs.
- No analytics or tracking scripts. Google Search Console (one meta tag) and GitHub download counts.
  Footer: "This site tracks nothing."

## Stack
- Astro (static output), three.js `WebGPURenderer` with TSL shaders and compute, automatic WebGL 2
  fallback (test it: Firefox on Linux has shown a black canvas). The 3D is one lazy island.
- Repo `v2macapp/v2macapp.github.io`, deployed by GitHub Actions to Pages.

## Milestones
1. **M1**: Astro + three setup, presets and FPS watcher, chapters 1 and 2 (glass V, burst,
   Connect shatters the wall, protocol chips, cursor physics). The user reviews it in the browser.
   Built 2026-10-30, waiting for review (`npm run dev`, `?fps` shows the counter, `?webgl` forces WebGL 2).
2. **M2**: globe with clickable countries, sandbox capsules.
3. **M3**: all pages, FAQ, SEO, blog from releases, Send to my Mac.
4. **M4**: `/noleaker` with the leak test.
5. **M5**: release CI hook (`V2Mac.dmg`, rebuild), publish.
