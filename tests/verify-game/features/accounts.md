# Accounts and saved progress

Letters with Lucy requires an internet connection. Start at `/` for child sign-in or `/accounts/` for grown-up sign-in. Both forms support showing and hiding the password and show a useful error after invalid credentials. A fresh sign-in page does not automatically open the touch keyboard.

Run `node tests/uiux_pass.cjs` for isolated fixture checks of both sign-in flows, password controls, failed sign-in, kids and grown-ups, progress, profile editing dialogs, cancellation of deletion, and child settings review. It also verifies that child accounts cannot open grown-up settings. Screenshots contain fictional fixture profiles.

Run `node tests/home_flow.cjs` for guest isolation, changing players, sign-in, saved rounds, branding, and the world picker. Run `node tests/online_retirement.cjs` for existing-device cache removal. Earlier tests that expect an offline worker or disconnected page reload are historical.

The grown-up roster reads each child's operations from Supabase on entry, focus, reconnect, and periodically while visible. If the connection fails, the last successful result is labelled as last-known data. Reset advances the server progress version, so pending rounds from before a reset cannot restore erased progress. Retry records remain for brief connection interruptions; this does not provide an offline-play mode.

Only the master can create grown-up accounts or transfer child links. Regular grown-ups manage their linked kids. Child settings require an explicit selection and review. Defaults belong to the master. Destructive actions name the affected accounts and require the grown-up's current password.

The preview uses the configured Supabase project. Fixture checks do not establish live authentication, database permissions, or email delivery. Live tests are separate and can create or modify real accounts.
