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
  app: {
    title: 'Meet V2Mac.',
    menu: ['File', 'Edit', 'View', 'Window', 'Help'],
    sidebar: { all: 'All', favorites: 'Favorites', custom: 'Custom Configs', subscriptions: 'Subscriptions' },
    columns: ['Name', 'Type', 'Delay', 'Speed'],
    connect: 'Connect',
    connected: 'Connected',
    timeout: 'timeout',
    tun: 'TUN',
    mode: 'Global',
    rules: {
      title: 'Rules',
      items: [
        { what: 'YouTube', action: 'Proxy' },
        { what: 'Your bank', action: 'Direct' },
        { what: 'Ad trackers', action: 'Block' },
      ],
    },
    beats: [
      'Paste a subscription link. Every server appears, grouped and ready.',
      'Test every server at once and see the fastest in green.',
      'Rules send each site and app the right way: Proxy, Direct or Block.',
      'Turn on TUN and the whole Mac goes through it, every app included.',
    ],
  },
  see: {
    title: 'What they see.',
    lede: 'Drag the lens across your traffic. It shows what your internet provider can read.',
    off: 'Without V2Mac, anyone on the path reads every site you open.',
    server: 'Frankfurt 01',
    idle: 'Not connected',
    connecting: 'Connecting…',
    connected: 'Connected',
    delay: '86 ms',
    connect: 'Connect',
    disconnect: 'Disconnect',
    protocolsLabel: 'Each protocol hides you a different way',
    protocols: [
      { name: 'REALITY', line: 'vless · raw · reality', what: "Borrows a real website's handshake. They see an ordinary visit to microsoft.com.", shows: 'www.microsoft.com' },
      { name: 'Hysteria2', line: 'hysteria2 · udp · quic', what: 'QUIC over UDP, built for lossy links. They see encrypted QUIC on port 443.', shows: 'QUIC · udp/443' },
      { name: 'Trojan', line: 'trojan · ws · tls', what: 'Hides inside normal HTTPS. They see a secure visit to your server’s own website.', shows: 'https · cdn.example.net' },
      { name: 'Shadowsocks', line: 'shadowsocks · 2022-blake3', what: 'Encrypted bytes with no pattern to match. They see noise.', shows: '' }, // random bytes per pill
    ],
  },
  sites: ['youtube.com', 'telegram.org', 'instagram.com', 'x.com', 'wikipedia.org', 'github.com', 'whatsapp.net', 'chatgpt.com', 'reddit.com', 'spotify.com', 'news.bbc.co.uk', 'discord.com'],
  footer: {
    graphics: 'Graphics',
    auto: 'Auto',
    presets: { ultra: 'Ultra', high: 'High', medium: 'Medium', low: 'Low' },
    tracking: 'This site tracks nothing.',
  },
};

// Made-up demo servers, as in the app's demo data.
export const servers = [
  { flag: '🇩🇪', name: 'Frankfurt 01', type: 'vless · raw · reality', ms: 86, speed: '4.8 MB/s' },
  { flag: '🇳🇱', name: 'Amsterdam 02', type: 'vless · ws · tls', ms: 112, speed: '9.2 MB/s' },
  { flag: '🇫🇮', name: 'Helsinki 01', type: 'vless · raw · reality', ms: 143, speed: '13.6 MB/s' },
  { flag: '🇹🇷', name: 'Istanbul 03', type: 'vless · ws · tls', ms: 61, speed: '7.3 MB/s' },
  { flag: '🇦🇪', name: 'Dubai 01', type: 'hysteria2 · udp', ms: 204, speed: '11.7 MB/s' },
  { flag: '🇸🇪', name: 'Stockholm 01', type: 'trojan · ws · tls', ms: 0, speed: '—' },
  { flag: '🇺🇸', name: 'New York 02', type: 'vless · ws · tls', ms: 267, speed: '9.8 MB/s' },
  { flag: '🇬🇧', name: 'London 01', type: 'shadowsocks', ms: 98, speed: '14.2 MB/s' },
];

// shortcut: links to the releases page until M5 uploads V2Mac.dmg to every release.
export const DOWNLOAD_URL = 'https://github.com/v2macapp/v2mac/releases/latest';
export const REPO_URL = 'https://github.com/v2macapp/v2mac';
