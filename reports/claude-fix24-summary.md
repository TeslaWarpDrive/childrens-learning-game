# Screen-size fixes (Claude lane): short landscape and big screens

Branch `test/claude-fix-2-4` (made from `claude/home-flow-ribbon`). Most of the work is CSS.
One small JS change lets CSS set the letter-card size cap. Nothing changes in behavior,
sound or content. Tablets and mid-size screens look exactly as before (checked by
screenshot below).

## A. Short landscape screens (1366×768, 1024×768)

| Screen | Before | After |
|---|---|---|
| Layout picker (signed in) | page 1050px tall; scrolls 282px | fits; footer ends at 621px |
| Layout picker (playing without saving) | page 1045px tall | fits |
| Sign-in card with "played here before" pictures | card scrolls inside by 197px; "Let's play" cut off | fits; nothing scrolls |
| Sign-in card, fresh | 726px of 768 | 606px |

- **Picker** (`index.html`): a short-landscape query, `(orientation:landscape) and
  (min-width:960px) and (min-height:540px) and (max-height:820px)`. Smaller scene art
  (about 96×84px instead of 160×140px), the title clamped to 36–54px, Lucy's hello picture
  80–110px, and tighter nav, card and footer spacing. The footer's text and "For grown-ups"
  sit on one row. Every target stays at least 60px.
- **Sign-in card** (`accounts/front-door.css`): with the same query, the card is wider and
  splits into two columns. The hello and the "played here before" pictures are on the left.
  The sign-in name, password, Show, "Stay signed in", "Let's play", "Play without saving"
  and "Are you a grown-up?" are on the right. All keep their full size (60–64px). With no
  pictures, the left column is a centered hello with a bigger Lucy.
- **The way back to saving**: `#guest-signin` is now 64px tall with 20px text.
- The player strip's sync line ("All saved" / offline status) and the guest bar stay in
  view, above the layouts.

## B. Big screens (whiteboards; 1600×950 and up)

Everything is driven by one set of CSS variables in `base.css` (both copies). Each is
clamped by both width and height, so a 1080p laptop still fits:

| Variable | Range | 1920×1080 | 2560×1440 |
|---|---|---|---|
| `--wb-max` (layout width) | 1180–1760px | 1728 | 1760 |
| `--wb-pic` (pictures) | 180–320px | 238 | 317 |
| `--wb-word` (words) | 26–44px | 33 | 44 |
| `--wb-glyph` (big letter, picture page) | 60–110px | 82 | 109 |
| `--wb-head` (headings) | 54–68px | 64 | 68 |
| `--wb-big` (letter on the letter page) | 190–300px | 227 | 300 |
| `--wb-lucy`, `--wb-ui`, `--wb-text` | Lucy, button height, body copy | | |

- **All three layouts**, on the home, the letter page and the find-the-picture page:
  - Header, step bar, back button, buttons, feedback and footer all scale.
  - Content uses up to 1760px. At 1920 that's the full width minus the page padding; at
    2560 it leaves 400px each side.
  - The letter and picture pages fit with no scrolling at 1920×1080 and 2560×1440.
- **Ribbon Road**:
  - Home: the title goes up to 150px, Lucy up to 520px, the beads, Play button, trail and
    letter circles (160px) grow, and the sound-ribbon words go to 20px.
  - Picture page: three pictures 238 / 317px. The feedback line and "Hear the sound
    again" share one row so the page fits.
- **Moonboat**:
  - Home: the title goes up to 104px, the captain up to 320px, letter planets up to 250px
    with bigger letters, and the arrows (80px) and page label grow.
  - Letter page: the round letter is capped at 42% of the screen height.
  - Picture page: the round pills grow, with pictures at 64% of `--wb-pic` (152 / 203px),
    so three pills fit at 1080.
- **Letter Post**:
  - Home: the title goes up to 150px, the post office and Lucy grow, envelopes go up to
    300px, and the arrows and the stamps line grow.
  - Picture page: pictures 238 / 317px, words 33 / 44px.
- **Picture edges**: pictures are code-drawn SVG, so they stay sharp at any size. Each
  layout keeps its own edge treatment, and the test checks it's identical at every size.
  Ribbon Road's round tinted backing is unchanged, with padding scaling at 6.7% so it
  stays even. Moonboat's round pills are unchanged, and Letter Post's plain cards are
  unchanged.
- **JS (one line in each `app.js`)**: the paged home's card size cap was hardcoded at
  220 / 180px. It now reads `--card-max` from CSS and falls back to the same numbers, so
  only big screens change.

## Tests

New: `tests/screen_sizes.mjs`, headless Playwright with the local database stand-in.
- Short landscape at 1366×768 and 1024×768:
  - Sign-in card, fresh and with six children's pictures: no scrolling inside the card or
    the page, every control fully in view, pictures not running off the side.
  - Picker, playing without saving and signed in: no page scroll; the guest bar, "Sign in
    instead" (at least 64px tall, 20px text), the sync line, all three layouts and "For
    grown-ups" in view.
  - Every target at least 60px.
- Tablet (768×1024) and 1920×1080 picker: scene art and title unchanged.
- Big screens (2560×1440, 1920×1080), all three layouts on the home, letter page and
  picture page:
  - Pictures 180–320px. Moonboat's sit in its pills, so its lower limit is 140px.
  - Words 26–44px, the big letter 60–110px, headings 54–72px.
  - Layout 1180–1760px wide, at most 420px empty per side.
  - Letter and picture pages don't scroll; targets at least 60px.
