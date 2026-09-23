// Uses Chrome DevTools directly: no production or test dependencies required.
// Start Chrome on port 9223 and a local server on port 4173 first.
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const tabs = await (await fetch('http://127.0.0.1:9223/json')).json();
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const handlers = pending.get(message.id);
    if (handlers) { pending.delete(message.id); message.error ? handlers.reject(message.error) : handlers.resolve(message.result); }
  }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text);
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id:n, method, params })); });
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue:true, awaitPromise:true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
const navigate = async url => { await send('Page.navigate', { url }); await pause(550); await evaluate('document.fonts.ready.then(() => Promise.all([...document.images].filter(i => i.loading !== "lazy").map(i => i.decode().catch(() => {}))))'); };
const screenshot = async name => { const layout = await send('Page.getLayoutMetrics'); const shot = await send('Page.captureScreenshot', { format:'png', captureBeyondViewport:true, clip:{x:0,y:0,width:layout.cssContentSize.width,height:layout.cssContentSize.height,scale:1} }); writeFileSync(`/tmp/movingspot-${name}.png`, Buffer.from(shot.data, 'base64')); };

for (const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,740]]) {
  await send('Emulation.setDeviceMetricsOverride', { width,height,deviceScaleFactor:1,mobile:false });
  await navigate('http://127.0.0.1:4173/');
  // Load below-the-fold images, then capture the whole composition.
  await evaluate('Promise.all([...document.images].map(i => { i.loading="eager"; return i.decode().catch(() => {}); }))');
  await pause(850);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `${name}: horizontal overflow`);
  assert.equal(await evaluate('[...document.images].every(i => i.complete && i.naturalWidth > 0)'), true, `${name}: image load`);
  await screenshot(name);
  if (name === 'desktop') {
    assert.equal(await evaluate('document.querySelector(".hero [data-download]").getAttribute("aria-disabled")'), null);
    await evaluate('document.querySelector(".hero [data-download]").click()');
    assert.equal(await evaluate('document.querySelector("dialog").open'),true);
    assert.equal(await evaluate('document.querySelector("dialog [data-store=apple]").getAttribute("aria-disabled")'), null);
    assert.equal(await evaluate('document.querySelector("dialog [data-store=google]").getAttribute("aria-disabled")'), null);
    await evaluate('document.querySelector("dialog").close()');
    assert.equal(await evaluate('document.querySelector("[data-mode=out]").getAttribute("aria-pressed")'),'true');
    assert.equal(await evaluate('document.querySelectorAll(".floating-tag").length'),0);
    await evaluate('document.querySelector("[data-mode=on]").click()');
    assert.equal(await evaluate('document.querySelector("#discovery-image").src.includes("map-on")'),true);
    await evaluate('document.querySelector("[data-mode=out]").click()');
    assert.equal(await evaluate('document.querySelector("#discovery-image").src.includes("map-out")'),true);
    assert.equal(await evaluate('document.querySelector("[data-mode=out]").getAttribute("aria-pressed")'),'true');
    for (const vibe of ['calm','fevering','lively']) {
      await evaluate(`document.querySelector('[data-vibe-option=${vibe}]').click()`);
      assert.equal(await evaluate('document.querySelector(".vibe-demo").dataset.vibe'),vibe);
    }
    await evaluate('document.querySelector("#vibe-slider").scrollIntoView({behavior:"instant",block:"center"})');
    const slider = await evaluate('(()=>{const r=document.querySelector("#vibe-slider").getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()');
    for (const [position, vibe] of [[0.05,'calm'],[0.5,'lively'],[0.95,'fevering']]) {
      const point = {x:slider.x+slider.width*position,y:slider.y+slider.height/2,button:'left',clickCount:1};
      await send('Input.dispatchMouseEvent',{type:'mousePressed',...point});
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point});
      assert.equal(await evaluate('document.querySelector(".vibe-demo").dataset.vibe'),vibe);
    }
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
    assert.equal(await evaluate('document.querySelector("#vibe-slider").getAttribute("aria-valuetext")'),'Lively');
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'),'auto');
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".hero-phone")).animationName'),'none');
    await send('Emulation.setEmulatedMedia',{features:[]});
  }
    console.log(`PASS ${name}: layout, images${name==='desktop'?', Google Play choice, discovery, vibes, reduced motion':''}`);
}
for (const [name,ua,platform,touch,label,url] of [
 ['iphone','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)','iPhone',5],
 ['ipad','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)','MacIntel',5],
 ['android','Mozilla/5.0 (Linux; Android 15; Pixel 9)','Linux armv8l',5],
]) {
 await send('Emulation.setUserAgentOverride',{userAgent:ua,platform});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:touch});
 await navigate('http://127.0.0.1:4173/');
 assert.equal(await evaluate('document.querySelector(".hero [data-download]").getBoundingClientRect().width <= innerWidth - 32'),true,`${name}: CTA fits smallest screen`);
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".hero-phone")).animationName'),'arrive');
 if (name === 'android') {
   assert.equal(await evaluate('document.querySelector(".hero [data-download]").classList.contains("store-badge")'),true);
   assert.equal(await evaluate('document.querySelector(".hero [data-download]").classList.contains("button")'),false);
   assert.equal(await evaluate('document.querySelector(".hero [data-download] img").getAttribute("src")'),'./assets/google-play.png');
   assert.equal(await evaluate('document.querySelector(".hero [data-download]").getAttribute("aria-disabled")'),null);
   assert.ok((await evaluate('document.querySelector(".hero [data-download]").href')).endsWith('https://play.google.com/store/apps/details?id=com.brusselfever.app'));
   assert.equal(await evaluate('document.querySelector("[data-download-nav]")'),null);
   assert.equal(await evaluate('document.querySelector("[data-download-bottom]")'),null);
   assert.equal(await evaluate('document.querySelector("#store-options [data-store=apple]")'),null);
   assert.equal(await evaluate('[...document.querySelectorAll("[data-store=google]")].filter(link => link.offsetParent !== null).length'),2);
   console.log(`PASS ${name}: entrance animation active and exactly two official Google Play badges shown`);
 } else {
   assert.equal(await evaluate('document.querySelector(".hero [data-download-label]").textContent'),'Download on the App Store');
   assert.equal(await evaluate('document.querySelector(".hero [data-download]").getAttribute("aria-disabled")'),null);
   assert.ok((await evaluate('document.querySelector(".hero [data-download]").href')).endsWith('https://apps.apple.com/us/app/movingspot-brussels/id6769430023'));
   console.log(`PASS ${name}: entrance animation active and App Store CTA enabled`);
 }
}
await send('Emulation.setTouchEmulationEnabled',{enabled:false});
await send('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 Chrome/140.0.0.0',platform:'Linux x86_64'});
for (const page of ['privacy','terms','community-guidelines','child-safety','account-deletion','support','legal-notice']) {
 await navigate(`http://127.0.0.1:4173/${page}.html`);
 assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,`${page} mobile overflow`);
 assert.equal(await evaluate('document.querySelectorAll("footer nav a").length'),7);
}
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await navigate('http://127.0.0.1:4173/privacy.html');
await screenshot('legal');
console.log('PASS all seven original legal routes, mobile layout and footer links');
assert.deepEqual(errors,[],'browser console errors');
console.log('PASS no browser console errors');
ws.close();
