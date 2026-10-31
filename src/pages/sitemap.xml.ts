import { en } from '../strings';
import { releases } from '../releases';

export function GET({ site }: { site: URL }) {
  const paths = ['', 'sandbox/', 'noleaker/', 'blog/', ...Object.keys(en.articles).map((a) => `${a}/`), ...releases.map((r) => `blog/${r.tag_name}/`)];
  const urls = paths.map((p) => `<url><loc>${new URL(p, site).href}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
}
