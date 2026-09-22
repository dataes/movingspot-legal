import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const fingerprints = JSON.parse(read('scripts/legal-content-sha256.json'));

test('every original legal/support body is preserved byte-for-byte at its original route', () => {
  for (const [name, expected] of Object.entries(fingerprints)) {
    const html = read(`${name}.html`);
    const body = html.match(/<main class="legal-content" id="main">([\s\S]*?)<\/main>/)?.[1];
    assert.ok(body, name);
    assert.equal(createHash('sha256').update(body).digest('hex'), expected, name);
  }
});

test('all seven legal links are in every footer and absent from the main navigation', () => {
  for (const page of ['index', ...Object.keys(fingerprints)]) {
    const html = read(`${page}.html`);
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)[0];
    const header = html.match(/<header[\s\S]*?<\/header>/)[0];
    for (const name of Object.keys(fingerprints)) {
      assert.ok(footer.includes(`href="./${name}.html"`), `${page}: ${name}`);
      assert.ok(!header.includes(`href="./${name}.html"`));
    }
  }
});

test('platform detection handles iOS, desktop-mode iPadOS, Android, and desktop without guessing a store', () => {
  const source = read('site.js');
  const context = {
    navigator: { userAgent: '', platform: '', maxTouchPoints: 0 },
    document: { querySelector: () => null, querySelectorAll: () => [] },
  };
  runInNewContext(source, context);
  for (const [ua, platform, points, expected] of [
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5, 'apple'],
    ['Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)', 'iPad', 5, 'apple'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 'MacIntel', 5, 'apple'],
    ['Mozilla/5.0 (Linux; Android 15; Pixel 9)', 'Linux armv8l', 5, 'google'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 'MacIntel', 0, 'desktop'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32', 10, 'desktop'],
    ['', '', 0, 'desktop'],
  ]) assert.equal(context.detectPlatform(ua, platform, points), expected);
});

test('local asset and page links resolve; fragment targets exist', () => {
  for (const name of ['index', ...Object.keys(fingerprints)]) {
    const html = read(`${name}.html`);
    for (const [, url] of html.matchAll(/(?:href|src)="([^\"]+)"/g)) {
      if (url.startsWith('./') && url !== './') assert.ok(existsSync(new URL(url, root)), `${name}: ${url}`);
      if (url.startsWith('#')) assert.ok(html.includes(`id="${url.slice(1)}"`), `${name}: ${url}`);
    }
  }
});

test('direct store links open safely in a new tab', () => {
  const html = read('index.html');
  const links = [...html.matchAll(/<a[^>]*data-store="(?:apple|google)"[^>]*>/g)];
  assert.equal(links.length, 4);
  for (const [link] of links) {
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noopener noreferrer"/);
  }

  const script = read('site.js');
  assert.match(script, /link\.target = '_blank'/);
  assert.match(script, /link\.rel = 'noopener noreferrer'/);
});
