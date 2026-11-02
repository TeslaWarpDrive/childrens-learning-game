# KID-FIXES-JOB — kid sign-out lands somewhere kid-friendly + kids can pick their own picture

Repo: TeslaWarpDrive/childrens-learning-game. Main (live line) = `codex/home-flow-ribbon` @ 65d33f1 (includes the Lucy letters work and the cleaned D).
This job is SPLIT across three models (Bradley 2026-11-01). Each works ONLY on its own part and branch:
- **Codex** — Fix 1 (kid sign-out) on `test/kid-fixes-codex`.
- **Claude** — Fix 2 (kid picture picker) on `test/kid-fixes-claude`.
- **Cursor** — reviewer/tester. After Codex and Claude push, review both diffs, test each fix and both together (merge both into `test/kid-fixes-cursor`, resolve any conflicts, fix real bugs you find there with a short note). Do not build either fix from scratch.
Do not touch another model's part or branch.

## First run = SHORT REPEAT-BACK ONLY
In a few lines: the job in your own words, your plan, any questions. Change NO files except your repeat-back report. No commits, no pushes, no Supabase writes. Wait for Bradley's go.

## Fix 1 — kid sign-out goes to the wrong page
Today when a kid signs out (e.g. from the progress page), they land on the grown-up portal sign-in. Cause seen: `accounts/portal.js` sign-out does `location.href='index.html'`, relative to `accounts/`, so it opens `accounts/index.html`. `accounts/navigation.js` has a similar sign-out that goes to `accounts/index.html`.
Wanted: a kid who signs out lands on the game's home screen (site root `index.html`, the login / play-without-saving / layout picker). A grown-up who signs out may stay on the grown-up sign-in. Never use a bare `/index.html` (site lives under `/letterswithlucy/`). Check every kid sign-out path, not just one.

## Fix 2 — kids can't choose or upload their own picture
Grown-ups can still change their own picture. Kids lost that ability after the portal reorganization (the my-account page is hidden for kids). Wanted: a signed-in kid can pick one of the Lucy pictures or upload their own, from their own progress/profile area, and it saves and shows everywhere their picture shows. Kid-sized, simple UI matching the cream chrome.
Before building, check READ-ONLY whether a kid session is allowed to update its own avatar in the database/edge functions. If it needs a database or function change, write a change file under `supabase/` and STOP; do not apply it.

## Out of scope — leave unchanged
Game screens and layouts, Lucy letters, grown-up flows other than the sign-out destination check, product rules (cream chrome, Ribbon Road default, no public grown-up signup, no groups, one master account, 30-min grown-up / 6-hour kid sessions).

## Security rules (verbatim)
- "you must leave the master administrator account completely alone — username Brandy, display name Brandy, password ABCD1234 — and must not modify, rename, delete, or otherwise touch it." No signing in as it, no progress reset on it.
- "I deleted some grownups and some kids as a test. Whatever I deleted, it doesn't need to add back any password changes, any setting change at all. It doesn't need to edit the database back to what it was before. If it does need to edit the database for other reasons, that's fine but don't take away the changes I made"
- Never delete or restore pre-existing accounts. Use only disposable test accounts (delete only the ones you made).

## Lean testing (Bradley 2026-11-01)
Test only what changed: kid sign-out lands on the home screen (and grown-up sign-out still works), a kid can pick a Lucy picture and upload one and it sticks after reload. Plus the quick existing static/unit checks. NO full browser suites, shards or live-site runs. If any cached files change, rebuild the offline manifest with `python3 scripts/build-offline-manifest.py`.

## Delivery
Commit and push your own branch only. No merge to main, no deploy, no PRs to main.
Short report `reports/kid-fixes-<model>.md`: what changed (files), what you tested, 2–3 screenshots (Cursor: review verdict per fix plus anything it fixed), and the githack preview link
`https://raw.githack.com/TeslaWarpDrive/childrens-learning-game/test/kid-fixes-<model>/index.html`. Bradley approves what goes to main.
