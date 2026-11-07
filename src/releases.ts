// V2Mac's GitHub releases, read once at build time. The release CI triggers a rebuild, so these stay current.
export type Release = { tag_name: string; name: string; body: string; html_url: string; published_at: string; draft: boolean; assets: { name: string; size: number; browser_download_url: string }[] };

async function load(): Promise<Release[]> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch('https://api.github.com/repos/v2macapp/v2mac/releases?per_page=100', {
      headers: { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
    return (await res.json() as Release[]).filter((r) => !r.draft);
  } catch (e) {
    if (process.env.CI) throw e; // never publish a site with no version and no blog
    console.warn('No releases, building without them:', e);
    return [];
  }
}

export const releases = await load();
const latest = releases[0];
const dmg = latest?.assets.find((a) => a.name === 'V2Mac.dmg') ?? latest?.assets.find((a) => /^V2Mac-.*\.dmg$/.test(a.name));

// Releases before the stable V2Mac.dmg asset fall back to the versioned file.
export const DOWNLOAD_URL = dmg?.browser_download_url ?? 'https://github.com/v2macapp/v2mac/releases/latest';
export const VERSION = latest?.tag_name.replace(/^v/, '');
export const downloadMeta = [VERSION && `v${VERSION}`, dmg && `${Math.round(dmg.size / 1e6)} MB`, 'macOS 26+', 'Apple Silicon'].filter(Boolean).join(' · ');

export const softwareApp = (description: string) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'V2Mac',
  url: 'https://v2macapp.github.io/',
  screenshot: 'https://v2macapp.github.io/app/main.webp',
  description,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'macOS 26 or later, Apple Silicon',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  downloadUrl: DOWNLOAD_URL,
  ...(VERSION ? { softwareVersion: VERSION } : {}),
});
