# Lucy letter portraits

Letter Post's listen page now shows the selected letter's approved Lucy cutout over the existing theme-colored circle. The match page keeps `lucy-specs.jpg`.

Branch: `test/lucy-letters-codex`. Implementation commit: `f02377f`. The remote branch was verified after push.
Preview: https://raw.githack.com/TeslaWarpDrive/childrens-learning-game/test/lucy-letters-codex/v1-letter-post/

The githack URL returned a Cloudflare HTTP 403 to this environment during the post-push check. Hosted preview rendering remains unverified. Local browser and offline checks passed.

Changes:

- `v1-letter-post/app.js` passes a letter to the portrait helper only from Letter Post's listen page. Ribbon Road uses the same helper without a letter.
- `v1-letter-post/style.css` displays the full cutout canvas without the old photo zoom or paw overlay. Existing portrait dimensions, circle colors, and layout remain unchanged.
- `v1-letter-post/assets/lucy-letter-a.webp` through `lucy-letter-z.webp` are byte-identical copies from approved preview commit `57ce4ce`. No image edits or PNG duplicates.
- `sw-assets.js` precaches all 26 cutouts. The generated cache version is `109387201febde15`. `sw.js` derives its cache name from this version.
- `tests/lucy_letters.cjs` and `tests/lucy_letters_offline.cjs` provide repeatable browser checks. Evidence is in `reports/lucy-letters-codex/`.

Validation passed:

- All 26 letters in all three themes at all three viewport sizes: 234 listen-page checks. Images decode at 768×768, keep the approved canvas, and cause no horizontal overflow. Each corresponding match page uses the original portrait.
- At 1366×768, baseline/current DOM, geometry, and sampled computed styles match for Letter Post home, match, and celebration screens. Ribbon Road and Moonboat also match on listen. Comparison uses starting commit `56c396e`.
- All files under `v3-moonboat/` and `v4-silk-thread/` remain unchanged. Other Lucy images, avatars, chrome, and product rules remain unchanged.
- All 26 files match the approved source bytes and retain an alpha channel with transparency.
- A locally installed service worker serves all 26 cutouts and renders the listen portrait after the browser goes offline. See [offline evidence](lucy-letters-codex/offline.json).
- `node --check v1-letter-post/app.js`, `node --check tests/lucy_letters.cjs`, and `git diff --check` pass.

Browser checks use fresh local browser profiles and block external requests. No live database requests, account sign-ins, account changes, or database changes occurred. The protected administrator and deleted accounts were left alone.

Reproduce with `node tests/lucy_letters.cjs` and `node tests/lucy_letters_offline.cjs`. Rebuild the offline manifest with `python3 scripts/build-offline-manifest.py`.

Screenshots show letter B on the listen page. All nine screenshots were visually reviewed. Automated checks cover A through Z. Tests use reduced motion and muted audio.

| Viewport | Air mail | Candy post | Dark |
| --- | --- | --- | --- |
| Tablet 768×1024 | [Screenshot](lucy-letters-codex/tablet-theme-0.png) | [Screenshot](lucy-letters-codex/tablet-theme-1.png) | [Screenshot](lucy-letters-codex/tablet-theme-2.png) |
| Chromebook 1366×768 | [Screenshot](lucy-letters-codex/chromebook-theme-0.png) | [Screenshot](lucy-letters-codex/chromebook-theme-1.png) | [Screenshot](lucy-letters-codex/chromebook-theme-2.png) |
| Whiteboard 1920×1080 | [Screenshot](lucy-letters-codex/whiteboard-theme-0.png) | [Screenshot](lucy-letters-codex/whiteboard-theme-1.png) | [Screenshot](lucy-letters-codex/whiteboard-theme-2.png) |

The screenshots include the full page. At the Chromebook viewport, the existing page extends vertically beyond 768 pixels. This change preserves the layout.

The 26 shipped WebP files total **1,530,816 bytes**, about **1.46 MiB**. Individual files range from **44,226 to 75,246 bytes**. Each file is 768×768.

| Letter | Bytes |
| --- | ---: |
| A | 64,672 |
| B | 53,938 |
| C | 56,986 |
| D | 62,044 |
| E | 63,352 |
| F | 52,560 |
| G | 64,958 |
| H | 58,350 |
| I | 51,524 |
| J | 58,702 |
| K | 75,246 |
| L | 48,216 |
| M | 55,300 |
| N | 59,016 |
| O | 69,116 |
| P | 57,138 |
| Q | 56,086 |
| R | 61,108 |
| S | 63,594 |
| T | 56,088 |
| U | 63,346 |
| V | 56,492 |
| W | 44,226 |
| X | 67,528 |
| Y | 50,264 |
| Z | 60,966 |
