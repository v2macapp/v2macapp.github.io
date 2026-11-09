import assert from 'node:assert/strict';
import { test } from 'node:test';

test('the download size skips Intel assets; links point at the latest release', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify([{
    tag_name: 'v1.2.3', draft: false,
    assets: [
      { name: 'V2Mac-1.2.3-intel.dmg', size: 20e6, browser_download_url: 'https://example.com/intel.dmg' },
      { name: 'V2Mac-1.2.3.dmg', size: 10e6, browser_download_url: 'https://example.com/arm64.dmg' },
    ],
  }]));
  try {
    const release = await import('./releases.ts');
    assert.equal(release.DOWNLOAD_URL, 'https://github.com/v2macapp/v2mac/releases/latest/download/V2Mac.dmg');
    assert.match(release.downloadMeta, /10 MB/);
    assert.equal(release.INTEL_DOWNLOAD_URL, 'https://github.com/v2macapp/v2mac/releases/latest/download/V2Mac-Intel.dmg');
    assert.equal(release.softwareApp('test').operatingSystem, 'macOS 14 or later, Apple Silicon or Intel');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
