import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('./turnstile.html', import.meta.url), 'utf8');
const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(inlineScripts.length, 1);
const bridgeScript = inlineScripts[0][1];
const nonce = '12345678-1234-4234-8234-123456789abc';

function runBridge(hash, search = '') {
  const messages = [];
  const window = {
    location: { hash, search },
    ReactNativeWebView: {
      postMessage(message) {
        messages.push(message);
      },
    },
  };
  const context = { window };
  runInNewContext(bridgeScript, context);
  context.onTurnstileSuccess('synthetic-token');
  context.onTurnstileError();
  context.onTurnstileExpired();
  context.onTurnstileTimeout();
  return messages;
}

test('existing public widget, compact dark UX, restrictive CSP and referrer policy remain', () => {
  assert.match(html, /data-sitekey="0x4AAAAAAE4OCEiyZKmRahw5"/);
  assert.match(html, /https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/);
  assert.match(html, /data-theme="dark"/);
  assert.match(html, /data-size="flexible"/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /frame-src 'self' https:\/\/challenges\.cloudflare\.com/);
  assert.match(html, /base-uri 'none'; form-action 'none'/);
  assert.doesNotMatch(bridgeScript, /console\.|Math\.random|Date\.now/);
});

test('old query-bearing clients retain byte-for-byte V1 bridge messages without a fragment', () => {
  assert.deepEqual(runBridge('', '?attempt=7'), [
    '{"type":"turnstile-success","token":"synthetic-token"}',
    '{"type":"turnstile-error","token":null}',
    '{"type":"turnstile-expired","token":null}',
    '{"type":"turnstile-timeout","token":null}',
  ]);
});

test('strict nonce fragment switches every callback to exact V2 envelope', () => {
  const messages = runBridge(`#nonce=${nonce}`);
  assert.deepEqual(messages.map((message) => JSON.parse(message)), [
    { type: 'turnstile-success', nonce, token: 'synthetic-token' },
    { type: 'turnstile-error', nonce, token: null },
    { type: 'turnstile-expired', nonce, token: null },
    { type: 'turnstile-timeout', nonce, token: null },
  ]);
  for (const message of messages) {
    assert.deepEqual(Object.keys(JSON.parse(message)), ['type', 'nonce', 'token']);
  }
});

test('invalid nonempty fragments cannot produce a usable bridge message', () => {
  for (const fragment of [
    '#nonce=',
    '#nonce=guess',
    `#nonce=${nonce}&extra=1`,
    `#other=${nonce}`,
    `#nonce=${nonce.slice(0, -1)}`,
  ]) {
    assert.deepEqual(runBridge(fragment), []);
  }
});
