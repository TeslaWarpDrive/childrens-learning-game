# Lucy points to the answer, and the Ribbon Road lock test is gone

Branch `claude/lucy-hint`, built on `claude/fullsite-redesign` (5e8992f). This pass answers the four questions from the [full-site redesign report](fullsite-redesign.md), following Bradley's answers:

| Question | Bradley's answer | What this pass did |
|---|---|---|
| 1. New art | Not for now | No new art. |
| 2. Gameplay | Lucy pointing: yes. Calmer celebration: no. | Built the Lucy-pointing hint. No calmer celebration. Collection replay wasn't mentioned, so it isn't built (see question 2 below). |
| 3. World names | No new names | No renames. |
| 4. Ribbon Road test | Delete it | Deleted. |

Nothing was deployed or merged, and no live account or live data was touched.

## What changed

### Lucy's pointing hint

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

### Ribbon Road test deleted
- **Removed:** `tests/layout_ribbon_unchanged.cjs`.
- **Doc references:** the reference in `tests/verify-game/features/home.md` is removed. No test runner or other test referenced it.
- **Old reports left as they are:** they are a record of past runs, so their mentions of the test stay. Those are `reports/fade-swap*`, `picture-swap.md`, `layout-build.md`, `landing-redesign.md` and `fullsite-redesign.md`.
- **`approved/` files:** there is no `tests/approved/` folder. The deleted test didn't use the top-level `approved/` files, and the audio checks still need them, so they stay.
- **Candidate for removal:** `reports/layout-build/ribbon-unchanged.json` was that test's only output. It is left in place.

### Files

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

## Screenshots

Each image shows the same moment before and after: letter B, after tapping apple and then cat. Before is `claude/fullsite-redesign`; after is this branch. They were taken with reduced motion, so this is also exactly what calm mode shows.

| World | Whiteboard 1920×1080 | Laptop 1024×576 | Phone 390×844 |
|---|---|---|---|
| Ribbon Road | [view](lucy-hint/ribbon-road-1920x1080.jpg) | [view](lucy-hint/ribbon-road-1024x576.jpg) | [view](lucy-hint/ribbon-road-390x844.jpg) |
| Letter Post | [view](lucy-hint/letter-post-1920x1080.jpg) | [view](lucy-hint/letter-post-1024x576.jpg) | [view](lucy-hint/letter-post-390x844.jpg) |
| Moonboat | [view](lucy-hint/moonboat-1920x1080.jpg) | [view](lucy-hint/moonboat-1024x576.jpg) | [view](lucy-hint/moonboat-390x844.jpg) |

![Ribbon Road, before and after](lucy-hint/ribbon-road-1920x1080.jpg)
![Letter Post, before and after](lucy-hint/letter-post-1024x576.jpg)
![Moonboat, before and after](lucy-hint/moonboat-390x844.jpg)

## Tests

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

## AUDIO NEEDED

Nothing is required: the hint works with the existing sounds. One optional line would help:

| Words (exact) | Proposed file | Where it plays |
|---|---|---|
| "Look where I'm pointing!" | `audio/feedback/lucy-look-where-im-pointing.mp3` | On the second miss only, in place of the usual retry clip: the tapped word, a short pause, then this line. |

It should be in Lucy's game voice (`FgiNpTIapnCbaD6xiqIo`, `eleven_v4`). Until it exists, the slot is `voice: null` in `v1-letter-post/hint.js`, which is silent and keeps today's sounds exactly. When the clip arrives, three things need updating together: that path, `voice-manifest.json` and the approved-audio list.

## Questions for Bradley

1. **ElevenLabs connector, for the Lucy-pointing pictures.** As you said, I need your ElevenLabs connector, and it isn't available in this environment. Could you share it or give me access? I've only used ElevenLabs for voice, so if image generation lives somewhere else in your setup, please tell me where. Until then I've made no new pictures and used no other image tool. Once I have access, I'll generate the options below and send them to Made It, who brings them to you. Nothing gets wired in until you pick one.

   **Rules for every option:** Lucy stays exactly the same dog as in the rest of the game: same age, size, golden coat, face and overall look. Only her pose and the setting change. The reference pictures are `v1-letter-post/assets/lucy-default.jpg` (main likeness), `v1-letter-post/assets/lucy-specs.jpg` (the Lucy on the picture screen), `v1-letter-post/assets/lucy-celebrate.jpg` and `accounts/lucy/wave.jpg` (raised paw). Each option would be a new square file, about 1024×1024, framed so it still reads in a small circle. She'd point down and to the left, because that's where the card is from her spot. The originals stay untouched.

   - **A. Paw point, cosy room.** Lucy sits as in `lucy-default.jpg`, one front paw raised and stretched down-left, head turned to follow her paw, mouth open and happy. Same warm living-room background as `lucy-default.jpg`.
   - **B. Nose point, leaning in.** Lucy leans forward and down to the left, nose leading, ears perked and tail up, as if saying "this one!". Same warm room, softly blurred.
   - **C. With her blue glasses.** Option A's pose wearing the same round blue glasses as `lucy-specs.jpg`, on the same plain dark background. She would match the Lucy already on the picture screen.
   - **D. One pose, three worlds.** Option A's pose (or your favourite of A to C) drawn three times, changing only the setting: a pink ribbon sky at golden hour for Ribbon Road, an airmail sky with clouds for Letter Post, and a starry night with aurora for Moonboat. This needs one small extra change to pick the picture per world.

2. **Replaying a collected letter from the collection.** Your answer didn't mention it, so I haven't built it. Would you like it?

3. **Should grown-ups be able to change the hint?** The game used to have a "Help when stuck" setting (after 1 miss, after 2, or off). It was removed in the earlier tidy-up, which also removed all hints. Its stored value is still in each account, but nothing reads it. The new hint always appears after two misses, as you asked, and ignores that old value. Should grown-ups get a setting to make it sooner or turn it off?

4. **The optional voice line** under AUDIO NEEDED: would you like it, and are those words right?

5. **The on-screen line** "Look where Lucy is pointing!": is that wording right?

6. **Leftover output file.** `reports/layout-build/ribbon-unchanged.json` was the deleted test's output. Should I delete it too?

7. **This report.** You said "No md needed", but the job brief asked for this report, so I wrote it. If you'd rather not keep it, it can be dropped from the branch.

## Preview locally

```sh
git checkout claude/lucy-hint
python3 -m http.server 8000
```

Open http://localhost:8000/, choose **Play without saving**, pick a world and a letter, then tap two wrong pictures.
