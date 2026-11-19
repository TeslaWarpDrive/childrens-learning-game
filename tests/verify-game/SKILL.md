---
name: verify-game
description: Verify the online Letters with Lucy sign-in, accounts, settings, three game worlds, and motion behavior.
---

## Launch

From the repository root, run `python3 tests/run_tests.py`, then `node tests/uiux_pass.cjs`. The browser helper serves the real site locally and uses an isolated Supabase protocol fixture. It does not contact the live database. Use `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE` for an existing Playwright installation and Chromium binary.

Letters with Lucy is online-only. Do not treat offline caching or local-file play as product requirements. Historical reports and offline tests describe the retired implementation.

## Drive

`tests/uiux_pass.cjs` checks 320×568, 390×844, 768×1024, 1024×600, 1366×768, and 1920×1080. It drives both sign-in forms, errors, password visibility, the world picker, all three worlds in all three themes, hints, rewards, next and Escape, kids, grown-ups, profiles, destructive-action cancellation, settings review and saving, and role restrictions. Screenshots and `results.json` go to `/tmp/lwl-uiux-review`, or `UIUX_REPORT_DIR`. Set `NO_SCREENSHOTS=1` to omit screenshots.

Run `node tests/home_flow.cjs` for the focused home and guest-isolation journey. Run `node tests/online_retirement.cjs` to install the actual old worker from commit `114906d` and verify its removal at `/letterswithlucy/`. It checks that an active round stays open, unrelated caches remain, and account storage is preserved.

For detailed motion checks, run `NO_SCREENSHOTS=1 CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node tests/motion_smoke.cjs`. This isolates rendering with file URLs and checks real button interactions, normal motion, reduced motion, and live preference changes. File URLs here are a test mechanism, not an offline feature. `node tests/runtime_smoke.cjs` covers 234 letter/theme rounds with browser APIs stubbed. Neither test establishes live backend correctness.

## Evidence

Read the feature map in [features/README.md](features/README.md). Use the actual buttons and resulting screens. Do not call internal route or reward setters as evidence of a passing journey.

The UI check asserts viewport fit, loaded pictures, password state, error recovery, touch targets, hint behavior, settings saved through the account fixture, and page errors. Inspect the screenshots as well as the exit status. `tests/accounts_sync.cjs --live` changes real accounts and is a separate backend verification task. Do not run it merely to check appearance.

## Cleanup

The browser helpers close their contexts, browser, and HTTP server in `finally`. Keep screenshots and failure reports for review. Stop only servers or tunnels started for this task.
