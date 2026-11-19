# UI/UX pass

This pass covers the child entry, world picker, Letter Post, Moonboat, Ribbon Road, grown-up sign-in, account management, progress, and game settings. It keeps the existing Lucy artwork, audio, and world themes.

The suggested effort was 1–2 developer days for an audit, focused implementation, and browser verification. A new visual direction or a usability study with children would be separate work.

## Changes

| Area | Finding | Result |
| --- | --- | --- |
| Child sign-in | Initial focus opens a tablet keyboard before the child chooses how to play. | Focus starts on the welcome heading. Sign-in fields remain keyboard accessible. |
| Both sign-in pages | Passwords cannot be checked visually; invalid credentials return backend wording. | Show/hide controls, passwords concealed on submission, and a clear retry message. |
| Grown-up sign-in | The form occupies one side of a mostly empty desktop page and repeats its introduction. | A balanced welcome/form layout, existing Lucy portrait, one primary action, and account-help copy. |
| Phone sign-in | The welcome art consumes space needed by the form. | A smaller welcome portrait keeps entry choices closer together. |
| World picker | Guest and saved play must remain distinct. | Existing world order and saving notices retained; verified changing players and guest isolation. |
| Letter Post | The description overlaps the title on narrow screens. | The description flows below the title; small envelope captions stay on one line. |
| All worlds | The return-to-worlds footer link is too small for touch. | A minimum 44px-high target in every world and screen. |
| Account menus | Long display names can exceed available space. | Menus and identity text wrap within the viewport. |
| Portal navigation | Selected tabs use a different treatment from other selected controls. | The active portal tab uses the shared gold action palette. |
| Account actions | Delete and progress-reset actions look like ordinary navigation. | Existing danger styling is applied consistently; confirmation and password requirements remain. |
| Settings | Content touches the edge of its panel; the mobile section index disappears. | Responsive panel padding and visible section links at small sizes. |
| Settings header | Sign-out is fixed over the page instead of participating in layout. | Header actions wrap together without covering settings. |
| Child settings | Review controls precede the options although the instructions say to review below. | Review and discard controls now follow the settings. |
| Settings startup | No visible state while protected settings load. | An opening message appears until the editor is ready. |
| Connectivity | The interface promises offline play and installs an asset cache. | No new worker installs; connection-loss guidance replaces offline claims. Existing caches retire safely. |
| Project guidance | README and verification instructions still require offline mode. | AGENTS.md and current verification guidance state that the product is online-only. |

Ribbon Road keeps its full A–Z trail. Letter Post and Moonboat keep their paginated letter shelves. The learning sequence, Lucy's hint, progress ownership, and approved audio are unchanged.

## Verification

The new `tests/uiux_pass.cjs` drives the site through actual UI controls at 320×568, 390×844, 768×1024, 1024×600, 1366×768, and 1920×1080. It covers all three themes in all three worlds, totaling 54 play journeys. Account data comes from an isolated Supabase protocol fixture; these checks do not create or edit real accounts.

The checks include sign-in errors and recovery, password visibility, connection notices, guest isolation, viewport fit, loaded pictures, hints, rewards, next/Escape, profile and progress screens, bulk selection, destructive-action cancellation, settings review and saving, and child access restrictions.

The retirement check installs the actual worker from `114906d` at `/letterswithlucy/`, then updates it. It verifies cache removal, preserved local storage and IndexedDB records, an uninterrupted active round, and a reload without a controlling worker. It waits for worker activation to finish before asserting cleanup.

The motion check waits for rendered frames after changing the reduced-motion preference instead of assuming media-query events finish within 80ms. The same motion assertions remain in place.

Browser verification uses Chromium. Safari, Firefox, physical tablets, and a classroom whiteboard were not exercised. This is a UI and interaction pass, not a complete accessibility certification or live database audit.

Final checks passed:

| Check | Result |
| --- | --- |
| [UI/UX journeys](uiux-pass/uiux.log) | All 6 viewport sizes; 54 world/theme journeys |
| [Home and account separation](uiux-pass/home.log) | All cases passed |
| [Portal fixtures](uiux-pass/portal.log) | 4 cases passed |
| [Motion and reduced motion](uiux-pass/motion.log) | 12 cases passed |
| [Worker retirement](uiux-pass/retirement.log) | Existing installation upgraded successfully |
| [Strict content and audio checks](uiux-pass/static.log) | 6/6 passed; approved audio hashes unchanged |
| Runtime smoke | 234 rounds passed across the three worlds |

The [viewport results](uiux-pass/results.json) and representative screenshots are retained: grown-up sign-in [before](uiux-pass/grownup-signin-before.png) and [after](uiux-pass/grownup-signin-after.png), [Letter Post on a phone](uiux-pass/letter-post-phone.png), and [phone settings](uiux-pass/settings-phone.png).

## Preview

[Open the private review site](https://letters-with-lucy-uiux-review.teslawarp.chatgpt.site). Deployment succeeded on November 18, 2026 (America/Chicago). Sign into Bradley's ChatGPT/Sites account to open it. The published public-assets source commit is `30cf3c471f6fedec2d4b65b0466fdaee91f163fb`.

The review site is separate from `thestreetfam.com`. It uses the existing Supabase account service, so signing in displays real saved progress and any account changes made there affect those accounts.

Only public game assets are packaged. Test credentials, reports, database files, and repository history are excluded. The preview host is private to Bradley's Sites account. Production code on `thestreetfam.com` is unchanged.
