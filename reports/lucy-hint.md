# Lucy points to the answer, grown-ups choose when, and collected letters play again

Branch `claude/lucy-hint`, built on `claude/fullsite-redesign` (5e8992f). There have been two passes so far:

- **Round 2 (this pass)** follows Bradley's answers to the seven questions from round 1.
- **Round 1** added the pointing hint and deleted the Ribbon Road lock test.

Nothing was deployed or merged, and no live account or live data was touched. No sound was added or changed.

## Round 2: Bradley's answers

| Question | Bradley's answer | What this pass did |
|---|---|---|
| 1. Lucy-pointing pictures | "Have Claude choose the best" | Chose concept A, the paw point, and set it up with the approved recipe. **Nothing generated:** the ElevenLabs connector says the recipe's model (Seedream 5 Lite) "is not available in your region" from here. See question 1. The game still uses the placeholder. |
| 2. Collection replay | "Yes, build collection replay" | Built. Tapping a collected letter in the collection says it again. |
| 3. Grown-ups can change the hint | "Yes, grown-ups can change or turn off the hint" | Brought back **Help when stuck**: after 1 miss, after 2 misses (the default) or off. |
| 4. Voice line | "No voice line" | None. The optional line is dropped from AUDIO NEEDED. |
| 5. "Look where Lucy is pointing!" | "Yes but depending on if it's too much we can back it out." | Kept. It is now one string in `v1-letter-post/hint.js`, so backing it out is a one-line change. |
| 6. Leftover test output | "Delete the leftover test output" | Deleted `reports/layout-build/ribbon-unchanged.json`. |
| 7. This report | "Keep the report file" | Kept and updated. |

### Help when stuck (grown-ups' setting)

- **Where it is:** Game settings → **02 Letters**, under the letter grid. It has three choices: **After 1 miss**, **After 2 misses** and **Off**.
- **Default:** after 2 misses, the same as round 1.
- **How it's stored:** it reuses the old stored value, `hintAfter` (0 = off, 1 or 2). Accounts never stopped syncing it, the database already accepts only 0, 1 or 2, and reset already returns it to 2. There is no database or account change.
  - Any value saved before the tidy-up, when this setting last existed, now takes effect again. If a grown-up chose "Don't outline" back then, that child gets no hint until it is changed here.
- **Children:**
  - It works like every other setting. For game defaults it saves at once.
  - For chosen children it goes through "Review changes", where it reads, for example, "Help when stuck → Off".
  - If the selected children have different values, it shows as mixed.
- **In the game:**
  - The hint now reads the setting through `LucyHint.after` in `hint.js`.
  - **After 1 miss:** Lucy points after the first wrong picture.
  - **Off:** every miss says "Try another picture."
  - The sounds are the same in every case: the tapped word, a pause, then one of Lucy's existing retry clips.

### The hint line is one string

`v1-letter-post/hint.js` now has a `line` string set to `'Look where Lucy is pointing!'`. Both game engines read it. Setting it to `null` backs the line out, and the feedback goes back to "That's cat. Try another picture." Lucy still points either way.

### Collection replay

- **What it does:**
  - In every world's collection, each collected letter is now a button.
  - Tapping it plays the same three clips the round uses: the letter's name, its sound, a short pause, then its word. For B that is "B", /b/, "ball".
  - The child stays on the home page.
  - The stamp gives a small wiggle, using transform only. Under calm or reduced motion it stays still.
- **Where it works:**
  - **Letter Post and Moonboat:** in the stamp album and the constellation, after tapping **Open**.
  - **Ribbon Road:** on the sound thread, on the home page and on the reward screen.
- **Unchanged:**
  - Letters not yet collected stay plain and can't be tapped.
  - The collections look the same as before. The only visual difference is a hover lift and a focus ring on collected letters.
  - It works by keyboard too: Tab to the letter, then press Enter. Screen readers hear, for example, "B, completed this visit. Hear B again".
- **Voice off:** if a grown-up turned Lucy's voice off, the tap stays quiet, as every other sound in the game does.
- **Sounds:** it only reuses the existing letter and word clips. No sound was added.

### Lucy-pointing pictures: chosen, set up, not generated

