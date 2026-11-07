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
    const targets = [...sidebar.matchAll(/\[([^\]]+)\]\(((?:fa-|zh-|ru-)?[A-Z][A-Za-z-]*)\)/g)];
    return await Promise.all(targets.map(async ([, name, target]) => {
      const m = target.match(/^(fa|zh|ru)-(.*)$/);
      const lang = (m?.[1] ?? 'en') as Lang, base = m?.[2] ?? target;
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
