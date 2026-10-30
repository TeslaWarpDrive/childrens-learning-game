FIX-2-4 and FIX-24B apply CSS layout fixes on `test/lucy-fix-2-4`. The follow-up builds on `721553e`.

Files changed in the follow-up:

- `home/home.css`: extends the existing short-landscape query to fit the initial and returning-child login cards at 1366x768 and 1024x768. Lucy sits beside the greeting, gaps are tighter, and inputs, buttons, and the grown-up link retain their 60px minimum height. The layout picker still fits without scrolling.
- `v1-letter-post/word-pictures.css`: enlarges letter pages in all three layouts only at 1600px wide and 950px tall. At 1920x1080, headings are 80px and glyphs about 302px. At 2560x1440, headings are about 102px and glyphs 400px. The letter-page app can use 2240px, Aa cards grow with available height, Lucy is 280px wide, and continuation buttons are 88px tall with 28px text. Existing reward pictures and word text grow to 320px and 44px. Letter pages have no vocabulary picture before the matching step, so no content was added.
- `tests/fix24_layout.cjs`: adds initial/returning login checks, letter-page dimensions and visible continuation checks, reward sizing, home glyph checks, and optional visual comparisons with a named baseline commit.
- `sw-assets.js`: regenerated with `python3 scripts/build-offline-manifest.py`.
- `reports/fix24-summary.md`: this report.

The earlier picture-choice sizes, Moonboat's three-card grid and circular fades, Ribbon Road's rounded-square fades, and Letter Post's picture treatment remain in place. Home roads retain their earlier whiteboard sizing.

Follow-up verification:

- `python3 tests/run_tests.py`: PASS, all six strict groups.
- `FIX24_BASELINE=721553e node tests/fix24_layout.cjs`: PASS. Both 768px-tall login states and the picker fit without scrolling. All three layouts pass enlarged letter, home, picture-choice, and reward checks at 1600x950, 1920x1080, and 2560x1440. The 33 baseline captures at 768x1024, 1440x1000, and 1920x900 match geometry and computed styles exactly. Screenshot comparison separates game content from native header-control repaint and permits at most 0.1% differing pixels with channel deltas no greater than 32 for antialiasing. Screenshots are saved under `/tmp/lucy-fix24`.
- `node tests/runtime_smoke.cjs`: PASS, 234 rounds across all three layouts and themes.
- `node tests/motion_smoke.cjs`: PASS, all 12 cases, including a final run after the portrait spacing adjustment.
- `node tests/silk_smoke.cjs`: PASS, all letters, chooser checks, and nine viewport/theme cases.
- `node tests/grown_ups_runtime.cjs` and `node tests/grown_ups_smoke.cjs`: PASS.
- `node tests/home_flow.cjs`: existing failure at line 51, the hidden small-screen tagline.
- `node tests/confetti_smoke.cjs`: existing failure at line 98, zero confetti pieces after replay instead of 24. Both failures were reproduced on `ca34d50` during FIX-2-4.
- `node tests/browser_smoke.cjs`: five cases passed before the 480-second process limit, exit 124. The full browser suite is not claimed green. The three known shard timeouts documented in `reports/fade-swap.md` remain outside this follow-up and were not pursued.
- `node --check tests/fix24_layout.cjs` and `git diff --check`: PASS. No package manifest or separate lint configuration is present.

Checks use local isolated browsers, blocked external requests, or an in-memory account fixture. No live account sign-in, database changes, or deployment occurred. The master account and the user's account deletions, passwords, and settings remain untouched. Markup, game behavior, audio, content, and image assets are unchanged. Job files and report logs are excluded from the commit.