- **Which concept I chose: A (paw point).** At the badge's size (60–88 px, in a circle) a raised paw reaching down-left reads as pointing most clearly.
  - **B (nose point):** at that size it looks like sniffing.
  - **C (blue glasses):** it adds an accessory, and the recipe says no accessories.
  - **D (one picture per world):** it would need extra code and three times the images.
- **How it's set up:** following the recipe exactly, on the recipe's flow `yuQAe0hoTg2oErjfSE3P`, using only the "claude.ai ElevenLabs" connector:
  - I copied the existing approved 1:1 cutout node ("B try 1"), so the new node keeps the same model, 2K, 1:1, the edit base `lucy-locked-garden-b` and all 9 approved references.
  - The copy is labelled **"HINT paw-point A"** (node `wzfTeDWF1pXD9VAw6VOW`).
  - Its prompt is the recipe prompt word for word, with only the pose and setting changed: "Lucy sits facing the viewer and points helpfully with one front paw raised and stretched out toward the lower left corner of the image … plain soft light cream studio backdrop … head and pointing paw centred … so she still reads clearly inside a small circle".
  - Four variations were set up. No other node on the flow was touched.
- **What stopped it:** the cost check returned `This model is not available in your region.` The recipe says changing the model needs your OK, so I stopped there.
  - No images were made and no credits were spent.
  - No other model or connector was tried.
- **What stays the same:** no Lucy file was touched, and the game still uses the placeholder `accounts/lucy/wave.jpg`.
- **Image candidate paths:** none yet. When they exist, they go in a new folder, `reports/lucy-hint/pointing-candidates/`, with a contact sheet. Wiring the chosen one in stays a one-line change to `image` in `hint.js`, after you pick.

### Files (round 2)

| File | Change |
|---|---|
| `v1-letter-post/hint.js` | `after` comes from the grown-ups' setting (0 = off), a new `due(misses)` check, and the `line` string. The voice slot stays empty. |
| `v1-letter-post/app.js`, `v3-moonboat/app.js` | The hint uses `hint.due()` and `hint.line`. Collected letters in the Ribbon Road thread are buttons. New `hear()` for collection replay. Focus is kept when the collection refreshes. |
| `v1-letter-post/layout.js` | Collected letters in the Letter Post and Moonboat album are buttons. Focus is kept on refresh. |
| `v1-letter-post/worlds.css` | Pointer, hover lift and focus ring for collected letters. The hint comment mentions the setting. |
| `grown-ups/index.html`, `editor.js`, `grown-ups.css`, `dusk.css` | The Help when stuck control. Its label and summary for "Review changes", and its pill in the dusk colours. |
| `sw-assets.js` | Rebuilt offline list version (same files). |
| `reports/layout-build/ribbon-unchanged.json` | Deleted. |
| `tests/collection_replay.cjs` | New (see Tests). |
| `tests/lucy_hint.cjs` | Adds Help when stuck at 1 miss and off, in every world, and checks the line string. |
| `tests/grown_ups_smoke.cjs`, `tests/grown_ups_runtime.cjs` | These had locked in "no hint setting". They now expect the control, its default, saving, reset, and its effect in the worlds. |
| `tests/verify-game/features/*.md` | Describe the setting, the line string and collection replay. |
| `reports/lucy-hint.md`, `reports/lucy-hint/help-when-stuck-*.jpg`, `replay-*.jpg` | This report and its screenshots. |

**Locked and unchanged:** every audio clip, `audio-map.js`, `voice-manifest.json` and `approved/`. `git diff cbf53f3 -- audio audio-map.js voice-manifest.json approved '*.mp3'` is empty. Every Lucy and picture image, the world names and the celebration are also unchanged.

### Screenshots (round 2)

| What | Image |
|---|---|
| Help when stuck, whiteboard (Off chosen) | ![Help when stuck at 1920 wide](lucy-hint/help-when-stuck-1920x1080.jpg) |
| Help when stuck, phone | ![Help when stuck at 390 wide](lucy-hint/help-when-stuck-390x844.jpg) |
| Ribbon Road thread with B collected | ![Ribbon Road collection](lucy-hint/replay-ribbon-road-1920x1080.jpg) |
| Letter Post stamp album with B collected | ![Letter Post album](lucy-hint/replay-letter-post-1024x576.jpg) |
| Moonboat constellation with B collected (phone) | ![Moonboat constellation](lucy-hint/replay-moonboat-390x844.jpg) |

