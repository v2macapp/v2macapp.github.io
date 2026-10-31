import { en } from '../strings';
import { releases } from '../releases';

export function GET({ site }: { site: URL }) {
  const pages = ['', 'sandbox/', 'noleaker/', 'blog/', ...Object.keys(en.articles).map((a) => `${a}/`)].map((p) => `<url><loc>${new URL(p, site).href}</loc></url>`);
  const notes = releases.map((r) => `<url><loc>${new URL(`blog/${r.tag_name}/`, site).href}</loc><lastmod>${r.published_at}</lastmod></url>`);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...pages, ...notes].join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
}
