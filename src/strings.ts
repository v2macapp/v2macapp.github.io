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
  sandbox: {
    title: 'Secure Sandbox.',
    beta: 'Beta',
    beats: [
      { title: 'A room for every app.', text: 'Each app runs in its own mini VM, shut off from your Mac and from the other mini VMs.' },
      { title: 'Its own way out.', text: 'Every mini VM has its own server. Nothing it does reaches the internet any other way.' },
      { title: 'It sees only its room.', text: 'Inside, the app finds the place and time zone of its exit. Your Mac isn’t there.' },
      { title: 'Server down? Cut off.', text: 'If its server stops working, the apps lose the internet. They never fall back to your real connection.' },
      { title: 'You decide what it gets.', text: 'Before an app installs, you see what it asks for. Sound, the microphone and SSH keys ask again when the app uses them.' },
      { title: 'Still a Mac app.', text: 'Every app opens as its own Mac app, with its own window and Dock icon, in the colour of its mini VM.' },
      { title: 'Try it. Cut a server.', text: 'Nothing is downloaded until you open the sandbox for the first time.' },
    ],
    cut: 'Cut server',
    restore: 'Restore',
    down: 'Not connected',
    sealed: 'Blocked · nothing leaks',
    more: 'About the sandbox',
    sees: {
      title: 'Firefox — Work sees',
      yes: ['Frankfurt, as its place', 'The time zone of Frankfurt', 'Its own home folder', 'The Shared folder, if you allow it'],
      notTitle: 'It can’t see',
      no: ['Your Mac’s files', 'Your Mac’s network', 'Other mini VMs'],
    },
    notice: { title: 'Work: Not connected', text: 'Frankfurt stopped working. Its apps are cut off.' },
    sheet: {
      title: 'Add Firefox to Work',
      lede: 'This app asks to:',
      items: ['Use the clipboard', 'Read and write this mini VM’s Shared folder', 'Use the SSH keys in your Mac’s ssh-agent, after asking you', 'Play sound, after asking you', 'Use the microphone, after asking you'],
      cancel: 'Cancel', without: 'Install Without These', allow: 'Allow and Install',
    },
    desk: '~/Applications/V2Mac Sandbox',
    vms: [
      { app: 'Firefox', vm: 'Work', kind: 'web', url: 'docs.example.com', flag: '🇩🇪', city: 'Frankfurt', delay: '86 ms', hue: 211 },
      { app: 'Chromium', vm: 'Shopping', kind: 'shop', url: 'shop.example.com', flag: '🇳🇱', city: 'Amsterdam', delay: '112 ms', hue: 145 },
      { app: 'Terminal', vm: 'Dev', kind: 'term', term: ['$ curl ifconfig.co/city', 'Helsinki', '$ date +%Z', 'EET'], flag: '🇫🇮', city: 'Helsinki', delay: '143 ms', hue: 32 },
    ],
  },
  sites: ['youtube.com', 'telegram.org', 'instagram.com', 'x.com', 'wikipedia.org', 'github.com', 'whatsapp.net', 'chatgpt.com', 'reddit.com', 'spotify.com', 'news.bbc.co.uk', 'discord.com'],
  footer: {
    graphics: 'Graphics',
    auto: 'Auto',
    presets: { ultra: 'Ultra', high: 'High', medium: 'Medium', low: 'Low' },
    tracking: 'This site tracks nothing.',
    credit: 'Earth textures: Solar System Scope, CC BY 4.0.',
  },
};

// shortcut: links to the releases page until M5 uploads V2Mac.dmg to every release.
export const DOWNLOAD_URL = 'https://github.com/v2macapp/v2mac/releases/latest';
export const REPO_URL = 'https://github.com/v2macapp/v2mac';
