import assert from 'node:assert/strict';
import { test } from 'node:test';
import { docDescription, docMarkdown, renderDoc, renderNotes } from './markdown.ts';

const clean = (html: string) => !/<(script|img|iframe|svg|style|b|i)\b|\son\w+=|javascript:|data:|vbscript:/i.test(html);

test('raw HTML never survives', async () => {
  for (const evil of [
    'Hi <script>alert(1)</script> <img src=x onerror=a>',
    '\\` <img src=x onerror=alert(1)> \\`',
    '` a\n\n<img src=x onerror=alert(1)>\n\nb `',
    '``` \n<script>alert(1)</script>',
    '<svg onload=alert(1)>',
    '<a href="javascript:alert(1)">x</a>',
    '![pixel](https://evil.example/p.png)',
  ]) {
    const html = await renderNotes(evil);
    assert.ok(clean(html), `${evil} → ${html}`);
  }
});

test('code stays readable as text', async () => {
  assert.ok((await renderNotes('`<b>`')).includes('<code>&lt;b&gt;</code>'));
});

test('only plain link schemes', async () => {
  for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'javascript&#58;alert(1)', 'data:text/html,x', '//evil.example/x']) {
    assert.ok(!/href=/.test(await renderNotes(`[x](${bad})`)), bad);
  }
  assert.ok((await renderNotes('[x](https://github.com/a)')).includes('href="https://github.com/a"'));
});

test('wiki pages get local links and images, and no remote images', async () => {
  const md = docMarkdown('# T\n\n**Languages:** English · [فارسی](fa-Home)\n\nSee [R](fa-Routing#a), [H](fa-Home) and [X](https://x.org/Y).\n\n<img src="https://raw.githubusercontent.com/v2macapp/v2mac/main/docs/images/screenshots/main.png" alt="m">\n\n<img src="https://evil.example/a.png">', '/fa/docs/');
  assert.ok(!md.includes('Languages'));
  assert.ok(md.includes('](/fa/docs/routing/#a)') && md.includes('](/fa/docs/)') && md.includes('](https://x.org/Y)'));
  const html = await renderDoc(md);
  assert.ok(html.includes('src="/docs/img/main.png"') && !html.includes('evil.example'));
});

test('a doc description is plain and short', () => {
  assert.equal(docDescription('# T\n\nUse [V2Mac](https://x.org) **now**.\n'), 'Use V2Mac now.');
  assert.ok(docDescription(`# T\n\n${'word '.repeat(60)}`).length <= 158);
});
