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

## Main page `/`: five chapters
Rethought with the user on 2026-10-30 after the first M1 (a glass wall the packets break through) did
not work. One main idea per chapter; GSAP ScrollTrigger pins each chapter and drives it with the scroll.

**The thread: titles made of particles.** The particles never vanish: the V's particles form chapter 2's
title, which re-forms into chapter 3's, and so on. The real heading stays in the HTML (SEO, screen
readers, and the page without 3D); with the 3D on it is drawn by the particles instead.

1. **Glass V**: the logo as real refractive glass (dispersion on Ultra), Download button.
2. **The app**: the V shrinks into the menu bar icon and the V2Mac window assembles from floating
   glass layers (Apple's take-apart product pages). Pinned; four scroll beats each light one feature:
   subscriptions, delay test, rules (Proxy / Direct / Block), TUN.
3. **What they see**: your requests flow past as glass pills; drag the observer's lens over them.
   Off, it reads your real sites. Press Connect and they scramble into what the protocol shows:
   REALITY a visit to microsoft.com, Hysteria2 QUIC on UDP 443, Trojan HTTPS to your server's domain,
   Shadowsocks random bytes. The protocol chips change what the lens sees. Phones: the lens wanders
   until you drag it.
4. **Tunnel → globe**: scrolling flies the camera through a glass tunnel and out above the globe:
   routes to servers; click a country to set Proxy / Direct / Block and the routes recolor.
5. **Secure Sandbox (Beta)**: a draggable liquid glass grid of mini VM cards, each with a live window
   bending behind its glass, its own color and exit city. Cut a card's server: it turns red and seals,
   nothing leaks (fail-closed). Orange BETA badge, link to `/sandbox`.

Then FAQ (FAQPage markup), a NoLeaker section (shield + drop), footer.
Cursor physics everywhere: particles part around the cursor, the V tilts toward it; phones use tilt.

References the user liked: Apple AirPods Pro and MacBook Pro pages, oryzo.ai, raycast.com (chapter 2);
the Codrops square lens effect (3); Shopify Editions Spring 2026 and the Codrops "Gommage" text
dissolve (titles); explore.ownprimland.com and the anoni.net Tor flow (4); the Codrops infinite
liquid glass grid (5).

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

  | Preset | Particles | Glass V | Bloom |
  |---|---|---|---|
  | Ultra | 200k | refraction + dispersion | full |
  | High | 100k | refraction | full |
  | Medium | 40k (WebGL 2) | fake glass | half res |
  | Low | 12k | flat glow | off |

  Particles move in the vertex shader on every preset (same on WebGPU and WebGL 2). Low also turns
  the tunnel into a fade and the sandbox glass flat.

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
- Astro (static output), three.js `WebGPURenderer` with TSL shaders, automatic WebGL 2
  fallback (test it: Firefox on Linux has shown a black canvas). The 3D is one lazy island.
- GSAP (free, plugins included): ScrollTrigger pins chapters and scrubs one timeline per chapter,
  ScrambleText for the lens. It also drives the HTML parts, so the page works without the 3D.
- Repo `v2macapp/v2macapp.github.io`, deployed by GitHub Actions to Pages.

## Milestones
1. **M1**: Astro + three setup, presets and FPS watcher, chapter 1, particle titles, chapter 2 (the
   app) and chapter 3 (the lens). The user reviews it in the browser. A first M1 with a glass wall
   was built and dropped on 2026-10-30.
   Built 2026-10-30, waiting for review (`npm run dev`, `?fps` shows the counter, `?webgl` forces WebGL 2).
2. **M2**: tunnel → globe with clickable countries, the liquid glass sandbox grid.
3. **M3**: all pages, FAQ, SEO, blog from releases, Send to my Mac.
4. **M4**: `/noleaker` with the leak test.
5. **M5**: release CI hook (`V2Mac.dmg`, rebuild), publish.