### Tests (round 2)

All tests ran in a Linux container using Google Chrome and local fixtures or the mock backend, with external requests blocked. No live account or data was touched. Heavy suites ran one at a time because of the shared 16 GB machine.

- **`python3 tests/run_tests.py`** passed **6/6** strict checks: approved audio hashes, trim metadata, wiring, voice inventory, A–Z and themes.
- **Audio lock:** `git diff cbf53f3 -- audio audio-map.js voice-manifest.json approved '*.mp3'` is empty.
- **New `tests/collection_replay.cjs`** passes all **18** combinations: 3 worlds × 3 sizes (390×844, 1024×576, 1920×1080), each with and without calm. In each one it checks that:
  - nothing is replayable before a letter is collected
  - the collected letter is a button with the right label, and the other 25 stay plain
  - a tap plays exactly `b-name-trim.mp3`, `b-sound-trim.mp3`, `word-ball.mp3`
  - the wiggle uses transform only, and nothing moves under calm
  - the child stays on home, nothing overflows sideways, Enter works from the keyboard, and there are no page errors
- **`tests/lucy_hint.cjs`** passes **33/33**:
  - round 1's 27 combinations
  - plus Help when stuck at **1 miss** (Lucy points after one miss, with the line) and **off** (no hint after two misses, "Try another picture."), in each world
  - plus a check that the line is the one `LucyHint.line` string
  - The usual retry clip still plays in every case.
- **Updated:**
  - `grown_ups_smoke` passes. It checks the control and its 2-miss default, saving 1 and Off, reset back to 2, and Lucy pointing after one miss in the worlds when it's set that way.
  - `grown_ups_runtime` passes. It checks after 1 miss and off in all three engines.
- **Other suites that pass:**
  - `runtime_smoke`, `tidy_1`, `tidy_1b`, `layout_build`, `progress`, `fixlist`, `offline_readiness`, `layout_offline`, `silk_smoke`
  - `browser_smoke` (all 6 shards), `accounts_sync` (which syncs `hintAfter`), `home_flow`, `portal_flow`, `kid_signout`, `guest_link_flag`, `fix24_layout`, `moonboat_theme_color`
  - `progress_sync`, `update_round_guard`, `takeover_round_race`, `profile_picture_dirty`, `profile_rename_race`, `risky_actions_browser`, `portal_review_browser`, `kid_picture_browser`, `name_only_picture_refresh`, `picture_swap`
  - `lucy_letters_offline`, `call_list_offline`, `failed_precache_cache`, `first_takeover_reload`, `cancelled_press`, `correct_word`, `fade_swap`, `call_list_sounds`, `celebrate_delay` (which failed here in round 1), `celebrate_audio_rules`
- **Failed once, then passed when rerun:**
  - `silk_smoke` failed first on a real problem: on a 390-wide phone, a collected Ribbon Road letter, now a button, was 59.2 px wide, under the game's 60 px touch-target rule. Collected letters now keep a 60 px minimum, spilling evenly into the gaps. Measured at 320, 390 and 1024 wide, they don't overlap their neighbours. The suite then passed.
  - `browser_smoke` shard 5 stalled once while the real `word-van.mp3` was playing, on a wrong-answer tap, then passed alone.
  - `celebrate_audio_rules` timed out once while waiting to click, then passed alone, the same as in round 1.
  - `lucy_hint` and `collection_replay` each failed once with a timing timeout ("element is not stable" or a settle wait) on the picture screen with normal motion, after the long batch. Each then passed in full twice in a row.
- **Four suites fail the same way on the untouched round-1 commit `cbf53f3`.** I reran them in a separate worktree on that commit:
  - `motion_smoke`: the live reduced-motion toggle
  - `confetti_smoke`: "visible page resumes rain"
  - `tidy_1_update`: the offline-update takeover
  - `call_list_browser`: a colour check

  These are the same failures as round 1, so they are not from this pass.
