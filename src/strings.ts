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
  packet: 'youtube.com', // the request the page follows
  app: {
    title: 'Meet V2Mac.',
    icon: 'The V2Mac app icon',
    beats: [
      { title: 'Paste one link.', text: 'Add your subscription and every server appears, grouped and ready.' },
      { title: 'Fastest in green.', text: 'Test every server at once and see delay and speed side by side.' },
      { title: 'Your rules.', text: 'Send each app and site the way you want: Proxy, Direct or Block.' },
      { title: 'Nothing hidden.', text: 'See every connection, the app that made it and the rule that sent it. Turn on TUN and the whole Mac goes through.' },
    ],
    shots: {
      main: 'The V2Mac main window: servers from a subscription with their delay and speed',
      subscription: 'The Add Subscription sheet',
      rules: 'The Rule Editor with Proxy, Direct and Block rules',
      connections: 'The Connections window: each app, its target and the rule that sent it',
    },
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

// shortcut: links to the releases page until M5 uploads V2Mac.dmg to every release.
export const DOWNLOAD_URL = 'https://github.com/v2macapp/v2mac/releases/latest';
export const REPO_URL = 'https://github.com/v2macapp/v2mac';
