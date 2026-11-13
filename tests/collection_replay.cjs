'use strict';
/* Collection replay in every world: a collected letter in the collection is a button
   that starts that letter's round again, just like its card on the letter shelf;
   letters not yet collected stay plain. Replaying a done letter keeps the count. */
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/usr/local/lib/pnpm/5/.pnpm/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const games=[['v4-silk-thread','ribbon-road'],['v1-letter-post','letter-post'],['v3-moonboat','moonboat']];
const sizes=[[390,844],[1024,576],[1920,1080]];
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    for(const [game,name] of games) for(const [width,height] of sizes) for(const calm of [false,true]) {
      const label=`${name} ${width}x${height}${calm?' calm':''}`;
      const context=await browser.newContext({viewport:{width,height}});
      await context.route(/^https?:/,route=>route.abort());
      if(calm)await context.addInitScript(()=>localStorage.setItem('little-woof-grown-ups',JSON.stringify({calm:true})));
      await context.addInitScript(()=>{
        window.clips=[];
        HTMLMediaElement.prototype.play=function(){window.clips.push(this.src.split('/').slice(-2).join('/'));setTimeout(()=>this.dispatchEvent(new Event('ended')),20);return Promise.resolve();};
      });
      const page=await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(pathToFileURL(path.join(root,game,'index.html')).href);
      const screen=name=>page.waitForFunction(name=>document.body.dataset.screen===name,name);
      const settle=()=>page.waitForFunction(()=>!document.body.dataset.effect&&!document.body.classList.contains('talking'));
      const openAlbum=async()=>{const album=page.locator('.collection-preview');if(await album.count()&&!await album.evaluate(n=>n.open))await album.locator('summary').click();};
      // The round B starts again: its listen screen and opening clips, then a full round to the reward.
      const replaysB=async how=>{
        await screen('listen');await settle();
        assert.match(await page.locator('.listen-letter').getAttribute('aria-label'),/letter B\b/,`${label}: ${how} opens B's listen screen`);
        assert.deepEqual(await page.evaluate(()=>window.clips),['letters/b-name-trim.mp3','letters/b-sound-trim.mp3'],`${label}: ${how} plays B's name and sound, as any round starts`);
        await page.locator('[data-action=match]').click();await screen('match');await settle();
        assert.equal(await page.locator('[data-answer]').count(),3,`${label}: ${how} gives three pictures`);
        await page.locator('[data-answer=B]').click();await screen('celebrate');await settle();
        assert.match(await page.locator('.collection-heading').first().innerText(),/1 of 26/,`${label}: ${how} keeps B counted once`);
      };
      await screen('home');
      assert.equal(await page.locator('[data-again]').count(),0,`${label}: nothing to replay before a letter is collected`);
      await page.locator('[data-letter=B]').first().click();await screen('listen');await settle();
      await page.locator('[data-action=match]').click();await screen('match');await settle();
      await page.locator('[data-answer=B]').click();await screen('celebrate');await settle();
      await page.keyboard.press('Escape');await screen('home');await settle();
      await openAlbum();
      const slot=page.locator('[data-again=B]');
      assert.equal(await slot.count(),1,`${label}: the collected letter is replayable`);
      assert.equal(await slot.evaluate(n=>n.tagName),'BUTTON');
      assert.match(await slot.getAttribute('aria-label'),/^B, (completed|collected) this visit\. Play B again$/);
      assert.equal(await page.locator('.collection-slot:not(button)').count(),25,`${label}: letters not yet collected stay plain`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`${label}: no horizontal overflow`);
      await slot.scrollIntoViewIfNeeded();
      await page.evaluate(()=>{window.clips=[];});
      await slot.click();
      await replaysB('a tap');
      // Keyboard: Enter on the focused letter starts the round too.
      await page.keyboard.press('Escape');await screen('home');await settle();
      await openAlbum();
      await page.evaluate(()=>{window.clips=[];});
      await slot.focus();await page.keyboard.press('Enter');
      await replaysB('Enter');
      assert.deepEqual(errors,[],`${label}: no page errors`);
      await context.close();
      console.log(`PASS ${label}`);
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
