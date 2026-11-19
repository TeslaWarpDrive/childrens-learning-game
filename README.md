# Letters with Lucy

Little Sounds Big Discovery.

**Online-only.** Letters with Lucy needs an internet connection. Offline mode has been retired. The current UI/UX pass is documented in [the review report](reports/uiux-pass.md).

The home page opens a child-first sign-in dialog. Sign in, continue a previously signed-in child, or choose **Play without saving**. Then choose **Ribbon Road**, highlighted first by default, **Letter Post**, or **Moonboat**. The small **Are you a grown-up?** link opens the separate grown-up area. Grown-ups manage kids; additional administrator accounts require an existing grown-up to sign in.

The sign-in and picker share a glowing dusk sky: drifting light beams, rising letter lanterns, Lucy in an orbiting halo, and three animated world windows that tilt toward the pointer. The look lives in `home/home.css`; decorative motion lives in `home/effects.js`, which never touches account logic. Reduced motion and the grown-ups' calm setting show the same scene standing still. See the [landing redesign report](reports/landing-redesign.md).

Every world and the grown-up area share that design language. `v1-letter-post/worlds.css` and `worlds.js` give each world its own sky, materials and motion: satin ribbons for Ribbon Road, an airmail sky for Letter Post, and a night voyage for Moonboat. `grown-ups/dusk.css` brings the dusk sky to the portal and game settings. Both load last, so the shared layout, IDs, sounds and pictures are unchanged. See the [full-site redesign report](reports/fullsite-redesign.md).

After two wrong picks on one prompt, Lucy points to the right picture: a glowing ring circles that card, and Lucy (in a picture made for each world and theme) sits just below and to the right of its picture, with her paw and a small arrow both pointing up-left at it. The feedback line then says only "Here’s a hint! Look where Lucy is pointing." and does not name the card that was tapped. The sounds are unchanged. Reduced motion and the calm setting show the same hint standing still. The hint lives in `v1-letter-post/hint.js`; the pictures are in `accounts/lucy/pointing/`. See the [Lucy hint report](reports/lucy-hint.md).

Unsaved play never reads or changes saved preferences and never records rounds or achievements. Its colors and sound choices last only for the current page. A small Sign in to save link stays beside the game controls. Existing grown-up layout visibility choices still apply to signed-in accounts; unsaved play always offers all three layouts.

Serve the repository root with `python3 -m http.server 8000` and visit `/`.
Vanilla HTML, CSS, and JavaScript; no build step. The supported product runs over HTTP or HTTPS.

All three games cover A–Z with their screens, typography, palettes, Lucy
photos, screen animations, themes, replay and letter collections.
Envelope/planet cards scroll vertically within their shelves; stamp
strips/constellations scroll horizontally and count up to 26. A newly earned
letter is brought into view on the celebration screen. Signed-in collections show saved correct answers shared across all three games.
Play without saving keeps collections for the current visit. Progress pages keep round history and milestones.

G uses goat. X uses fox's ending /ks/: the question says “ends with,”
and the celebration says “Fox ends with x.” Distractors exclude matching
sounds (cat/kite) and matching starting words (fish/fox). Word pictures are
code-native SVGs.

## Audio

`audio-map.js` maps the 53 approved letter clips, including the long-I extra
(the insect round uses short I). They must stay byte-identical to
`approved/approved-sha256.txt`. Six picture-word clips live in each game's
assets; the other 20 are in `audio/words/`. Every clip is inventoried in
`voice-manifest.json` with its hash. All clips are Lucy
(`FgiNpTIapnCbaD6xiqIo`) / ElevenLabs `eleven_v4`; clips are reused byte for
byte, never renamed or re-encoded.

## Tests

Read-only, stdlib checks, from the repository root:

```sh
python3 tests/run_tests.py
```

Strict mode should pass **6/6** groups: approved audio, trim metadata,
wiring, voice inventory, A–Z word/audio/SVG coverage, and light and dark
themes for Letter Post and Moonboat. Failures exit nonzero.

Runtime and browser checks:

```sh
node tests/runtime_smoke.cjs
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node tests/browser_smoke.cjs
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node tests/motion_smoke.cjs
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node tests/silk_smoke.cjs
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node tests/confetti_smoke.cjs
node tests/grown_ups_runtime.cjs
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node tests/grown_ups_smoke.cjs
```

- `runtime_smoke.cjs` (no browser) plays 234 rounds (26 letters × 3 themes ×
  3 games) with browser APIs stubbed: listen/replay, wrong answers and
  Lucy's pointing hint from the second miss, celebration, next-letter wraparound, collections and mute.
- `browser_smoke.cjs` uses local Playwright and file URLs to check B/J/X/Z
  at 390×844, 768×1024 and 1440×1000 in all themes, including touch targets
  and horizontal overflow. Screenshots go to `/tmp/lpmb-shots`. Set
  `BROWSER_SMOKE_SHARD` to 0–5 to run one game/viewport pair.
