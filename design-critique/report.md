⚠️ DEGRADED: single-context (no sub-agent tool exposed to this run; Assessment A and B were run one after another in one context)

# Letters with Lucy — Impeccable design critique (read-only)

- **Target:** live build https://thestreetfam.com/letterswithlucy/ (source `codex/home-flow-ribbon` @ `ca34d50`)
- **Method:** Impeccable v4.8.0 `critique` + `audit` references (loaded from the plugin's public source, `pbakaus/impeccable`, `cursor-plugin/skills/impeccable`; the installed plugin skill would not load in the bot runtime). Assessment B = `impeccable detect --json` on the repo (see `detector.json`) + headless Chromium screenshots and DOM measurements (`metrics.json`). The live-server overlay step was skipped, so the browser has no overlay.
- **Scope:** "Play without saving" only. No sign-ins, no accounts, no database. Viewports: 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080, plus a slow network (400 ms latency, 50 KB/s) and an offline reload.
- **Mode:** Experience/Operate for a 3–4 year old, with a teacher driving the whiteboard.
- Captured 2026-10-27, about 7:20–7:50 PM CT.
- **Nothing in the game was changed. Every fix below is a suggestion only.**

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Wrong-tap feedback is a 15–16 px text line that a child can't read. It relies entirely on audio. |
| 2 | Match real world | 4 | Lucy, letters, mail and planets all fit the world. Speaking every word is the right call. |
| 3 | User control & freedom | 3 | Back/Home are present. "Choose a layout" is a 32 px-tall text link. |
| 4 | Consistency | 2 | Ribbon Road uses large photo-style art. Letter Post and Moonboat use smaller, different picture treatments and different letter pagers. |
| 5 | Error prevention | 3 | Grown-up controls (theme, mute, sign in) sit within a child's reach on every screen. |
| 6 | Recognition over recall | 4 | Pictures plus spoken words, no reading needed. |
| 7 | Flexibility | 3 | Works on all sizes, but nothing scales up for the whiteboard. |
| 8 | Aesthetic & minimalist | 2 | Kickers, taglines, footers and helper lines clutter a pre-reader's screen. |
| 9 | Error recovery | 3 | A retry clip plays after a wrong tap, but there's no visual "try again" state on the card. |
| 10 | Help | n/a | Pre-K play surface. The help is audio. |
| **Total** | | **27/36** | **Good. Address weak spots.** |

## Design specificity verdict
**Design review:** The game clearly feels made for this product. Lucy's photo, the three worlds and the letter-mail and planet metaphors are specific and warm, and Ribbon Road with the faded ElevenLabs pictures is the strongest screen. The weakest parts are the generic "app chrome" layered on top: small-caps kickers ("A LITTLE DISCOVERY", "SORT THE SOUND MAIL"), tagline footers ("Made for little explorers · ages 3–4") and pill controls. All of that text is for adults and does nothing for a 3-year-old.

**Detector (repo scan, 29 findings outside `previews/`):** cream-palette ×4 (intended, false positive per the locked cream chrome rule), bounce-easing ×7 (intended cheer motion, fine), side-tab/border-accent ×5, organic-clip-path and repeating-stripes in the three game pages (decorative, intended), kicker-above-heading on home, hard-offset shadow on home, and **broken-image ×4 in `accounts/index.html`** (`<img>` with no src, likely avatar slots filled by JS, so check it). The detector agrees with the review about the kicker clutter. Most of its other findings are intentional style.

## What's working
1. **Ribbon Road match screen:** three large cards (296×283 px at 1024 wide) with 180 px pictures, spoken labels and a calm fade. This is the model for the other two layouts. (`screenshots/1024x768-silk-match.jpg`)
2. **Offline works.** Reloading the page offline brought back the login and the layout picker from the service worker cache. (`screenshots/offline-reload.jpg`, `offline-layouts.jpg`)
3. **Theme coverage is solid.** All 9 themes stayed legible on the home and match screens, with no horizontal overflow and no JS errors at any size. (`sheet-*-themes.jpg`)

## Findings, ranked by impact for kids and the teacher

### 1. The Moonboat letter page pushes "Find its picture" off screen (1440×900 and 1024×768). High impact.
- **Where:** Moonboat, letter page. Page height is 1013 px at 1440×900 and 901 px at 1024×768.
- **Evidence:** `screenshots/1440x900-space-letter.jpg`, `1024x768-space-letter.jpg`. The main button is cut off at the bottom edge. This lines up with Codex's Moonboat 1440 smoke timeout.
- **Suggested fix:** size the big letter planet from viewport height (e.g. `min(52vh, 40vw)`), or move the CTA beside the planet in landscape, so the CTA is always above the fold.

### 2. The layout picker is cut off on 768-tall landscape screens (Chromebook 1366×768, tablet 1024×768). High impact.
- **Where:** Home, after "Play without saving". The page is 905–912 px tall in a 768 px viewport.
- **Evidence:** `screenshots/1366x768-02-layouts.jpg`, `1024x768-02-layouts.jpg`. The bottom of the three world cards and "Sign in to save" are below the fold.
- **Suggested fix:** on short landscape screens, collapse the kicker, subtitle and "Playing without saving" banner into one line, and let the cards shrink with `vh`.

### 3. Moonboat word pictures are too small to tap and recognize (94 px). High impact.
- **Where:** Moonboat find-the-picture, every size. The rows are 444–533×120 px, but the picture is 94 px inside a dark circle. Dark items like "ball" and "sun" nearly disappear in the Dark theme.
- **Evidence:** `screenshots/1024x768-space-match.jpg`, `sheet-moonboat-themes.jpg`.
- **Suggested fix:** use the same picture-forward card as Ribbon Road (picture ≥160 px), or at least double the picture and lighten the circle so the circular fade shows the art.

### 4. Nothing scales up for the whiteboard (1920×1080). High impact for the teacher.
- **Where:** All layouts at 1920. Ribbon Road pictures stay 180 px and its letter bubbles stay 112 px. The layout picker cards fill roughly 1/3 of the screen.
- **Evidence:** `screenshots/1920x1080-02-layouts.jpg`, `1920x1080-silk-match.jpg`, `sheet-whiteboard.jpg`.
- **Suggested fix:** add a ≥1600 px breakpoint (or `clamp()` sizing) that scales cards, pictures and letters about 1.5×, so kids across the room can see them.

### 5. Wrong-tap and correct-tap feedback is mostly text. Medium-high impact.
- **Where:** All three match screens. The feedback line ("That's octopus. Try another picture") is 15–16 px, sits at the bottom left, and is far from the card the child tapped.
- **Evidence:** `screenshots/1920x1080-silk-wrong.jpg`, `1024x768-*-wrong.jpg`.
- **Suggested fix (no hints, per the locked rule):** give the tapped card a brief gentle wobble or dim on a wrong tap and a glow or pop on a correct tap, so the feedback lives on the card. Audio stays as it is.

### 6. Grown-up controls sit in the child's tap zone. Medium impact.
- **Where:** Top-right on every game screen: mute (50×50), theme select (≈96×46) and "Sign in to save" (123×44). "Choose a layout" is 85×32 in the footer.
- **Evidence:** `metrics.json` (`small` lists), any `*-match.jpg`.
- **Suggested fix:** group them behind one grown-up button (long-press or a small gear), and enlarge "Choose a layout" to ≥48 px tall or move it into that group. Child targets are already 104–180 px and fine.

### 7. Adult-facing copy clutters the child's screens. Medium impact.
- **Where:** Kickers ("A LITTLE DISCOVERY", "LOOK THROUGH THE TELESCOPE"), helper lines ("Which picture has our little sound?", "Tap a picture."), the footer tagline, and the "Scroll for all 26 letters" hint on Ribbon Road. The detector also flagged kicker-above-heading.
- **Evidence:** `sheet-ribbon-themes.jpg`, `sheet-letterpost-themes.jpg`.
- **Suggested fix:** `distill`. Keep the big question, the letter tile and the pictures, and drop or fade the rest on child screens.

### 8. Picture style is inconsistent across layouts. Medium impact.
- **Where:** Ribbon Road shows rich faded art. Letter Post shows flat, smaller pictures in stamp frames, and some are hard to read at 176–189 px (e.g. "ball" reads as a flag). Moonboat shows tiny circles.
- **Evidence:** compare the bottom rows of the three `sheet-*-themes.jpg` files.
- **Suggested fix:** decide on one picture asset set per word across all layouts, keeping the per-layout fade shapes already locked (circle for Moonboat, rounded square for Ribbon Road, Letter Post untouched).

### 9. Ribbon Road home is very long (≈2.2–2.4k px). Low-medium impact.
- **Where:** Ribbon Road home at all sizes. Kids have to scroll to reach letters past F.
- **Evidence:** `metrics.json` (`silk.home.scrollH`), `sheet-ribbon-themes.jpg`.
- **Suggested fix:** page the letters like the other two layouts, or show all 26 in a compact grid on landscape screens.

### 10. Slow load shows a blank avatar and plain shell. Low impact.
- **Where:** Login on a slow network. At 1.5 s, Lucy's photo is an empty ring. Full load took ≈6.4 s at 50 KB/s.
- **Evidence:** `screenshots/slow-1500ms.jpg` vs `slow-loaded.jpg`.
- **Suggested fix:** inline a tiny blurred placeholder of Lucy, and preload the avatar.

### Not covered
- **Long names and empty states:** not reachable without signing in, so untested by rule.
- **Letter Post smoke timeouts at 768/1440:** no visible breakage in these captures. The letter and match screens fit at both sizes, so the timeout is more likely about timing (settle/animation) than layout.
- **Real touch gestures:** untested. Measurements came from emulated viewports in headless Chrome.

## Audit snapshot

| Dimension | Score | Key finding |
|---|---|---|
| Accessibility | 3 | Labels present. Small grown-up targets. Text feedback too small. |
| Performance | 3 | Loads in 0.3–0.6 s on a fast network, about 6.4 s on a slow one. The service worker caches the game for offline. |
| Theming | 3 | 9 themes all legible. Cream chrome is intentional. |
| Responsive | 2 | Overflow at 768-tall landscape (#1, #2). No whiteboard scaling (#4). |
| Implementation integrity | 3 | `accounts/index.html` empty `<img>` src ×4 needs checking. |
| **Total** | **14/20** | **Good** |

## Questions for Bradley
1. Should the next pass be `adapt` (fixes #1, #2, #4), `distill` (#6, #7), or picture consistency (#3, #8)?
2. Is a whiteboard-only breakpoint wanted, or should every size scale fluidly?
