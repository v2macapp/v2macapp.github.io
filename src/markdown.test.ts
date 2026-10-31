import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderNotes } from './markdown.ts';

test('raw HTML becomes text, code stays code', async () => {
  const html = await renderNotes('Hi <script>alert(1)</script> <img src=x onerror=a> `<b>`\n\n```\n<i>\n```\n');
  assert.ok(!/<script|<img|<b>|<i>/.test(html), html);
  assert.ok(html.includes('&lt;b&gt;'));
});

test('only plain link schemes', async () => {
  for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'javascript&#58;alert(1)', 'data:text/html,x', ' vbscript:x']) {
    const html = await renderNotes(`[x](${bad.includes(' ') ? `<${bad}>` : bad})`);
    assert.ok(!/href="(?!#")/.test(html) , `${bad}: ${html}`);
  }
  assert.ok((await renderNotes('[x](https://github.com/a)')).includes('href="https://github.com/a"'));
});
