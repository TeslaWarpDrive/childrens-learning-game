# Design: Letters with Lucy

The locked system. Every Hallmark run reads this first and every page shares it. Change it on purpose; the file is the rule.

## System
- Genre: playful
- Shape of the first page: Workbench (a sign-in desk, then a world shelf). The grown-up portal and game settings are app screens.
- Theme: Hum (cut paper made by hand: grained cream paper, torn edges, card-stock controls that press in, blue-black ink, Chillax throughout)
- Axes: light/rounded-sans/chromatic-yellow · posture: full-palette
- Letter Post, Moonboat and Ribbon Road keep their own nine palettes in each world's `style.css`. Lucy's pointing pictures were painted for those palettes, so a world changes material, never its colours.

## Tokens
`shared/tokens.css` is the source of truth, imported by `home/home.css` and `grown-ups/grown-ups.css`. The worlds read the same face and paper grain from `v1-letter-post/worlds.css`. The roles:
```css
:root {
  --color-paper: oklch(97% 0.012 95);  --color-paper-2: oklch(94.5% 0.018 95);  --color-paper-3: oklch(91% 0.022 95);
  --color-ink: oklch(20% 0.014 255);  --color-ink-2: oklch(29% 0.014 255);  --color-muted: oklch(47% 0.014 255);  --color-rule: oklch(87% 0.016 95);
  --color-accent: oklch(87% 0.175 96);  --color-accent-deep: oklch(72% 0.16 92);  --color-accent-ink: oklch(20% 0.014 255);  --color-focus: oklch(50% 0.17 250);
  --color-accent-3: oklch(70% 0.2 22);  --color-mint: oklch(82% 0.15 152);  --color-danger: oklch(50% 0.17 27);
  --font-display: "Chillax", ui-rounded, ui-sans-serif, sans-serif;  --font-body: var(--font-display);
  --radius-card: 24px;  --radius-stock: 16px;  --radius-input: 14px;  --radius-kid: 32px;  --rule-hair: 1px;
}
```
Chillax 500 and 600 are self-hosted in `shared/fonts/` (Fontshare, free for commercial use). Its single-storey *a* and *g* are the letters pre-K children are taught to write. The paper grain, fibre and torn-edge paths are tokens too (`--grain`, `--fibre`, `--tear-*`).

## Controls
- Primary: pear card stock (`--color-accent`), a 4 to 6px solid edge below that pushes in on press, `--radius-stock`. Children's controls are at least 60px tall; grown-up controls 44px.
- Secondary: paper card stock, same radius and height, a `--color-edge` edge.
- Destructive: danger ink on paper, confirmed with the current password; a filled danger button only inside the confirm dialog.
- Selected tabs, presets and pills: ink with paper type.
- Focus: a 3px `--color-focus` ring, instant.

## Layout rules
- Grown-up pages: one top bar (wordmark, page name, back to the games, sign out) over one row of tabs (Kids, Grown-ups, Game settings, My account). Each view opens with its one pear action. Destructive actions sit last, in their own zone.
- No eyebrows, no tracked capitals, no dot-joined meta lines, no emoji as icons, no gradient text, no glass or glow.

## Motion
- Character: brisk. Card stock presses in (120 to 160ms); a spring only on the primary play and sign-in buttons. No loops except Lucy's hint arrow and the game's confetti. Under reduced motion or the grown-ups' Calm motion setting everything stands still.

## Rules that are not design
- Letters with Lucy is online-only. It is never available offline: no service worker caching, no offline copy, no offline wording. `sw.js` only exists to retire the old offline worker on devices that installed it.
- Lucy's images are never redrawn or altered. No new audio unless explicitly requested; any new voice is Lucy / `eleven_v4`.

## Exports
`shared/tokens.css` in this project. Tailwind, DTCG or shadcn blocks are added here on request.
