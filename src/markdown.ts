// Release notes come from commit messages, so they may hold anything: no raw HTML, only plain link schemes.
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';

const processor = await createSatteriMarkdownProcessor({});

export async function renderNotes(body: string) {
  // The renderer has no option to refuse raw HTML. Odd parts are code, which it already escapes.
  const text = body.split(/(```[\s\S]*?```|`[^`\n]*`)/).map((part, i) => (i % 2 ? part : part.replace(/</g, '&lt;'))).join('');
  const { code } = await processor.render(text);
  return code.replace(/\s(href|src)="([^"]*)"/g, (all, attr, url) => (/^(https?:|mailto:|#|\/)/i.test(url) ? all : ` ${attr}="#"`));
}
