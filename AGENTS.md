# Letters with Lucy

Letters with Lucy is an **online-only** Pre-K letter-recognition game. Offline mode has been scrapped. Do not describe offline play as a product feature or rebuild an offline asset manifest. Historical reports and old offline tests document retired behavior.

Serve the site over HTTP or HTTPS. `sw.js` is a retirement worker for existing installations. It removes game caches and unregisters itself. Keep that URL available for upgrades. Account storage and retry records still protect saved progress during a connection interruption; do not delete those records as part of cache cleanup.

The six current entry points are `index.html`, `accounts/index.html`, `grown-ups/index.html`, and the three world folders `v1-letter-post`, `v3-moonboat`, and `v4-silk-thread`. Visible names are Letter Post, Moonboat, and Ribbon Road. The internal `silk` identifier stays stable for account data.

Preserve Lucy's artwork and approved audio. Do not generate new voice recordings unless Bradley asks.

Author commits only as `Bradley Street <114449783+TeslaWarpDrive@users.noreply.github.com>`. Do not add AI co-author trailers.

Use the current checks in `tests/verify-game/SKILL.md`. `tests/uiux_pass.cjs` uses isolated account fixtures. Live account tests can create or modify real accounts; do not confuse fixture results with live backend verification.