- **Not run**, as before:
  - `lucy_letters`: it ran out of memory last time.
  - Suites that use real accounts: `*_live`, `*_hosted`, `portal_master*`, `portal_round2`, `child_settings_browser`, `accounts_selection`, `master_login`.
  - The `*_database` and `*_edge` suites, which need `.job/db-tools`. `child_settings_database` already checks that `hintAfter` accepts only 0, 1 or 2.
- **Report artifacts:** suites rewrite old report screenshots and logs as they run. Those changes were thrown away and are not in this commit.

## AUDIO NEEDED

None. Bradley said no voice line, so the optional "Look where I'm pointing!" clip from round 1 is dropped. The hint and collection replay use only existing clips.

## Questions for Bradley

1. **Lucy-pointing pictures: model not available.** Through the "claude.ai ElevenLabs" connector, Seedream 5 Lite (`bytedance-seedream-5-lite`) returns "This model is not available in your region", so I generated nothing. Which would you like?
   - **(a)** Run the ready node yourself, or have it run from a place where Seedream works. That is node **"HINT paw-point A"** on flow `yuQAe0hoTg2oErjfSE3P`, already set to 4 variations at about 212 credits each. Then send me the results, or let me know and I'll download them and make the contact sheet.
   - **(b)** OK a different model on the same references. The recipe notes that Krea Flux Kontext was judged "not quite Lucy". The connector's own suggestions for editing a character are `gemini-3-pro-image` and `gpt-image-2.5-sunburst`, but neither is proven on Lucy.
   - **(c)** Keep the placeholder for now.
2. **Old "Don't outline" choices.** Bringing back Help when stuck also brings back any value a grown-up saved before the tidy-up. A child whose grown-up chose "Don't outline" back then won't see Lucy point until it's changed. Is that right, or should every child start fresh at "after 2 misses"? Starting fresh would mean a one-time reset of everyone's stored value.
3. **Collection replay plays the letter, not the round.** Tapping a collected letter replays its sounds right there: name, sound, then word. The usual way to play that letter's round again is its card on the letter shelf, which already works. If you meant that tapping it in the collection should start the round again, that is a one-line change.

## Round 1

Round 1 answered the four questions from the [full-site redesign report](fullsite-redesign.md). New art: not for now. Gameplay: Lucy pointing, yes; calmer celebration, no. World names: no change. Ribbon Road test: delete it. Its AUDIO NEEDED and questions are answered in round 2 above.

### What changed

#### Lucy's pointing hint

**How it behaves.** It works the same way in Ribbon Road, Letter Post and Moonboat, which are the only worlds with answer choices.

- **First wrong pick:** nothing new. The child gets the usual wiggle, the tapped word, a short pause and one of Lucy's existing retry clips. The line reads "That's cat. Try another picture."
- **Second wrong pick on the same prompt:** Lucy points to the right picture.
  - Her picture perches on that card's top edge, with a small arrow pointing into the card.
  - The card gets a glowing ring in the world's colour.
  - The line now reads "That's cat. Look where Lucy is pointing!"
  - The sound is the same word, pause and retry clip as any miss. No sound was added or changed.
- **After the hint:** it stays on the card for the rest of that prompt, including if the child goes back to Listen and returns. A new letter starts without it.
- **Kept the same:** the child still taps the picture to answer. Scoring, the misses count saved with the round, progress and the phonics flow are all unchanged.
- **Motion:** with normal motion, Lucy pops in and her arrow nudges gently toward the picture, using transform and opacity only. Under reduced motion or the grown-ups' calm setting, the same Lucy, arrow and ring appear standing still.
- **Placement:** Lucy sits on the card's top edge, so she never covers the picture, the word or its sound icon. That holds for both the tall cards and the row cards on phones and in Moonboat.

**Where the code lives.**
- `v1-letter-post/hint.js` (new, shared by all three worlds) holds the hint's picture path, an empty voice-line slot and the hint itself.
- Both game engines (`v1-letter-post/app.js` for Letter Post and Ribbon Road, `v3-moonboat/app.js` for Moonboat) gained three lines each. They show the hint from the second miss and switch the feedback line.
- The look is a short block in `v1-letter-post/worlds.css`.

