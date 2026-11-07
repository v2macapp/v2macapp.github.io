import { en } from '../strings';
import { releases } from '../releases';
import { docs } from '../docs';
import { LANGS, localize } from '../i18n';

export function GET({ site }: { site: URL }) {
  const paths = ['/', '/sandbox/', '/noleaker/', ...Object.keys(en.articles).map((a) => `/${a}/`)].flatMap((p) => LANGS.map((l) => localize(l, p)));
  const pages = [...paths, '/blog/', ...docs.map((d) => d.path)].map((p) => `<url><loc>${new URL(p, site).href}</loc></url>`);
  const notes = releases.map((r) => `<url><loc>${new URL(`blog/${r.tag_name}/`, site).href}</loc><lastmod>${r.published_at}</lastmod></url>`);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...pages, ...notes].join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
}