- `lucy_hint.cjs` checks Lucy's pointing hint in all three worlds at 390×844,
  1024×576 and 1920×1080 with normal motion, reduced motion and the calm
  setting: nothing after one miss, Lucy on the right picture after two, still
  under reduced motion and calm, and the same word-plus-retry sound.
- `motion_smoke.cjs` drives both worlds at phone, tablet, and whiteboard
  sizes with real interactions, normal and reduced motion, and no network.
  Screenshots go to `/tmp/lpmb-motion-shots`.
- `silk_smoke.cjs` checks all 26 Ribbon Road rounds, palette persistence,
  60px touch targets, reduced motion and local asset references at widths 390,
  1180 and 1920. Screenshots go to `/tmp/silk-shots`.
- `confetti_smoke.cjs` checks continuous confetti in all three games and
  themes at phone and whiteboard sizes. Screenshots go to
  `/tmp/confetti-shots`.
- `grown_ups_runtime.cjs` (no browser) checks that settings are validated and
  saved, and that every world's real renderer obeys chosen letters, a quiet
  start, voice volume and hidden children's buttons. The hint setting controls when Lucy points to the correct picture.
- `grown_ups_smoke.cjs` checks the grown-ups' corner at phone, tablet,
  Chromebook and whiteboard sizes: the portal door, settings without a keypad, the
  three-miss pause and unlock, every setting, the last-world and last-letter
  guards, reset, relocking, and the settings' effect on the chooser and all
  three worlds. It also covers reduced motion and dark mode. Screenshots go to
  `/tmp/grown-ups-shots`.

Set `PLAYWRIGHT_MODULE` and/or `CHROMIUM_EXECUTABLE` if needed. The
[verification skill](tests/verify-game/SKILL.md) documents repeatable home,
play, and reward journeys. Hosted pages do not install a service worker. The retirement worker at `sw.js` removes earlier game caches and unregisters itself without reloading an active round. File-based checks are isolated rendering tests, not a supported offline product mode.

## Motion

The child UI uses a storybook stage with chunky letter cards, finite staggered
entrances, expressive portrait movements, and sound bars during narration.
Animations use transform and opacity. Lucy breathes gently on play screens.
Hidden tabs pause motion; reduced-motion preferences disable it, including
hover movement. Screen changes fade out before the next scene enters.
Correct picture cards bounce before the reward; wrong cards wiggle with a
fading soft red glow.

Rewards recycle twenty-four SVG paper cut-outs continuously until the route
changes; replay keeps the same pieces falling and reduced motion removes them.
Letter Post scatters envelopes, stamps, hearts, and paper curls; Moonboat
scatters stars, crescents, ringed planets, and curls; Ribbon Road scatters
hearts, curls, and stars. Separate transform layers handle descent, flutter,
and tumble, with no per-frame JavaScript or SVG filters. Colors use the
world palette.

## Ribbon Road

Ribbon Road reuses Letter Post's engine, artwork, motion, fonts, and Lucy
assets through relative paths. Its `config.js` supplies the home view, title,
palette labels, and asset base. Pink is the default, followed by Purple and
Yellow. Each world keeps its own theme choice.

## Game settings

The chooser's **Are you a grown-up?** link opens the portal. Hosted settings require a grown-up login. Select children using the Kids view checkboxes, then choose **Settings for selected kids**. The settings header has a direct **Grown-up portal** link. Local-file settings open directly; there is no PIN or keypad.

Game settings always shows its target. Only the master can change game defaults. Child settings use explicit selections from the portal and sync across devices. They apply the next time a world opens. Local-file settings use this browser's `little-woof-grown-ups` storage:

- **Sound:** Lucy's voice on or off at the start, voice volume (with a sample),
  and sound effects.
- **Letters:** any set of letters, or quick sets (all 26, s a t p i n,
  vowels). Pickers, collections, counts and "Another sound" use only the
  chosen letters. Wrong-answer pictures can still come from any letter.
- **Motion:** *Calm motion* behaves exactly like a reduced-motion preference.
- **Worlds and buttons:** which worlds the chooser shows (at least one), and
  whether children see the sound and color buttons.

Wrong taps play only the tapped word, a 200 ms pause, and one existing Lucy retry clip. A new tap or letter replay interrupts that sequence. Lucy's pointing hint follows the selected Help when stuck setting. The picture screen opens silently; tapping its letter replays only the sound.

`grown-ups/settings.js` is the shared, validated store. `grown-ups/in-game.css`
mirrors the reduced-motion rules for calm motion. The defaults leave every
world exactly as it was. Grown-up pages use the same dusk palette as child sign-in, including on devices that prefer light mode. Design notes are in
[grown-ups/DESIGN.md](grown-ups/DESIGN.md). Opened straight from `file://`,
some browsers (Firefox, for example) may keep separate storage for each page. Serve the
folder (see above) to share settings in every browser.

