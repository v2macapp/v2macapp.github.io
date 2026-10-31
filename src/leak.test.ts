import assert from 'node:assert/strict';
import { test } from 'node:test';
import { baseline, languageMatches, sourcesDisagree, offsetMinutes, publicIps, timezoneMatches, traceIp, usesQuic, webrtcLeaks } from './leak.ts';

const cand = (ip: string, type = 'srflx') => `candidate:1 1 udp 1 ${ip} 5000 typ ${type}`;

test('offsets, half hours and DST', () => {
  const winter = new Date('2026-01-15T12:00:00Z');
  assert.equal(offsetMinutes('Asia/Tehran', winter), 210);
  assert.equal(offsetMinutes('UTC', winter), 0);
  assert.equal(offsetMinutes('America/New_York', winter), -300);
  assert.equal(offsetMinutes('Europe/Berlin', new Date('2026-07-15T12:00:00Z')), 120);
});

test('time zone compares by offset', () => {
  const at = new Date('2026-01-15T12:00:00Z');
  assert.ok(timezoneMatches('Europe/Paris', 'Europe/Berlin', at));
  assert.ok(!timezoneMatches('Asia/Tehran', 'Europe/Berlin', at));
});

test('only public addresses count', () => {
  const all = ['192.168.1.2', '10.0.0.1', '172.20.0.1', '100.64.0.1', 'abcd-1234.local', 'fe80::1', 'fd00::1', '169.254.1.1'].map((ip) => cand(ip, 'host'));
  assert.deepEqual(publicIps(all), []);
  assert.deepEqual(publicIps([cand('5.6.7.8'), cand('5.6.7.8'), cand('172.32.0.1'), cand('2001:db8::1')]), ['5.6.7.8', '172.32.0.1', '2001:db8::1']);
});

test('WebRTC leaks only with an address HTTP did not see', () => {
  assert.deepEqual(webrtcLeaks([cand('5.6.7.8')], ['5.6.7.8']), []);
  assert.deepEqual(webrtcLeaks([cand('2.2.2.2')], ['5.6.7.8']), ['2.2.2.2']);
  assert.deepEqual(webrtcLeaks([cand('2001:db8::1'), cand('5.6.7.8')], ['2001:db8::1', '5.6.7.8']), []);
  assert.deepEqual(webrtcLeaks([], ['5.6.7.8']), []);
});

test('language', () => {
  assert.ok(languageMatches('de-DE', 'DE'));
  assert.ok(languageMatches('fa', 'DE'));
  assert.ok(!languageMatches('fa-IR', 'DE'));
});

test('Cloudflare trace', () => {
  const t = 'fl=1\nip=5.6.7.8\nhttp=http/3\nloc=DE\n';
  assert.ok(usesQuic(t));
  assert.ok(!usesQuic('http=http/2\n'));
  assert.equal(traceIp(t), '5.6.7.8');
});

test('a request that went around the proxy cannot vouch for the real address', () => {
  const proxy = '5.6.7.8', real = '2.2.2.2', v6 = '2001:db8::1';
  assert.deepEqual(baseline([proxy, real]), [proxy]);
  assert.deepEqual(webrtcLeaks([cand(real)], baseline([proxy, real])), [real]);
  assert.ok(sourcesDisagree([proxy, real]));
  assert.ok(!sourcesDisagree([proxy, v6]));
  assert.ok(!sourcesDisagree([proxy, proxy]));
  assert.ok(!sourcesDisagree([null, proxy]));
});
