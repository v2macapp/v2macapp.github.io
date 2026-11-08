// The user docs, read from the GitHub wiki at build time: GitHub tells search engines not to index the wiki itself.
import { LANGS, langOf, localize, type Lang } from './i18n';
import { docMarkdown, docDescription, renderDoc } from './markdown';

const RAW = 'https://raw.githubusercontent.com/wiki/v2macapp/v2mac/';

async function page(name: string) {
  const res = await fetch(`${RAW}${name}.md`);
  if (!res.ok) throw new Error(`${name}: GitHub answered ${res.status}`);
  return res.text();
}

export type Doc = { lang: Lang; slug: string; path: string; name: string; heading: string; description: string; html: string };

async function load(): Promise<Doc[]> {
  try {
    const sidebar = await page('_Sidebar');
    const prefixes = LANGS.filter((lang) => lang !== 'en').sort((a, b) => b.length - a.length);
    const targets = [...sidebar.matchAll(/\[([^\]]+)\]\(([A-Za-z-]+)\)/g)];
    return await Promise.all(targets.map(async ([, name, target]) => {
      const prefix = prefixes.find((lang) => target.startsWith(`${lang}-`));
      const lang = (prefix ?? 'en') as Lang, base = prefix ? target.slice(prefix.length + 1) : target;
      const slug = base === 'Home' ? '' : base.toLowerCase();
      const md = docMarkdown(await page(target), localize(lang, '/docs/'));
      return {
        lang, slug, name,
        path: localize(lang, slug ? `/docs/${slug}/` : '/docs/'),
        heading: md.match(/^# (.+)$/m)?.[1] ?? name,
        description: docDescription(md),
        html: await renderDoc(md),
      };
    }));
  } catch (e) {
    if (process.env.CI) throw e; // never publish a site with its docs missing
    console.warn('No docs, building without them:', e);
    return [];
  }
}

export const docs = await load();
export const docsIn = (lang: Lang) => docs.filter((d) => d.lang === lang);
// A language whose wiki pages are not published yet links to the English docs.
export const docsHome = (lang: Lang) => (docsIn(lang).length ? localize(lang, '/docs/') : '/docs/');
