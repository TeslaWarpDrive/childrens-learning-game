# Child game feature map

- [Home and letter shelf](home.md): all three worlds, themes, collection and collection replay, A–Z keyboard navigation.
- [Listen and picture matching](play.md): letter sounds, replay, wrong answers and Lucy's pointing hint, correct answers.
- [Accounts and sync](accounts.md): account settings, sign-in, online saved progress, history and milestones.
- [Reward and another sound](reward.md): visible reward, collection progress, replay, next, cancellation.

Run `tests/motion_smoke.cjs` for motion and accessibility and `tests/browser_smoke.cjs` for the full B/J/X/Z, theme, keyboard, and hint matrix. Invoke with `node` from the repository root.

Run `tests/silk_smoke.cjs` for Ribbon Road and chooser screenshots in `/tmp/silk-shots/`. Run `tests/confetti_smoke.cjs` for continuous rain, bounded piece reuse, palette changes, and cleanup in all three worlds.

The online full-site check is `node tests/uiux_pass.cjs`. The cache retirement check is `node tests/online_retirement.cjs`. Offline play is retired.
