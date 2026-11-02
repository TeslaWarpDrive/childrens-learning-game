# Lucy letters: Claude

**Preview:** https://raw.githack.com/TeslaWarpDrive/childrens-learning-game/test/lucy-letters-claude/index.html?mode=guest

Open that, choose Letter Post, then tap any letter. `/v1-letter-post/` opened directly sends anyone who is not signed in or in guest mode back to the sign-in page, so use `index.html` or `/v1-letter-post/?mode=guest`.

## What changed
Letter Post's listen page now shows that letter's Lucy cutout on the theme-colored circle. The match page keeps the old photo, as Bradley decided.

| File | Change |
|---|---|
| `v1-letter-post/assets/lucy-letter-a..z.webp` | 26 cutouts, new |
| `v1-letter-post/app.js` | `pic()` takes an optional cutout; only Letter Post's `listen()` passes one |
| `v1-letter-post/style.css` | Cutout is centered with no 1.04 zoom, and keeps a gentle 2px breathe. Respects reduced motion |
| `sw-assets.js` | Rebuilt: 26 images precached, cache version 41ba742e285bd40f → b0349ebb347d484d. `sw.js` needed no edit |
| `tests/lucy_letters.cjs` | New browser test |

Ribbon Road shares `app.js` but not `style.css`, and Moonboat has its own copies, so neither changes. No database, account or Supabase work was done.

## Shipped assets
- 26 WebPs, 768px, transparent corners. 1.53 MB total (1,530,816 bytes), 44 to 75 KB each.
- All 26 are byte-identical to `57ce4ce`.
- The PNG masters were not shipped. They would add about 15 MB to the offline download and the game does not need them.

## Screenshots
In `reports/lucy-letters-claude/`:
- All 26 letters per theme, at whiteboard size: `sheet-air-mail.png`, `sheet-candy-post.png`, `sheet-dark.png`
- Full page at each size and theme, nine in total, named `<size>-<theme>-<letter>.png`. Sizes: `tablet` 1024x768, `chromebook` 1366x768, `whiteboard` 1920x1080. Air mail shows A, Candy post L, Dark Q.

## Needs Bradley's eye
1. **D has a flaw on Dark.** Pale leftover background shows inside the D and along its base. It is the worst of the 26 and is barely visible on Air mail. See `sheet-dark.png`. The images are approved as-is, so I did not touch it; fixing it means a new D cutout.
2. **The paw badge overlaps the edge of some letters.** It covers up to about 4% of the picture, most on G, U, H, S and A. The preview has no badge. All stay readable, so I left the badge alone as chrome.
3. **U has a soft pale smudge** beside Lucy's chest, faintly visible on Dark. Also left as approved.

## Testing
`tests/lucy_letters.cjs` passes: all 26 letters × 3 themes × 6 sizes (the three above plus 768x1024, 1024x576, 390x844). It checks the right image, the circle color, no stretching or overflow, the paw still present, and no errors. It also checks match, home and celebrate keep their photos, Moonboat and Ribbon Road keep theirs, and all 26 images load offline through the service worker.

Portrait diameter: 280px whiteboard, 220px tablet and Chromebook, 130px short landscape, 90px phone.

Existing tests, on this branch against the code before the change (all use local or mocked data):

| Result | Tests |
|---|---|
| Pass after the change | `run_tests.py` 6/6, runtime_smoke, silk_smoke, picture_swap, layout_build, layout_offline, layout_ribbon_unchanged, motion_smoke, fix24_layout, fade_swap, correct_word, celebrate_delay, tidy_1, tidy_1b, fixlist |
| Fail the same way before and after | home_flow (header text), confetti_smoke ("replay preserves the rain", 0 vs 24) |
| Unfinished on both | browser_smoke: each build reached 17 passes with no failures in a 25-minute run, then hit the time limit. The full test is longer than that here, so its later cases are unverified |

One earlier browser_smoke run on this branch stalled on match-page audio after 5 passes. It did not repeat in the 25-minute run, and this change does not touch audio, so I read it as intermittent, but I did not find the cause. celebrate_delay and correct_word needed the Chrome path set and also pass on the original code.
