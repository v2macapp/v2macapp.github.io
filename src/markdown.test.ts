import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderNotes } from './markdown.ts';

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