**Temporary picture.** It is an existing Lucy photo, not new art: `accounts/lucy/wave.jpg`, her raised-paw wave, already used as a profile picture. When Bradley picks a generated "Lucy pointing" image, it goes in as a new file, and the only change is the `image` path at the top of `v1-letter-post/hint.js`. No original Lucy file was edited, moved or replaced.

#### Ribbon Road test deleted
- **Removed:** `tests/layout_ribbon_unchanged.cjs`.
- **Doc references:** the reference in `tests/verify-game/features/home.md` is removed. No test runner or other test referenced it.
- **Old reports left as they are:** they are a record of past runs, so their mentions of the test stay. Those are `reports/fade-swap*`, `picture-swap.md`, `layout-build.md`, `landing-redesign.md` and `fullsite-redesign.md`.
- **`approved/` files:** there is no `tests/approved/` folder. The deleted test didn't use the top-level `approved/` files, and the audio checks still need them, so they stay.
- **Candidate for removal:** `reports/layout-build/ribbon-unchanged.json` was that test's only output. It is left in place.

#### Files

| File | Change |
|---|---|
| `v1-letter-post/hint.js` | New. The hint, its temporary picture path and an empty voice-line slot. |
| `v1-letter-post/app.js`, `v3-moonboat/app.js` | Show the hint from the second miss and switch the feedback line. |
| `v1-letter-post/index.html`, `v3-moonboat/index.html`, `v4-silk-thread/index.html` | Load `hint.js` just before the game engine. |
| `v1-letter-post/worlds.css` | Hint ring, Lucy badge and arrow. Still under reduced motion and calm. |
| `sw-assets.js` | Rebuilt with `scripts/build-offline-manifest.py`, so `hint.js` works offline. |
| `tests/lucy_hint.cjs` | New test (see Tests). |
| `tests/runtime_smoke.cjs`, `tests/browser_smoke.cjs`, `tests/tidy_1.cjs` | These had locked in the earlier "no hints" decision. They now expect no hint after one miss and Lucy's hint after two, with the same sounds. |
| `tests/layout_ribbon_unchanged.cjs` | Deleted. |
| `tests/verify-game/features/home.md`, `play.md`, `README.md` | Describe the hint and drop the deleted test. |
| `reports/lucy-hint.md`, `reports/lucy-hint/*.jpg` | This report and its screenshots. |

**Locked and unchanged:** every audio clip, `audio-map.js`, `voice-manifest.json` and `approved/`, all byte-identical to 5e8992f. Every Lucy and picture image, the world names, the celebration and the collections are also unchanged.

### Screenshots

Each image shows the same moment before and after: letter B, after tapping apple and then cat. Before is `claude/fullsite-redesign`; after is this branch. They were taken with reduced motion, so this is also exactly what calm mode shows.

| World | Whiteboard 1920×1080 | Laptop 1024×576 | Phone 390×844 |
|---|---|---|---|
| Ribbon Road | [view](lucy-hint/ribbon-road-1920x1080.jpg) | [view](lucy-hint/ribbon-road-1024x576.jpg) | [view](lucy-hint/ribbon-road-390x844.jpg) |
| Letter Post | [view](lucy-hint/letter-post-1920x1080.jpg) | [view](lucy-hint/letter-post-1024x576.jpg) | [view](lucy-hint/letter-post-390x844.jpg) |
| Moonboat | [view](lucy-hint/moonboat-1920x1080.jpg) | [view](lucy-hint/moonboat-1024x576.jpg) | [view](lucy-hint/moonboat-390x844.jpg) |

![Ribbon Road, before and after](lucy-hint/ribbon-road-1920x1080.jpg)
![Letter Post, before and after](lucy-hint/letter-post-1024x576.jpg)
![Moonboat, before and after](lucy-hint/moonboat-390x844.jpg)

### Tests

All tests ran in a Linux container using Google Chrome and the local mock backend. Chrome was started with `*.supabase.co` mapped to "not found" as a safety net, and no live account or data was touched.