The historical tidy-up checks include `node tests/tidy_1.cjs` for native audio and menus. Its old offline-upgrade suite is retired. Use `node tests/online_retirement.cjs` to verify the current upgrade path. Run `node scripts/build-tidy-1-preview.cjs` to rebuild the visual comparisons for items 6 and 8. See [the tidy-up report](reports/tidy-1.md) for results and links.

## Rules

- Lucy's images are never redrawn or altered.
- No new audio unless explicitly requested; any new voice is Lucy / `eleven_v4`.


## Accounts and saved progress

Serve the repository on HTTPS, or use `python3 -m http.server 8000` for localhost testing. Start at `/` for child sign-in. The grown-up link opens `/accounts/` through the protected settings area; sign in with an existing grown-up account, then make child logins or link an existing child's account. Everyone signs in with a unique login name and a password of at least six characters. A child uses the same login wherever they play. The portal manages kids, offers profile icons or picture uploads when creating a child, and manages child settings. The progress page shows lasting rounds and milestones, and offers an explicit **Sign out** for shared computers.

Grown-ups manage their own profile, password and game progress through **My account**. The master sees every kid and every grown-up. Kid rows show every linked grown-up, and search matches their names and logins. Other grown-ups see only their linked kids. Open a person to manage their profile, password, settings or progress. Deletion requires a named confirmation and the account count. Select kids for bulk settings, progress reset or deletion; select regular grown-ups for bulk deletion. Only the master can share existing kids, transfer links between grown-ups, or reset another grown-up's game progress. A transfer preserves other grown-up links, the kid's login and progress. Unlinking the last regular grown-up rehomes the kid to the master. The master cannot remove the last link to themselves.

The in-game profile menu includes a **Grown-up portal** link only for grown-ups. It closes on screen changes and outside taps.

The game requires an internet connection. A connection notice appears when the browser loses connectivity. Signed-in letter collections use saved correct answers across all games. Guest collections last for the current visit. Account retry records remain intact so a brief connection interruption does not discard completed work. They are not an offline-play feature.

Only the publishable client key is in `accounts/config.js`. The database and account-provisioning function are recorded in [supabase/](supabase/README.md). [Build report](reports/accounts-build.md) and [design notes](reports/accounts-design.md) explain the choices and limits.

Do not regenerate `sw-assets.js`; it belongs to the retired offline implementation. Keep `sw.js` available to retire existing installations.

Run account checks with:

```sh
node tests/accounts_database.cjs
node tests/accounts_database_edge.cjs
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node tests/accounts_sync.cjs
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node tests/accounts_sync.cjs --live
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node tests/accounts_selection.cjs
```

The SQL checks need the pinned local test tools documented in `supabase/README.md`. The default browser account test uses a labelled protocol fixture. `--live` creates test users only in the configured project `ixjbgshhzeaosrzavssr` and saves their logins to `reports/accounts-test-logins.json`. It proves actual Supabase Auth, sync and row permissions with two isolated browser profiles. All account tests avoid screenshots. Add `NO_SCREENSHOTS=1` when running the older browser checks.


## Verify the home flow

Run `node tests/uiux_pass.cjs` for sign-in, role separation, unsaved play, account management, settings and all three world journeys at six screen sizes. It uses a labelled protocol fixture and saves review screenshots to `/tmp/lwl-uiux-review`. `node tests/home_flow.cjs` covers the focused home flow. Tests that require offline reload or a caching worker are historical and no longer acceptance checks.

The old database world identifier `silk`, existing asset URLs and storage identifiers stay stable so prior logins, pending account writes, progress and themes continue to work. These are compatibility identifiers; the visible layout is Ribbon Road. Historical account-build reports remain an audit record.

## Fix-list verification

Run `MASTER_HANDLE=<live username> python3 tests/run_fixlist.py` for all local, browser, database, Edge, and live account suites. Read the master username from Supabase first; live tests never edit the master. The live tests create disposable accounts, so run the authorized cleanup after the suites. See [fix-list report](reports/fixlist-pass.md) for this pass’s inventory and retained logins.

## Preview this branch

Run `python3 scripts/preview_uiux.py` and visit `http://127.0.0.1:8765/letterswithlucy/`. This server exposes only public game files, blocks directory listings, and marks pages as noindex. It can be placed behind an HTTPS review tunnel. The preview uses the existing Supabase account service.

To package the hosted review site, run `PYTHONDONTWRITEBYTECODE=1 python3 scripts/package-uiux-preview.py /tmp/lwl-preview-source` with an empty destination. It creates `dist/` containing only public assets and copies the preview site's `.openai/hosting.json`. Publish from that separate source directory with the Sites workflow. Do not upload the repository's account-test reports, database files, or Git history to the preview host.
