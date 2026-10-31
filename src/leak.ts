// The judgements behind the /noleaker test. Pure, so `npm test` can check them.
export type Verdict = 'ok' | 'leak' | 'hint' | 'unknown';

/** The time zone's current distance from UTC, in minutes. */
export function offsetMinutes(zone: string, at = new Date()) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(at).find((p) => p.type === 'timeZoneName')!.value;
  const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0; // plain "GMT"
}

// shortcut: compares offsets, so another country on the same offset passes; a zone-to-country table would catch it.
export function timezoneMatches(browser: string, ip: string, at = new Date()) {
  return offsetMinutes(browser, at) === offsetMinutes(ip, at);
}

/** The IPs in ICE candidates that the public internet can see: no private, link-local or mDNS addresses. */
export function publicIps(candidates: string[]) {
  const ips = new Set<string>();
  for (const c of candidates) {
    const ip = c.split(' ')[4];
    if (!ip || ip.endsWith('.local')) continue;
    if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|0\.)/.test(ip)) continue;
    if (/^(::1?$|f[cd]|fe[89ab])/i.test(ip)) continue;
    ips.add(ip);
  }
  return [...ips];
}

/** WebRTC leaks when it shows an address that neither HTTP check saw (dual-stack Macs have one of each). */
export const webrtcLeaks = (candidates: string[], known: string[]) => publicIps(candidates).filter((ip) => !known.includes(ip));

/** A language like de-DE names a country; plain "fa" names none. */
export function languageMatches(tag: string, country: string) {
  const region = new Intl.Locale(tag).region;
  return !region || region === country;
}

export const usesQuic = (trace: string) => /^http=http\/3$/m.test(trace);
export const traceIp = (trace: string) => trace.match(/^ip=(.+)$/m)?.[1];
