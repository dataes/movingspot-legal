# MovingSpot

Static public website for MovingSpot. Plain HTML, CSS and JavaScript; no install or build step.

Preview locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173.

## Store URLs

Both public store listings are configured:

- Google Play: `https://play.google.com/store/apps/details?id=com.brusselfever.app`
- App Store URL is configured, but iOS remains marked as coming soon until its public release is confirmed.
- Once the App Store listing is publicly available in the European Union, restore the iOS store behaviour from commit `8ee5115`.

- iPhone/iPad (including desktop-mode iPadOS): disabled “Coming soon” CTA.
- Android: Google Play CTA.
- Desktop/unknown platform: accessible choice dialog, without assuming a store.
- Both stores are available in the download section and manual picker.
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
