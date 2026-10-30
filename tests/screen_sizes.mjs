/* Screen sizes: short landscape screens and big whiteboards.
 *  - Short landscape (1366×768, 1024×768): the sign-in card (fresh, and with six
 *    "played here before" pictures) and the layout picker (signed in, and playing
 *    without saving) fit with no scrolling; nothing is cut off; "Sign in instead" is
 *    about 64px tall with 20px text; the sync line and the grown-up link show; every
 *    target is at least 60px.
 *  - Big screens (2560×1440, 1920×1080): Ribbon Road, Moonboat and Letter Post scale
 *    up on the home, the letter page and the find-the-picture page: pictures 180–320px,
 *    words 26–44px, the big letter 60–110px, headings about 64px, the layout 1180–1760px
 *    wide; the letter and picture pages fit with no scrolling; pictures stay sharp SVG
 *    with the same edge treatment as on smaller screens.
 *  - Tablets and mid-size screens keep their sizes (1440×900 Moonboat, 768×1024).
 * No screenshots unless SIZES_SHOTS=dir.
 * Run: CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node tests/screen_sizes.mjs */
import assert from 'node:assert/strict';
import {playwright, launchOptions, serveGame, backend, context, loginOpen, signInChild, showLetter, screen, fits} from './accounts/harness.mjs';

const shots = process.env.SIZES_SHOTS;
const be = await backend(), web = await serveGame(), browser = await playwright().chromium.launch(launchOptions());
let passed = 0;
const ok = label => {passed++; console.log(`PASS ${label}`);};
const shoot = (page, name) => shots ? page.screenshot({path: `${shots}/${name}.png`}) : null;
const settle = page => page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity), null, {timeout: 5000}).catch(() => {});
const box = (page, selector) => page.evaluate(s => {
  const n = document.querySelector(s); if (!n || !n.getClientRects().length) return null;
  const b = n.getBoundingClientRect(), cs = getComputedStyle(n);
  return {top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height, font: parseFloat(cs.fontSize), radius: cs.borderRadius, tag: n.tagName.toLowerCase()};
}, selector);
const noScroll = async (page, label) => {
  const s = await page.evaluate(() => ({h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, vh: innerHeight, vw: innerWidth}));
  assert(s.h <= s.vh + 1, `${label}: page scrolls (${s.h} > ${s.vh})`);
  assert(s.w <= s.vw + 1, `${label}: page scrolls sideways (${s.w} > ${s.vw})`);
};
const inView = async (page, selector, label) => {
  const b = await box(page, selector), vh = await page.evaluate(() => innerHeight);
  assert(b, `${label}: ${selector} shows`);
  assert(b.top >= -1 && b.bottom <= vh + 1, `${label}: ${selector} is cut off (${Math.round(b.top)}–${Math.round(b.bottom)} of ${vh})`);
};

