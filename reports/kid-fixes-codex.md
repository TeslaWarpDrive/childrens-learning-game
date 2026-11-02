# Fix 1 — kid sign-out

Changed `accounts/portal.js` and `accounts/navigation.js`: capture the signed-in role before signing out, then send kids to site-root `index.html` using the script-relative site base. Grown-ups retain the portal sign-in destination. Existing game-menu and expiry redirects already resolve home safely. Rebuilt `sw-assets.js`.

Validation: `node tests/kid_signout.cjs` passed six local browser cases (kid/grown-up × portal/settings entry/game menu), checking session clearing and destination UI under `/letterswithlucy/`. Kids entering settings are first redirected to their progress portal by the existing access guard. `python3 tests/run_tests.py` passed 6/6; `node tests/grown_ups_runtime.cjs` passed. No full suites or live-site runs.

All account requests used an in-memory fixture. No live sign-ins, Supabase writes, or changes to pre-existing accounts; the protected master account was left completely alone. Fix 2 is untouched.

Screenshots:

- [Kid after progress sign-out](kid-signout-child-portal.png)
- [Kid after game-menu sign-out](kid-signout-child-game.png)
- [Grown-up after portal sign-out](kid-signout-grownup-portal.png)

Preview: https://raw.githack.com/TeslaWarpDrive/childrens-learning-game/test/kid-fixes-codex/index.html
