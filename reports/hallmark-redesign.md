# Hallmark redesign: Letters with Lucy

Branch `claude/hallmark-redesign`, from `75ecea0`. A full redesign of the sign-in, the world picker, the grown-up portal and game settings, plus a restyle of all three worlds, run with the Hallmark skill (theme: Hum). The locked system is in [DESIGN.md](../DESIGN.md).

## Pain points found (walking it as a child, then as a grown-up)

**A child meeting the sign-in for the first time**
- The first screen was a username and password form. A 3 or 4 year old cannot read it, and the way in without an account ("Play without saving") was the second, quieter button under an "OR".
- The brand name appeared three times on one screen (header pill, eyebrow, heading area). A floating halo and a drifting sky competed with Lucy.
- "Games ready for offline play" sat at the bottom, a promise the game no longer makes.

**A grown-up meeting the portal for the first time**
- Three rows of navigation stacked on top of each other: a header (back to games, sign out), a "Ms Brandy · My account" pill, then Kids / Grown-ups / Game settings pills. "Game settings" looked like a tab but left the page.
- Adding a child, a new teacher's first job, was a closed "Make a child's login" panel at the bottom of the list.
- Every kid row was four lines tall and repeated "Last activity synced at …" on each row.
- Opening a child led with "Delete child…", "Transfer child…" and "Share child…". Delete appeared twice.
- Per-child game settings were buried inside "Manage this child", between "Save child profile" and the password panel.
- A green "Opened Ava's progress page." banner stayed on screen after leaving that page.
- Game settings: choosing "Choose children" sent you back to the portal. A parent who is not the master landed on a page where every control was disabled. "Help when stuck" was filed under Letters.

**In the worlds**
- Tracked-capital labels a pre-reader cannot read and a grown-up does not need: "INCOMING TRANSMISSION", "SPECIAL DELIVERY", "LOOK THROUGH THE TELESCOPE", "CAPTAIN LUCY · READY TO GO", and "follow me" under every one of Ribbon Road's 26 letters.
- Gradient text on every heading, glass panels, glows and an aurora.
- The game's letters were set in Nunito Sans, whose double-storey *a* and *g* are not the letters children are taught to write.

## What changed

- **Sign-in:** Lucy on a torn paper sheet with three card-stock letter tiles (Aa, Bb, Cc) beside the sign-in card. "Play without saving" is a full-width door with a play triangle a pre-reader can find. "Continue as …" leads when a child has signed in before. The grown-ups door sits top right ("Grown-ups" on phones). The classroom alphabet strip runs along the bottom.
- **World picker:** a real capture of each world on a paper card, a "Start here" sticker on Ribbon Road, and the save state and player button at the top.
- **Portal:** one top bar (wordmark, page name, back to the games, sign out) over one tab row (Kids, Grown-ups, Game settings, My account) shared with the settings page. Kids opens with "Add a child" (pear) and "Link an existing child". Rows are one line of name, login and rounds, plus "Open". A child's record leads with "Game settings for this child", then figures and milestones, then profile, password, linked grown-ups, and a separate "Start over" zone for reset and delete. Status lines clear when you change view.
- **Game settings:** the same shell, "Help when stuck" as its own section, and an inline picker of your kids, so a parent never lands on a dead page.
- **Worlds:** each world keeps its nine palettes, because Lucy's pointing pictures were painted for them. They now share Chillax, solid ink heads, card-stock buttons that press in, and grained paper with torn ground bands. Letter Post keeps its airmail stripes. Eyebrows and tracked caps are gone. Every game size pinned by the whiteboard tests is unchanged.
- **Offline (Bradley's rule):** Letters with Lucy is online-only. The service worker registration, the cached asset manifest, the build script, the "ready for offline" line and every offline promise in copy and the README are removed. `sw.js` stays only as a kill-switch: on a device that still has the old offline worker, it deletes the old caches and unregisters itself. Rounds finished during a dropped connection still wait in IndexedDB and are sent on reconnect, which is not offline play. The tests that checked offline caching or played with the connection switched off are removed or trimmed to their online pass.
- **Page icon:** every page now links `shared/icon.svg` (an "Aa" card-stock tile). Without the old worker, browsers asked for a missing `/favicon.ico` and logged a 404.

## Open items

- The engine's older stylesheets (`style.css`, `fun.css`, `base.css`, `layout.css`) still hold about 190 hard-coded colours (Hallmark gate 48). The skin overrides them visually; lifting them into token blocks is a mechanical follow-up.
- `tests/call_list_browser.cjs` fails on the original code too: after choosing a Lucy picture on My account, `ACCOUNTS.profile.avatar` comes back `undefined` in the test fixture. Not caused by the redesign.
- Tests that need the live Supabase project or a database (`*_live`, `*_database`, `portal_round2`, `child_settings_browser`, `accounts_selection`) were not run.
- `reports/` and `previews/` keep their historical mentions of the old offline behaviour as an audit record.
