// Release notes come from commit messages, so they may hold anything: the output is cut to plain text formatting.
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import sanitizeHtml from 'sanitize-html';

const processor = await createSatteriMarkdownProcessor({});

export async function renderNotes(body: string) {
  const { code } = await processor.render(body);
  return sanitizeHtml(code, {
    // No images: a remote one would show visitors' addresses to its host, and this site tracks nothing.
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'strong', 'em', 'del', 'blockquote', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
  });
}

const SHOTS = 'https://raw.githubusercontent.com/v2macapp/v2mac/main/docs/images/screenshots/';

/** A wiki page's Markdown made ready for the site: its links and screenshots point here, its language line is gone. */
export function docMarkdown(md: string, docsRoot: string) {
  return md
    .replace(/^\*\*[^*\n]+\*\*.*\((?:fa-|zh-|ru-)?Home\).*$/m, '')
    .replaceAll(SHOTS, '/docs/img/')
    .replace(/\]\((?:(?:fa|zh|ru)-)?([A-Z][A-Za-z-]*)(#[^)\s]*)?\)/g, (_, page: string, hash = '') =>
      `](${docsRoot}${page === 'Home' ? '' : `${page.toLowerCase()}/`}${hash})`);
}

/** The first real paragraph, as plain text short enough for a search result. */
export function docDescription(md: string) {
  const line = md.split('\n').find((l) => /^[^\s#<|>*\-`\d]/.test(l.trim())) ?? '';
  const text = line.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '').trim();
  return text.length <= 158 ? text : `${text.slice(0, 155).replace(/\s+\S*$/, '')}…`;
}

export async function renderDoc(md: string) {
  const { code } = await processor.render(md);
  return sanitizeHtml(code, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'strong', 'em', 'del', 'blockquote', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'],
    allowedAttributes: { a: ['href'], img: ['src', 'alt', 'width'], h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    // Only our own copies, in public/docs/img: a remote image would show visitors' addresses to its host.
    // shortcut: a new wiki screenshot shows nothing until it is copied there.
    exclusiveFilter: (f) => f.tag === 'img' && !/^\/docs\/img\/[\w.-]+$/.test(f.attribs.src ?? ''),
  });
}