try {
  // ---------- A. Short landscape: the sign-in card and the picker fit. ----------
  const room = await be.family({children: ['Mia', 'Leo', 'Ava', 'Noah', 'Zoe', 'Eli']});
  for (const size of [{width: 1366, height: 768}, {width: 1024, height: 768}]) {
    const tag = `${size.width}x${size.height}`;
    const ctx = await context(browser, be, {viewport: size}), page = await ctx.newPage();
    const dialogFits = async label => {
      await settle(page);
      const d = await page.evaluate(() => { const n = document.querySelector('#login'); return {scroll: n.scrollHeight - n.clientHeight, sideways: n.scrollWidth - n.clientWidth}; });
      assert(d.scroll <= 1 && d.sideways <= 1, `${label}: the sign-in card scrolls inside (${JSON.stringify(d)})`);
      for (const s of ['#login-name', '#login-pw', '#login-show', '#login-go', '#play-unsaved', '#grown-link']) await inView(page, s, label);
      const people = await page.evaluate(() => { const p = document.querySelector('#people'); return p.closest('[hidden]') ? 0 : p.scrollWidth - p.clientWidth; });
      assert(people <= 1, `${label}: the pictures run off the side`);
      await noScroll(page, label);
      await fits(page, label);
    };
    await page.goto(web.url + '/index.html'); await loginOpen(page);
    await dialogFits(`sign-in card ${tag}`); await shoot(page, `signin-${tag}`);

    // Play without saving: the picker, with the way back to saving.
    await page.locator('#play-unsaved').click();
    await page.waitForFunction(() => document.body.dataset.home === 'picker'); await settle(page);
    await noScroll(page, `guest picker ${tag}`);
    for (const s of ['#guest-bar', '#guest-signin', 'nav a[data-world="silk"]', 'nav a[data-world="post"]', 'nav a[data-world="space"]', 'footer a.grown']) await inView(page, s, `guest picker ${tag}`);
    const signin = await box(page, '#guest-signin');
    assert(signin.height >= 63.5 && signin.font === 20, `"Sign in instead" is about 64px tall with 20px text: ${JSON.stringify(signin)}`);
    await fits(page, `guest picker ${tag}`); await shoot(page, `guest-${tag}`);
    await page.evaluate(() => sessionStorage.removeItem('lw:guest'));

    // Six children have played here: the card shows their pictures and still fits.
    for (const kid of room.kids) {
      await signInChild(page, web.url, kid.login, kid.password);
      await page.locator('#done').click(); await loginOpen(page);
    }
    assert.equal(await page.locator('#people .person').count(), 6);
    await dialogFits(`sign-in card with six pictures ${tag}`); await shoot(page, `signin-pictures-${tag}`);

    // Signed in: the picker with the player strip and its sync line.
    await signInChild(page, web.url, room.kids[0].login, room.kids[0].password); await settle(page);
    await noScroll(page, `picker ${tag}`);
    for (const s of ['#playing', '#playing-sync', '#done', 'nav a[data-world="silk"]', 'footer a.grown']) await inView(page, s, `picker ${tag}`);
    await fits(page, `picker ${tag}`); await shoot(page, `picker-${tag}`);
    assert.deepEqual(ctx.errors, []);
    await ctx.close();
    ok(`short landscape ${tag}: the sign-in card (fresh and with six pictures) and the picker fit with no scrolling; big sign-in controls`);
  }

  // Portrait tablets and big screens keep the picker as it was.
  for (const size of [{width: 768, height: 1024}, {width: 1920, height: 1080}]) {
    const ctx = await context(browser, be, {viewport: size}), page = await ctx.newPage();
    await page.goto(web.url + '/index.html'); await loginOpen(page);
    await page.locator('#play-unsaved').click(); await page.waitForFunction(() => document.body.dataset.home === 'picker');
    const scene = await box(page, 'nav a[data-world="silk"] .scene'), title = await box(page, 'h1');
    assert.equal(Math.round(scene.height), 160, `${size.width}×${size.height}: scene art unchanged`);
    assert(title.font >= 46, `${size.width}×${size.height}: title unchanged (${title.font})`);
    await ctx.close();
  }
  ok('tablets and big screens keep the picker\'s scene art and title');

  // ---------- B. Big screens: all three layouts scale up. ----------
  const games = [{kind: 'silk', dir: 'v4-ribbon-road', name: 'Ribbon Road'}, {kind: 'space', dir: 'v3-moonboat', name: 'Moonboat'}, {kind: 'post', dir: 'v1-letter-post', name: 'Letter Post'}];
  const within = (v, lo, hi, label) => assert(v >= lo - .5 && v <= hi + .5, `${label}: ${Math.round(v)} not in ${lo}–${hi}`);
  const edges = {};
  for (const size of [{width: 1366, height: 768}, {width: 2560, height: 1440}, {width: 1920, height: 1080}, {width: 1440, height: 900}]) {
    const big = size.width >= 1600, tag = `${size.width}x${size.height}`;
    for (const g of games) {
      if (size.width === 1440 && g.kind !== 'space') continue;
      const label = `${g.name} ${tag}`, target = big ? 60 : 44; // the games' laptop-size controls are 44px+, as before
      const ctx = await browser.newContext({viewport: size, reducedMotion: 'reduce'}), page = await ctx.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${web.url}/${g.dir}/index.html`); await screen(page, 'home');
      await page.waitForLoadState('load'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
      const home = await box(page, '.screen');
      if (big) {
        within(home.width, 1180, 1760, `${label} layout width`);
        const side = (size.width - home.width) / 2;
        assert(side <= 420, `${label}: ${Math.round(side)}px empty at each side`);
        const card = await box(page, '.letter-list button:not([hidden])');
        assert(card.width >= 140, `${label}: letter cards grow (${Math.round(card.width)})`);
        if (g.kind !== 'silk') await noScroll(page, `${label} home`);
      }
      await fits(page, `${label} home`, target); await shoot(page, `${g.kind}-${tag}-home`);

      await showLetter(page, 'B'); await page.locator('.letter-list [data-letter="B"]').click(); await screen(page, 'listen');
      const title = await box(page, '.play-title'), glyph = await box(page, '.listen-letter .glyph');
      if (big) {
        within(title.font, 54, 72, `${label} letter page heading`);
        assert(glyph.font >= 190, `${label}: the letter page's letter grows (${glyph.font})`);
        await noScroll(page, `${label} letter page`);
      }
      await fits(page, `${label} letter page`, target); await shoot(page, `${g.kind}-${tag}-listen`);

      await page.locator('[data-action="match"]').click(); await screen(page, 'match');
      const art = await box(page, '.choice .art'), word = await box(page, '.choice .word'), letter = await box(page, '.match .glyph'), head = await box(page, '.play-title');
      assert.equal(art.tag, 'svg', `${label}: pictures are vector art, sharp at any size`);
      assert(Math.abs(art.width - art.height) <= 2, `${label}: pictures keep their shape`);
      edges[`${g.kind}-${tag}`] = art.radius;
      if (big) {
        // Moonboat's pictures sit in its round pills, so they run a little smaller there.
        within(art.width, g.kind === 'space' ? 140 : 180, 320, `${label} picture`);
        within(word.font, 26, 44, `${label} word`);
        within(letter.font, 60, 110, `${label} big letter`);
        within(head.font, 54, 72, `${label} heading`);
        await noScroll(page, `${label} picture page`);
      }
      if (size.width === 1440) {
        // Mid-size Moonboat is as before.
        assert.equal(Math.round(art.width), 94, `${label}: picture size unchanged`);
        assert.equal(word.font, 25, `${label}: word size unchanged`);
        assert.equal(letter.font, 100, `${label}: letter size unchanged`);
      }
      await fits(page, `${label} picture page`, target); await shoot(page, `${g.kind}-${tag}-match`);
      assert.deepEqual(errors, []);
      await ctx.close();
    }
    ok(big ? `big screen ${tag}: all three layouts scale up on the home, letter page and picture page` : `${tag}: sizes as before`);
  }
  // The pictures' edges look the same on a whiteboard as on a laptop.
  for (const g of games) {
    const small = edges[`${g.kind}-1366x768`];
    for (const tag of ['2560x1440', '1920x1080']) assert.equal(edges[`${g.kind}-${tag}`], small, `${g.name} ${tag}: picture edge treatment unchanged`);
  }
  ok('pictures keep their edge treatment at every size');
  // Ribbon Road's soft round backing grows with the picture.
  {
    const ctx = await browser.newContext({viewport: {width: 2560, height: 1440}, reducedMotion: 'reduce'}), page = await ctx.newPage();
    await page.goto(`${web.url}/v4-ribbon-road/index.html`); await screen(page, 'home');
    await page.locator('.letter-list [data-letter="B"]').click(); await screen(page, 'listen');
    await page.locator('[data-action="match"]').click(); await screen(page, 'match');
    const fade = await page.evaluate(() => { const a = document.querySelector('.choice .art'), cs = getComputedStyle(a); return {pad: parseFloat(cs.paddingTop), width: a.getBoundingClientRect().width, bg: cs.backgroundColor}; });
    assert(fade.pad / fade.width > .05 && fade.bg !== 'rgba(0, 0, 0, 0)', `Ribbon Road backing scales evenly: ${JSON.stringify(fade)}`);
    await ctx.close();
  }
  ok('Ribbon Road\'s picture backing scales evenly');
} finally {
  await browser.close(); await web.close(); await be.close();
}
console.log(`${passed} checks passed`);
