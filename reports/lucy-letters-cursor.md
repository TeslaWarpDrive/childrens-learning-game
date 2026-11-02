# Lucy letters — Cursor

Letter Post’s listen page now shows that letter’s approved cutout inside the existing theme-colored circle. The match page still uses the specs photo. Home and celebrate still use their own photos. Moonboat and Ribbon Road are unchanged. No database changes.

Preview: https://raw.githack.com/TeslaWarpDrive/childrens-learning-game/test/lucy-letters-cursor/v1-letter-post/

## What changed

`pic()` in `v1-letter-post/app.js` still builds `lucy-<mood>.jpg` unless the caller passes an image. Only Letter Post’s listen page (`C.kind === 'post'`) passes `assets/lucy-letter-<letter>.webp`. Ribbon Road loads this same script with `kind: 'silk'` and still gets `lucy-specs.jpg`. `v3-moonboat/app.js` was not edited.

The cutout CSS is only in `v1-letter-post/style.css`, which the other worlds do not load, and only on `.post[data-screen="listen"] .guide-lucy .letter-cutout`. It fills the circle with `object-fit: cover` and `object-position: center`, so the old specs-photo crop (`50% 37%` and `scale(1.04)`) does not shift the letter. The listen portrait still rises 2px while it breathes; that rise has no zoom, so the cutout stays inside the circle. Reduced motion and calm still stop the animation. Match, home, and celebrate keep the photo crop.

The 26 WebPs were copied byte-for-byte from `test/lucy-letters-preview` at `57ce4ce` (`letter-post/cutout/lucy-letter-a.webp` through `z.webp`). PNGs, `old-v1/`, and the other preview files were not shipped. The images themselves were not edited.

`python3 scripts/build-offline-manifest.py` regenerated `sw-assets.js`. The service worker cache name follows that version.

| | Before | After |
|---|---|---|
| Cache version | `41ba742e285bd40f` | `3d35ddefc5169d32` |
| Precached files | 228 | 254 |

## Paw stamp and visor glint

The visor glint is already `display: none` outside Moonboat, so it never draws on the Letter Post listen circle. It was left as it is.

The paw stamp stays in its usual bottom-right place. All 26 listen portraits were rendered and checked. The stamp sits in the empty corner of the circle, beside Lucy, and does not cover any letter, so it was not hidden or moved.

## Screenshots

Listen page, letter B. Circle color is the theme’s `--accent2` (Air mail `#b9dce6`, Candy post `#9ddcda`, Dark `#355b71`).

| | Air mail | Candy post | Dark |
|---|---|---|---|
| Tablet 768×1024 (circle 220px) | [theme 0](lucy-letters-cursor/listen-768x1024-theme0.png) | [theme 1](lucy-letters-cursor/listen-768x1024-theme1.png) | [theme 2](lucy-letters-cursor/listen-768x1024-theme2.png) |
| Chromebook 1024×576 (circle 130px) | [theme 0](lucy-letters-cursor/listen-1024x576-theme0.png) | [theme 1](lucy-letters-cursor/listen-1024x576-theme1.png) | [theme 2](lucy-letters-cursor/listen-1024x576-theme2.png) |
| Whiteboard 1920×1080 (circle 280px) | [theme 0](lucy-letters-cursor/listen-1920x1080-theme0.png) | [theme 1](lucy-letters-cursor/listen-1920x1080-theme1.png) | [theme 2](lucy-letters-cursor/listen-1920x1080-theme2.png) |

Checks on the same local file pages:

- [Match, 1920×1080, Air mail](lucy-letters-cursor/match-1920x1080-theme0.png) still uses `lucy-specs.jpg` (the glasses photo), with the old face crop.
- [Home, 1920×1080](lucy-letters-cursor/home-1920x1080-theme0.png) still uses `lucy-default.jpg`.
- Celebrate still uses `lucy-celebrate.jpg`.
- [Ribbon Road listen](lucy-letters-cursor/ribbon-listen-1280.png) still uses `lucy-specs.jpg`.
- [Moonboat listen](lucy-letters-cursor/moonboat-listen-1280.png) still uses `lucy-specs.jpg`.

## Shipped assets

26 WebPs, 1,530,816 bytes total. Each is 768px and transparent.

| File | Bytes | File | Bytes |
|---|---:|---|---:|
| lucy-letter-a.webp | 64,672 | lucy-letter-n.webp | 59,016 |
| lucy-letter-b.webp | 53,938 | lucy-letter-o.webp | 69,116 |
| lucy-letter-c.webp | 56,986 | lucy-letter-p.webp | 57,138 |
| lucy-letter-d.webp | 62,044 | lucy-letter-q.webp | 56,086 |
| lucy-letter-e.webp | 63,352 | lucy-letter-r.webp | 61,108 |
| lucy-letter-f.webp | 52,560 | lucy-letter-s.webp | 63,594 |
| lucy-letter-g.webp | 64,958 | lucy-letter-t.webp | 56,088 |
| lucy-letter-h.webp | 58,350 | lucy-letter-u.webp | 63,346 |
| lucy-letter-i.webp | 51,524 | lucy-letter-v.webp | 56,492 |
| lucy-letter-j.webp | 58,702 | lucy-letter-w.webp | 44,226 |
| lucy-letter-k.webp | 75,246 | lucy-letter-x.webp | 67,528 |
| lucy-letter-l.webp | 48,216 | lucy-letter-y.webp | 50,264 |
| lucy-letter-m.webp | 55,300 | lucy-letter-z.webp | 60,966 |

## Tests

Local `file://` only. No sign-in, and no Supabase.

- `python3 tests/run_tests.py`: 6/6 passed.
- `tests/motion_smoke.cjs`: 12 passed, including Letter Post and Moonboat at 390, 768, and 1920, with motion and reduced motion.
- `tests/silk_smoke.cjs`: Ribbon Road A–Z and all three palettes passed, plus the chooser.
- `tests/browser_smoke.cjs`: 18 passed. Letter Post and Moonboat, letters B, J, X, and Z, at 390, 768, and 1440, across all three themes.
- A focused check opened every letter on the Letter Post listen page, confirmed the WebP decoded at 768px, and confirmed the other screens still requested the jpg photos.

## Left alone

The master administrator account was not used. No accounts, passwords, settings, or progress were changed. Nothing was merged or deployed.