- **`python3 tests/run_tests.py`** passed **6/6** strict checks. These cover the approved audio hashes (exact), trim metadata, wiring, the voice inventory, A–Z coverage and themes.
- **Audio lock:** `git diff 5e8992f -- audio audio-map.js voice-manifest.json approved '*.mp3'` is empty.
- **New `tests/lucy_hint.cjs`:** passes all **27** combinations of 3 worlds, 3 sizes (390×844, 1024×576, 1920×1080) and 3 motion modes (normal, reduced, calm). In each one it checks that:
  - one miss shows no hint, and two misses show exactly one Lucy, on the right card
  - the feedback line changes and the card keeps its spoken name
  - the placeholder photo loads and the ring is visible
  - with normal motion, Lucy moves using only transform and opacity, and under reduced motion or calm nothing moves
  - nothing overflows the screen sideways
  - a miss still plays exactly the tapped word plus one of the three existing retry clips
  - the hint stays after going back to Listen and returning, the right answer still celebrates, and the next prompt starts clean
  - `hint.js` is in the offline cache list
- **39 suites pass**, counting the new one:
  - World screens and layout: `browser_smoke` (all 6 shards: B/J/X/Z in every theme and size, now expecting the hint after two misses), `runtime_smoke` (234 rounds, now expecting the hint from the second miss), `silk_smoke`, `fix24_layout`, `layout_build`, `grown_ups_smoke`, `grown_ups_runtime`, `moonboat_theme_color`
  - Home, sign-in and accounts: `home_flow`, `portal_flow`, `accounts_sync`, `kid_signout`, `guest_link_flag`, `fixlist`
  - Offline: `offline_readiness`, `layout_offline`, `lucy_letters_offline`, `call_list_offline`, `failed_precache_cache`, `first_takeover_reload`
  - Rounds, progress and portal: `update_round_guard`, `takeover_round_race`, `progress`, `progress_sync`, `profile_picture_dirty`, `profile_rename_race`, `risky_actions_browser`, `portal_review_browser`, `kid_picture_browser`, `name_only_picture_refresh`, `picture_swap`, `tidy_1` (now expecting the hint from the second of five misses, with the same sounds), `tidy_1b`
  - Sound and celebration: `cancelled_press`, `correct_word`, `fade_swap`, `call_list_sounds`, `celebrate_audio_rules`
  - `celebrate_audio_rules` failed once while other suites were competing for the CPU, then passed when run alone.
- **Five suites fail on this machine, and fail the same way on the untouched `claude/fullsite-redesign`.** Each was run alone on both branches:
  - `motion_smoke`: the reduced-motion toggle on the listen screen at 1920 wide, which comes before any answer choice.
  - `confetti_smoke`: "visible page resumes rain". It fails in a different world on each run, so it is flaky here.
  - `celebrate_delay`: times out waiting for the cheer after a first-try correct answer, which never involves the hint.
  - `tidy_1_update`: the offline-update takeover.
  - `call_list_browser`: a colour check.

  Last time, on the Mac, `motion_smoke`, `confetti_smoke` and `celebrate_delay` passed, and `tidy_1_update` and `call_list_browser` failed there too. So these look tied to this Linux container, not to the hint.
- **`lucy_letters`** gave no result: the machine ran out of memory and killed it (about 11 GB). It also failed on the Mac last time, on its image-byte check. It doesn't touch the answer screen.
- **Not run**, as last time: the suites that use real accounts (`*_live`, `*_hosted`, `portal_master*`, `portal_round2`, `child_settings_browser`, `accounts_selection`, `master_login`), and the `*_database` and `*_edge` suites, which need `.job/db-tools`.
- **Report artifacts:** several suites rewrite old report screenshots and logs as they run. Those changes were thrown away and are not in this commit.

## Preview locally

```sh
git checkout claude/lucy-hint
python3 -m http.server 8000
```

Open http://localhost:8000/, choose **Play without saving**, pick a world and a letter, then tap two wrong pictures. To try Help when stuck, open **Game settings** from the grown-ups' area (02 Letters). To try collection replay, finish a letter, go back home, open the collection and tap that letter.
