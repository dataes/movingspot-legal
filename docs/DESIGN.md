# MovingSpot public website

## Existing project and preservation

The original site is a static HTML site hosted at `movingspot.app` (CNAME), with no build system or runtime dependencies. Its homepage linked to seven legal/support documents. The separate `turnstile.html` is an application authentication bridge, not a public legal document: it and its test were left unchanged.

The working tree already contained changes to privacy, terms, community guidelines and support. Preservation was checked against the actual files at the beginning of this task, not an older Git version. Each original body is retained verbatim inside `<main class="legal-content" id="main">`. `scripts/legal-content-sha256.json` records the original body fingerprints. Do not regenerate these fingerprints to make an accidental content edit pass.

All seven original routes remain linked at the bottom of every public page. Navigation contains only the brand, discovery anchor and application CTA (or the homepage return link on legal pages).

## Visual references inspected

Source: the sibling `../brusselfever` React Native / Expo application. No files in that repository were changed.

- `src/lib/theme.ts`: black background, white text, #FF006E accent, #1A1A1A cards, #333333 borders; system sans-serif, medium/bold weights; 4/8/16/24/32/48 spacing and compact rounded surfaces.
- `src/lib/activityColors.ts`, `activityStatusLabels.ts`: Calm #29F1FF, Lively #FF7A00, Fevering #FF006E, graduated marker rings and layered halos.
- `ActivityThermostat`, `ActivityFlameIcon`, `PresenceActivityDialog`: colored flame, cyan–orange–pink track, white-ringed selected position, fade-in dark modal.
- `VenueMarker`, `EventMarker`, `ActivityMarkerHalo`: white emoji faces, colored rings, activity halos and pink presence badges.
- `app/(tabs)/map.tsx`: dark blue-grey map, mauve streets, green parks, What's On / Who's Out segmented control, bottom sheet and compact community activity rows.
- `EventCardContent`, event and venue detail screens: white titles, pink location links, restrained dividers, event information, current presence and place-based messages.
- `CustomTabBar`, `PresenceButton`: map/profile destinations around the central brand flame/pin, soft presence pulse.
- Profile, network, notification settings and onboarding components: charcoal surfaces, selected pink outlines and tints, notification audience choices, pseudonyms and avatars, concise consent and privacy language.
- Existing brand assets: the actual flame/pin mark and app icon, not a newly drawn logo.

All ten supplied screenshots (`Downloads/IOS/1.PNG` through `10.PNG`) were visually examined: What's On map, Who's Out map, event detail, vibe modal, presence duration, successful check-in, place activity/chat, profile, expanded event list, notification audiences. Screens 1, 2 and 7 appear in the site as optimized real screenshots. The map backdrop is a crop of screen 1. No live map, live count or fabricated feed is implied; these are app previews.

## Web direction

Large editorial typography and generous spacing extend the application's compact UI. The map, existing brand mark, screenshot compositions and the three vibe colors carry the identity. There are three experience chapters, followed by a final download invitation; no pricing, testimonials or fictitious features.

Desktop uses asymmetry, rotated phone frames, orbital lines and floating annotations. Tablet preserves side-by-side layouts. Mobile moves the main CTA above the screenshot, retains the two discovery choices side by side, and rearranges the community story before its phone. Brief entrance animations are limited to hover-capable devices; there are no infinite animations, autoplay, video or scroll listeners. Reduced motion disables transitions, animations and smooth scrolling.

The interactive vibe control is explicitly an illustration. Its labels and color states match the app. The two discovery buttons switch between the real map screenshots. Privacy copy reflects existing product behavior: presence duration, notification control, and no continuous background location tracking.

## Performance and accessibility

No external font, runtime library, tracking script, geolocation request or third-party request. Screenshots use responsive 390/780 px WebP sources, intrinsic dimensions, and lazy loading below the hero. The hero image is prioritized. System fonts eliminate font downloads and layout shifts. SVG/CSS decoration remains code-native.

Native buttons and a native dialog provide keyboard support and modal focus containment. Escape, backdrop click and the close button dismiss the store picker; focus returns to the opening control. Live regions announce discovery and vibe changes. Focus outlines, a skip link, meaningful screenshot alternatives and text labels supplement color. Main CTA pink is slightly darkened for white-text contrast, while map and brand colors retain the app palette.

## Verification

Run `node scripts/site.test.mjs` and `node turnstile-bridge.test.mjs`.

For browser checks, start the static site on localhost:4173 and Chrome with a temporary profile and `--remote-debugging-port=9223`, then run `node scripts/browser-qa.mjs` (Node 22). The script uses native fetch/WebSocket and Chrome DevTools, so it adds no dependency. Keep DevTools bound to localhost and close this test browser afterward.

Verified in local Chrome at 1440, 768, 390 and 320 px: layout, image loads, modal focus trap and restoration, Escape dismissal, discovery switching, vibe selection, reduced motion, and console errors. Emulated iPhone, Android and desktop-style iPad user agents verify CTA labels/destinations and access to both stores. These are browser emulation checks, not a claim of testing physical iOS/Android hardware. All legal pages were opened at the original routes and checked at mobile width.

No Lighthouse score is claimed. The Google Play destination uses the listing URL supplied by the owner. The App Store destination remains a placeholder. Store availability has not been independently verified.