- Moonboat at 1440×900: picture, word and letter sizes exactly as before (94px / 25px / 100px).
- Picture edge treatment identical at 1366, 1920 and 2560, and Ribbon Road's backing
  scales evenly.

Result: **9 checks passed**.

Existing suites (all from the README, local backend, no screenshots):

| Suite | Result |
|---|---|
| `run_tests.py` | 6/6 (strict) |
| `runtime_smoke` | pass |
| `browser_smoke` | 18 cases pass |
| `motion_smoke` | pass |
| `ribbon_smoke` | pass |
| `confetti_smoke` | pass |
| `grown_ups_runtime` | pass |
| `offline_shell` | pass |
| `accounts_db` | pass |
| `grown_ups_smoke` | pass (see below) |
| `accounts_flow` | 13 pass |
| `accounts_two_devices` | 6 pass |
| `home_flow` | 6 pass |
| `fit_check` | 108 cases pass (includes 1920×1080 collection words) |
| `close_button` | 45 cases pass |
| `catchup_flow` | 12 pass |
| `celebrate_timing` | pass |
| `sw_update` | pass |
| `names_check` | pass |

No pre-existing failures turned up. `grown_ups_smoke` failed once during the work: the first
version of the short-landscape picker cut the page's top padding to 14px, which moved the
"Letters with Lucy" name 14px higher than on the grown-ups' corner. The top padding is back
to 28px. That suite and everything that goes through the home page were rerun and pass.

**"Exactly as before" check**: seeded screenshots (fixed `Math.random`) of all three
layouts' home, letter page and picture page were byte-identical before and after at
1440×900, 1366×768, 1280×800, 1180×820, 1024×768 and 768×1024. Two phone home screenshots
differ, but the unchanged branch head also differs from itself between runs there, so that's
noise. The home flow on 768×1024 and 1920×1080 is identical except for the bigger "Sign in
instead" button and the blinking text cursor.

## Judgment calls

- **"Sign in to save"**: this branch has no control with that text. The only sign-in
  control on the kids' picker is the guest bar's **"Sign in instead"** (`#guest-signin`),
  shown while playing without saving. I made that one 64px / 20px and left its wording
  alone, because the job rules out content changes. The bigger size applies at every
  screen size, since the job asks for the control itself to be bigger. That's the one
  deliberate visual change on tablets.
- **"Offline-status line"**: taken to be the player strip's sync line (`#playing-sync`:
  "All saved" / "Offline. Everything is saved"). On this branch it sits above the layouts,
  so the bug was really the whole picker (cards and grown-ups link) running off the bottom.
  It now stays in view.
- **The short-landscape query** also covers 1280×800 Chromebooks and 1180×820 landscape
  tablets (anything 960px+ wide and 540–820px tall). Only the home flow's sign-in card and
  picker use it; the game pages there are byte-identical to before. Phones in landscape
  are excluded by the 960px width floor.
- **Picture edge treatments**: the job describes a Moonboat circular fade and a Ribbon
  Road rounded-square fade. On this branch the CSS has no fades. Ribbon Road has a round
  tinted backing, Moonboat a picture in a round pill, Letter Post a plain card. I kept each
  exactly as it is and only scaled it.
- **Moonboat pictures** on big screens are 64% of `--wb-pic` (152px at 1080, 203px at
  1440) rather than the full 180–320px, because they sit in a single column of pills. At
  full size the page would scroll at 1080. Its words and letter do use the full range.
- **Letter cards on the 2560 home** grow only modestly (Moonboat 145px, Letter Post
  174×131px). The existing paging code puts as many letters as fit on one page; at 2560
  all 26 fit, so they don't get bigger. I didn't change that behavior.
- **1080p laptop with browser chrome (1920×960)** is still in the big-screen range. Every
  page fits except Moonboat's letter page (29px of scroll), Moonboat's picture page (13px)
  and Letter Post's letter page (13px).
- **A pre-existing bug left alone outside the new query**: in the sign-in card, the "played
  here before" pictures sit in one long row that runs off the right edge of the card at
  every size, because the list is centered with auto margins and shrinks to its content.
  It's fixed only inside the short-landscape query, so tablets keep their current look. A
  one-line `.lw-dialog .people{width:100%}` would fix it everywhere.
- **Letter Post's "LUCY" tag** overlaps the bottom of her portrait on the home. That's
  already the case at every size before this change, so I didn't touch it.
- **Celebration (found-it) screens**: not in the job's page list, and not resized beyond
  the shared buttons and type.
- `sw.js` `VERSION` bumped to `little-woof-shell-6`, as the README asks for every build.

## Accounts and data

- All account tests ran against the local PGlite stand-in. Nothing ran against Supabase,
  including the Claude-lane project `eyqxkxnhzzemafnwmzbf`, so no live accounts were made,
  changed, signed into or deleted.
- The master administrator account was not touched.
- No deploy.

## Files changed

- `index.html`: short-landscape picker rules.
- `accounts/front-door.css`: short-landscape sign-in card and player strip; bigger
  "Sign in instead".
- `v1-letter-post/base.css`, `v3-moonboat/base.css` (identical copies): the big-screen
  variables and shared rules.
- `v4-ribbon-road/style.css`, `v3-moonboat/style.css`, `v1-letter-post/style.css`: each
  layout's big-screen rules.
- `v1-letter-post/app.js`, `v3-moonboat/app.js` (identical copies): card size cap from
  `--card-max`.
- `sw.js`: version bump.
- `README.md`: screen-size note and the new test.
- `tests/screen_sizes.mjs`: new layout test.
- `reports/claude-fix24-summary.md`: this report.
