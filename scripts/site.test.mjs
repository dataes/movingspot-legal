import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const fingerprints = JSON.parse(read('scripts/legal-content-sha256.json'));

test('every approved legal/support body is preserved byte-for-byte at its original route', () => {
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

test('homepage declares MovingSpot as the Brussels application and its official publisher', () => {
  const html = read('index.html');
  assert.match(html, /<title>MovingSpot \| Follow the vibe<\/title>/);
  assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/movingspot\.app\/">/);

  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)?.[1] ?? '');
  const website = schema['@graph'].find(item => item['@type'] === 'WebSite');
  const organization = schema['@graph'].find(item => item['@type'] === 'Organization');
  const app = schema['@graph'].find(item => item['@type'] === 'MobileApplication');
  assert.equal(website.name, 'MovingSpot');
  assert.equal(website.alternateName, 'MovingSpot Brussels');
  assert.equal(organization.legalName, 'IRD (Inoca Research And Development)');
  assert.equal(organization.vatID, 'BE0658904172');
  assert.equal(app.name, 'MovingSpot: Brussels');
  assert.equal(app.downloadUrl, 'https://play.google.com/store/apps/details?id=com.brusselfever.app');
});

test('Google Play is available while the App Store remains marked as coming soon', () => {
  const html = read('index.html');
  const appleLinks = [...html.matchAll(/<a[^>]*data-store="apple"[^>]*>/g)];
  assert.equal(appleLinks.length, 2);
  for (const [link] of appleLinks) {
    assert.match(link, /href="#download"/);
    assert.match(link, /aria-disabled="true"/);
    assert.match(link, /tabindex="-1"/);
  }
  const googleLinks = [...html.matchAll(/<a[^>]*data-store="google"[^>]*>/g)];
  assert.equal(googleLinks.length, 2);
  for (const [link] of googleLinks) {
    assert.match(link, /href="https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.brusselfever\.app"/);
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noopener noreferrer"/);
  }

  const script = read('site.js');
  assert.match(script, /const storeAvailability = \{ apple: false, google: true \}/);
  assert.match(script, /text\.textContent = 'Coming soon'/);
  assert.match(script, /const label = 'Get it on Google Play'/);
  assert.match(script, /link\.target = '_blank'/);
  assert.match(script, /link\.rel = 'noopener noreferrer'/);
});

test('hero entrance animation is enabled on touch devices unless reduced motion is requested', () => {
  const styles = read('styles.css');
  assert.match(styles, /@media\(prefers-reduced-motion:no-preference\)[\s\S]*?\.hero-phone\s*\{\s*animation:arrive/);
  assert.doesNotMatch(styles, /@media\(hover:hover\)[^{]*\{[\s\S]*?animation:arrive/);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)[\s\S]*?animation:none!important/);
});

test('published child safety standards expose the Play listing name, CSAE prohibition, and contact', () => {
  const html = read('child-safety.html');
  assert.match(html, /MovingSpot: Brussels/);
  assert.match(html, /These Child Safety Standards apply to MovingSpot: Brussels, published on Google Play by dataes\./);
  assert.match(html, /explicitly prohibits child sexual abuse and exploitation \(CSAE\)/);
  assert.match(html, /child sexual abuse material \(CSAM\)/);
  assert.match(html, /MovingSpot Child Safety Team/);
  assert.match(html, /<!--email_off--><a href="mailto:support@movingspot\.app">support@movingspot\.app<\/a><!--\/email_off-->/);
  assert.match(html, /reporting confirmed CSAM/);
});
