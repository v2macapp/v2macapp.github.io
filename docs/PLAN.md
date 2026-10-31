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
The "Route the world" chapter (tunnel and clickable dot globe) was built in M2 and removed on the user's request on 2026-10-31; the Earth backdrop stays.

Rethought with the user on 2026-10-30 after the first M1 (a glass wall the packets break through) did
not work. One main idea per chapter; GSAP ScrollTrigger pins each chapter and drives it with the scroll.

**The thread: titles made of particles.** The particles never vanish: the V's particles form chapter 2's
title, which re-forms into chapter 3's, and so on. The real heading stays in the HTML (SEO, screen
readers, and the page without 3D); with the 3D on it is drawn by the particles instead.

1. **Glass V**: the logo as real refractive glass (dispersion on Ultra), Download button.
2. **The app**: the camera passes through the glass V and the real main window assembles (README
   screenshots, demo data only). Pinned; Apple-style beats with a big caption on the left while the
   camera moves across real windows: Add Subscription sheet, zoom into Delay and Speed, the Rule
   Editor slides in, the Connections window comes up (and TUN in its caption). A hand-built HTML copy
   of the window looked fake and was dropped on 2026-10-30.
3. **What they see**: your requests flow past as glass pills; drag the observer's lens over them.
   Off, it reads your real sites. Press Connect and they scramble into what the protocol shows:
   REALITY a visit to microsoft.com, Hysteria2 QUIC on UDP 443, Trojan HTTPS to your server's domain,
   Shadowsocks random bytes. The protocol chips change what the lens sees. Phones: the lens wanders
   until you drag it.
4. **Secure Sandbox (Beta)**: pinned for seven beats, rebuilt 2026-10-31 because the card row didn't explain anything. A stack of windows comes apart into glass rooms; each gets a line to its own exit; one room up close (what it sees, what it can't); Frankfurt dies and the room seals while the others carry on; the install sheet; the Dock; then the visitor cuts servers. Orange BETA badge, link to `/sandbox`.

**Backdrop behind every chapter** (the user, 2026-10-31): a slice of the real Earth low on the screen, turning, with data arcs between cities and a little 3D noise fog (`src/scene/earth.ts`, hung on the camera; half brightness past the hero). Textures from the three.js examples in `public/earth/`, 2.2 MB, loaded after the page paints.

Then FAQ (FAQPage markup), a NoLeaker section (shield + drop), footer.
The cursor is a small black hole: real point-mass lensing in screen space bends the stars and the
particle titles around it (Einstein ring, a faint inner image of each star, a dark shadow). The V tilts
toward it; phones use tilt. The stars are a real-looking sky (mostly faint, few bright, white, blue-white
and warm, slight twinkle) fixed to the camera, so scrolling never moves them.

**The "wow" pass** (chosen by the user on 2026-10-30, after M1 was "good but not wow"):
- **One shot, no cuts.** Scrolling pushes the camera into the glass V and through it (a liquid glass
  zoom): the app window is seen refracted through the V before the camera comes out in front of it.
  The V no longer flies into the app icon.
- **The window is a 3D object.** The real screenshot is cut into its layers (sidebar, toolbar, list,
  the selected row, the glass connection bar, the inspector) as planes in the scene. It arrives
  exploded, layers spread in depth at an angle, and assembles as you scroll; it tilts toward the
  cursor so the layers show their depth. "Fastest in green" is a liquid glass magnifier sliding along
  the Delay and Speed columns. The other screenshots (sheet, Rule Editor, Connections) are planes too.
  The HTML images stay for screen readers and the page without 3D.
- **Cinematic finish.** Film grain, chromatic aberration at the edges and a vignette on the 3D (Medium
  and up). Depth of field: later, if the frame budget allows.
- **Physical play.** Drag and throw the glass V: it spins with inertia and springs back. Buttons and
  protocol chips lean toward the cursor (magnetic).

References the user liked: Apple AirPods Pro and MacBook Pro pages, oryzo.ai, raycast.com (chapter 2);
the Codrops square lens effect (3); Shopify Editions Spring 2026 and the Codrops "Gommage" text
dissolve (titles); explore.ownprimland.com and the anoni.net Tor flow (4); the Codrops infinite
liquid glass grid (5).

## Other pages
- `/sandbox`: Secure Sandbox (Beta), full page. Plan below.
- `/noleaker`: hero is a live leak test of the visitor's own browser (WebRTC, timezone vs IP country,
  language, QUIC); each leak is a drop the shield catches. Runs only when the visitor presses the button, and says which services it asks: ipinfo.io, then ipwho.is (it answered 429 from a shared exit), Cloudflare's trace and STUN. Time zone compares UTC offsets. No DNS test: the row says so. noleaker-flow is not on the site.
- `/v2rayn-for-mac`, `/v2rayx-alternative`: honest comparison pages.
- `/guides/vless-reality-mac`, `/guides/hysteria2-mac`; `/blog/` built from GitHub releases.

