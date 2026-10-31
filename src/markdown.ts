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
