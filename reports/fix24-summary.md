FIX-2-4 implements CSS sizing fixes on `test/lucy-fix-2-4`, based on `ca34d50`.

Files changed:

- `home/home.css`: one short-landscape breakpoint reduces the layout picker height and gives "Sign in to save" a 64px control with 20px text. Closes an existing unclosed motion media rule so the breakpoint also applies with reduced motion.
- `v1-letter-post/word-pictures.css`: shared variables at 1600px wide and 950px tall scale all three layouts. Pictures are 320px, words 44px, match letters 110px, and headings 64px. The app maximum width is 1760px. Letter pages and home letter controls scale too. Moonboat uses three picture columns and a capped letter-page circle to keep its continuation visible.
- `sw-assets.js`: regenerated the offline asset version with `python3 scripts/build-offline-manifest.py`.
- `tests/fix24_layout.cjs`: repeatable local browser checks and screenshots under `/tmp/lucy-fix24`.
- `reports/fix24-summary.md`: this report.

Verification:

- `python3 tests/run_tests.py`: PASS, all six strict checks.
- `node tests/fix24_layout.cjs`: PASS. Home fits without scrolling at 1366x768 and 1024x768, including sign-in and offline status. All three layouts pass home, letter, and picture checks at 1600x950, 1920x1080, 2560x1440, 1440x1000, and 1920x900. The last two remain below the whiteboard breakpoint. Screenshot review covers all three themes, Moonboat's circular fades, Ribbon Road's rounded-square fades, and Letter Post's existing picture treatment.
- `node tests/runtime_smoke.cjs`: PASS, 234 rounds across all three worlds and themes.
- `node tests/motion_smoke.cjs`: PASS, all 12 cases after capping Moonboat's letter circle. An earlier run caught continuation below the viewport and failed the reduced-hover position check.
- `node tests/silk_smoke.cjs`: PASS, chooser, all 26 letters, and all nine viewport/theme cases.
- `node tests/grown_ups_runtime.cjs` and `node tests/grown_ups_smoke.cjs`: PASS.
- `node tests/home_flow.cjs`: FAIL at line 51 because the small-screen game brand hides the tagline. Reproduces on an untouched archive of `ca34d50`.
- `node tests/confetti_smoke.cjs`: FAIL at line 98, replay expects 24 pieces and receives zero. Reproduces on the same untouched baseline.
- `node tests/browser_smoke.cjs`: five cases passed before the full run was stopped at 480 seconds, matching the previous report runner limit. It was waiting for celebration at line 105 in Letter Post's tablet case. Separate runs with `BROWSER_SMOKE_SHARD=4` and `BROWSER_SMOKE_SHARD=5` both PASS all three themes, covering Moonboat at 768px and 1440px. The starting commit's `reports/fade-swap.md` documents three known timeouts in shards 1, 2, and 5. They were not pursued; this run does not claim a fully passing browser suite.
- `node --check tests/fix24_layout.cjs` and `git diff --check`: PASS. No package manifest or separate lint configuration is present.

All browser checks use isolated local contexts, blocked external requests, or an in-memory account fixture. No live account sign-in, account changes, database changes, or deployment occurred. The master account and the user's prior account/settings changes remain untouched. `index.html`, game logic, audio, content, and picture assets are unchanged. Job instructions and report logs are excluded from the commit.