## `/sandbox` page (built 2026-10-31)
The main page's chapter sells the idea in seven beats; this page answers "how does it work, and can I trust it?".
Same world: Earth backdrop, particle title, pinned scroll scenes. Every claim comes from `../wiki/Sandbox.md` or `../sandbox/docs/PLAN.md`.

1. **Hero**: "Secure Sandbox", Beta badge, one sentence, Download V2Mac. Real Sandbox window screenshot (none exists yet: needs demo-data captures from the Dev instance).
2. **What you get**: a mini VM from Add (Empty, Templates, Clone) to an app in the Dock; the Exit picker with green, red "Not connected" and "No exit (blocked)".
3. **Fail-closed, in depth**: the scroll scene takes one packet from app to server, cuts the server and shows where it stops. Its own connection: keeps working when V2Mac is disconnected, on another server or in TUN mode.
4. **What's inside, what isn't**: place and time zone of the exit, home folder, Shared folder if allowed; never your Mac's files, network or other mini VMs.
5. **Permissions**: the install sheet, then the Allow, Don't Allow, Always Allow prompt; clipboard directions; Shared files marked as downloaded so macOS checks them.
6. **Keep or throw away**: Disposable, Clone, Wipe Data.
7. **Trust**: the signed store, Verify Installation ("Verified" means unchanged, not "safe"), withdrawn apps, the sandbox download pinned to each V2Mac release.
8. **Apps and developers**: Chromium and Firefox plugins, plugin template, store submission. Only list apps once they're in the store.
9. **Cost and limits**: nothing downloads until first use, the size, memory limit, stops 5 minutes after the last app closes, Remove Sandbox. Beta caveats, honestly.
10. **FAQ** (FAQPage markup) and Download.

SEO: own title and description, targets "run apps through a VPN server on Mac", "per-app VPN Mac", "app isolation macOS". Each claim needs a check against the released sandbox version before publishing.

Built with rebuilt UI (no Sandbox screenshots exist yet), the Earth only (no particle title, no stars) and one pinned scene. It states no size or memory numbers: the first-run sheet shows the real ones. Later, if wanted: real screenshots from the Dev instance.

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
  the sandbox glass flat.

  Auto: a GPU check picks the start preset, then an FPS watcher steps down below ~50 FPS for 2 s
  and back up with headroom, never into a preset that failed; loading and each change's stall aren't measured. Reduced motion always gets Low. Footer switch
  "Graphics: Auto · Ultra · High · Medium · Low", remembered in the browser; `?fps` shows a counter.
- Touch: holding or dragging a finger, also while it scrolls, is the same black hole as the mouse cursor.
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
- GSAP (free, plugins included): ScrollSmoother glides wheel and trackpad scrolling (touch stays
  native), ScrollTrigger pins chapters and scrubs one timeline per chapter, ScrambleText for the lens. It also drives the HTML parts, so the page works without the 3D.
- Repo `v2macapp/v2macapp.github.io`, deployed by GitHub Actions to Pages.

## Milestones
1. **M1**: Astro + three setup, presets and FPS watcher, chapter 1, particle titles, chapter 2 (the
   app) and chapter 3 (the lens). The user reviews it in the browser. A first M1 with a glass wall
   was built and dropped on 2026-10-30.
   Built 2026-10-30, waiting for review (`npm run dev`, `?fps` shows the counter, `?webgl` forces WebGL 2).
1b. **Wow pass** (see above): one shot, the 3D window, cinematic finish, physical play.
   Built 2026-10-30, waiting for review. Depth of field not done yet.
2. **M2**: the liquid glass sandbox grid (the tunnel and globe were removed on 2026-10-31).
   Built 2026-10-30, waiting for review. The sandbox row is HTML glass cards (drag, cut a server).
3. **M3**: all pages, FAQ, SEO, blog from releases, Send to my Mac.
   Notes from 2026-10-30: facts for the comparison pages, checked on GitHub: v2rayN runs on
   Windows, Linux and macOS (Intel and Apple Silicon), Xray and sing-box cores, GPL-3.0. V2RayX was archived
   on 2024-01-12, uses v2ray-core, GPL-3.0. NoLeaker's repo is `v2macapp/noleaker` (the app README and wiki
   still link LordVersA). FAQ source: `../wiki/Troubleshooting-and-FAQ.md`; `/sandbox` source: `../wiki/Sandbox.md`.
   Release notes can be rendered at build time with Astro's own `@astrojs/markdown-satteri`.
   Built 2026-10-31. Search Console meta tag still needs the user's token. OG images: `scripts/make-og.sh`.
4. **M4**: `/noleaker` with the leak test. Built 2026-10-31.
5. **M5**: release CI hook (`V2Mac.dmg`, rebuild), publish. CI hook built 2026-10-31; it needs a `SITE_TOKEN` secret in the app repo. Until the next app release the button links the versioned DMG (`src/releases.ts`). Published 2026-10-31.
- 2026-10-31 SEO pass: WebSite and BlogPosting markup, sitemap lastmod on release notes, 404 page. Docs live on the GitHub wiki, which is `x-robots-tag: none`, so they are not searchable.
