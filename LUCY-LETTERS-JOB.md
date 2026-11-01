# LUCY-LETTERS-JOB — per-letter Lucy in Letter Post's listen-page portrait

Repo: TeslaWarpDrive/childrens-learning-game. Main (live line) = `codex/home-flow-ribbon` @ f81ccb0.
Your branch (made from main): `test/lucy-letters-codex`, `test/lucy-letters-claude`, or `test/lucy-letters-cursor` — work ONLY on yours, alone.

## First run = REPEAT-BACK ONLY
Restate this job in your own words with your plan and any questions. Change NO files except your repeat-back report. No commits, no pushes, no Supabase. Wait for Bradley's go.

## Goal
Letter Post's listen page round portrait (today `v1-letter-post/app.js` `pic()` shows `assets/lucy-<mood>.jpg`, e.g. the old Ready Set ABC `lucy-specs.jpg`-style photo) must show **that letter's Lucy cutout** — a transparent image sitting over the theme-colored circle.
- Assets: branch `test/lucy-letters-preview` (57ce4ce), `letter-post/cutout/lucy-letter-a..z.webp` (768px, transparent) plus `.png` (1024px). Ignore `cutout/old-v1/`.
- Visual reference: `letter-post.html` on that branch (how the cutout sits in the circle):
  https://raw.githack.com/TeslaWarpDrive/childrens-learning-game/test/lucy-letters-preview/letter-post.html
- Must look right on every Letter Post theme / color mode, at tablet, Chromebook, and 1920x1080 whiteboard sizes.
- Ship the assets in the app's normal Letter Post asset folder (WebP primary; keep sizes sane). If the PWA (`sw.js`) precaches images, precache these too and bump the cache version.
- Do not alter the images themselves (Lucy's look/size and the letters are approved as-is).

## Out of scope — leave unchanged
Moonboat and Ribbon Road; every other Lucy art use (celebrate, home, etc.); sign-in avatars; layouts, chrome (cream), product rules.

## Database
This job needs NO database changes. Shared Supabase is `ixjbgshhzeaosrzavssr`. If you think it needs one, write a change file under `supabase/` and STOP; do not apply it.

## Security rules (verbatim)
- "you must leave the master administrator account completely alone — username Brandy, display name Brandy, password ABCD1234 — and must not modify, rename, delete, or otherwise touch it." No signing in as it, no progress reset on it.
- "I deleted some grownups and some kids as a test. Whatever I deleted, it doesn't need to add back any password changes, any setting change at all. It doesn't need to edit the database back to what it was before. If it does need to edit the database for other reasons, that's fine but don't take away the changes I made"
- Never delete or restore pre-existing accounts. Use only disposable test accounts.

## Delivery
Commit and push your own branch only. No merge to main, no deploy, no PRs to main.
End with a short report in `reports/lucy-letters-<model>.md` (what changed, files, screenshots at the three sizes across themes, sizes of shipped assets) plus a githack preview link for your branch:
`https://raw.githack.com/TeslaWarpDrive/childrens-learning-game/test/lucy-letters-<model>/v1-letter-post/` (adjust to the real entry path).
Bradley picks the winner.
