# MovingSpot

Static public website for MovingSpot. Plain HTML, CSS and JavaScript; no install or build step.

Preview locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173.

## Store URLs

Google Play is configured with `https://play.google.com/store/apps/details?id=com.brusselfever.app`.

Replace `APPLE_STORE_URL` at the top of `site.js` when the iOS listing is available. Also update the Apple `data-store` links in `index.html` for the no-JavaScript fallback. Only the App Store URL remains an intentional placeholder.

- iPhone/iPad (including desktop-mode iPadOS): App Store CTA.
- Android: Google Play CTA.
- Desktop/unknown platform: accessible choice dialog, without assuming a store.
- Both stores remain available in the download section and manual picker.
- Without JavaScript: CTAs lead to the download section with both store links.

## Files

- `index.html`: homepage, store dialog, SEO/social metadata.
- `styles.css`: shared responsive design and legal document presentation.
- `site.js`: platform detection and lightweight interactions.
- `assets/`: optimized original branding, app screenshots and sharing preview.
- Seven original legal/support `.html` routes: preserved content, common visual shell.
- `turnstile.html`: existing authentication bridge, unchanged.
- `docs/DESIGN.md`: reference audit, design decisions and verification scope.

## Checks

```sh
node scripts/site.test.mjs
node turnstile-bridge.test.mjs
```

Optional real browser verification is documented in `docs/DESIGN.md`. Legal content fingerprints refer to the working-copy content at the start of the redesign, including pre-existing uncommitted changes.
