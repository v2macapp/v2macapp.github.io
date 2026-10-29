// Every visible string on the site, so fa, zh and ru can follow (plan: SEO).
export const en = {
  title: 'V2Mac: a native Xray client for macOS',
  description:
    'Free, open-source Xray-core and V2Ray client for Mac. VLESS, REALITY, Hysteria2, Trojan and Shadowsocks in a native SwiftUI menu bar app for Apple Silicon.',
  hero: {
    name: 'V2Mac',
    tagline: 'A native macOS client for Xray-core.',
    lede: 'VLESS, REALITY, Hysteria2, Trojan and Shadowsocks in a fast SwiftUI menu bar app. No Electron, no telemetry.',
    download: 'Download for Mac',
    meta: 'macOS 26+ · Apple Silicon · Free and open source',
    source: 'Source on GitHub',
    scroll: 'Scroll',
  },
  wall: {
    title: 'Through the wall.',
    lede: 'Your packets wait at the wall. Press the power button.',
    server: 'Frankfurt 01',
    idle: 'Not connected',
    connecting: 'Connecting…',
    connected: 'Connected',
    delay: '86 ms',
    connect: 'Connect',
    disconnect: 'Disconnect',
    protocolsLabel: 'Each protocol breaks the wall its own way',
    protocols: [
      { name: 'REALITY', line: 'vless · raw · reality', what: "Borrows a real website's TLS handshake. To the wall it looks like an ordinary visit." },
      { name: 'Hysteria2', line: 'hysteria2 · udp · quic', what: 'QUIC over UDP, built for lossy links. It goes straight through.' },
      { name: 'Trojan', line: 'trojan · ws · tls', what: 'Hides inside normal HTTPS. The doors open only for the right password.' },
      { name: 'Shadowsocks', line: 'shadowsocks · 2022-blake3', what: 'Encrypted bytes with no pattern to match. It slips through the cracks.' },
    ],
  },
  footer: {
    graphics: 'Graphics',
    auto: 'Auto',
    presets: { ultra: 'Ultra', high: 'High', medium: 'Medium', low: 'Low' },
    tracking: 'This site tracks nothing.',
  },
};

// shortcut: links to the releases page until M5 uploads V2Mac.dmg to every release.
export const DOWNLOAD_URL = 'https://github.com/v2macapp/v2mac/releases/latest';
export const REPO_URL = 'https://github.com/v2macapp/v2mac';
