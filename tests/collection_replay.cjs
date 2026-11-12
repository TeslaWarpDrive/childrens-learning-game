'use strict';
/* Collection replay in every world: a collected letter in the collection is a button
   that says its name, its sound and its word again with the existing clips; letters
   not yet collected stay plain. It keeps the child on the home page. */
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
        window.clips=[];window.moves=[];
        HTMLMediaElement.prototype.play=function(){window.clips.push(this.src.split('/').slice(-2).join('/'));setTimeout(()=>this.dispatchEvent(new Event('ended')),20);return Promise.resolve();};
        const animate=Element.prototype.animate;
        Element.prototype.animate=function(...args){if(this.matches('[data-hear]'))window.moves.push(args[0].flatMap(frame=>Object.keys(frame)));return animate.apply(this,args);};
      });
      const page=await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(pathToFileURL(path.join(root,game,'index.html')).href);
      const screen=name=>page.waitForFunction(name=>document.body.dataset.screen===name,name);
      const settle=()=>page.waitForFunction(()=>!document.body.dataset.effect&&!document.body.classList.contains('talking'));
      await screen('home');
      assert.equal(await page.locator('[data-hear]').count(),0,`${label}: nothing to replay before a letter is collected`);
      await page.locator('[data-letter=B]').first().click();await screen('listen');await settle();
      await page.locator('[data-action=match]').click();await screen('match');await settle();
      await page.locator('[data-answer=B]').click();await screen('celebrate');await settle();
      await page.keyboard.press('Escape');await screen('home');await settle();
      const album=page.locator('.collection-preview summary');
      if(await album.count())await album.click();
      const slot=page.locator('[data-hear=B]');
      assert.equal(await slot.count(),1,`${label}: the collected letter is replayable`);
      assert.equal(await slot.evaluate(n=>n.tagName),'BUTTON');
      assert.match(await slot.getAttribute('aria-label'),/^B, (completed|collected) this visit\. Hear B again$/);
      assert.equal(await page.locator('.collection-slot:not(button)').count(),25,`${label}: letters not yet collected stay plain`);
      await slot.scrollIntoViewIfNeeded();
      await page.evaluate(()=>{window.clips=[];window.moves=[];});
      await slot.click();
      await page.waitForFunction(()=>window.clips.length>=3);await settle();
      assert.deepEqual(await page.evaluate(()=>window.clips),['letters/b-name-trim.mp3','letters/b-sound-trim.mp3','words/word-ball.mp3'],`${label}: name, sound and word clips`);
      const moves=await page.evaluate(()=>window.moves);
      if(calm)assert.equal(moves.length,0,`${label}: calm keeps the stamp still`);
      else assert.deepEqual([...new Set(moves.flat())].filter(key=>!['offset','easing','composite','transform'].includes(key)),[],`${label}: transform only`);
      assert.equal(await page.evaluate(()=>document.body.dataset.screen),'home',`${label}: stays on the home page`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`${label}: no horizontal overflow`);
      // Keyboard: Enter on the focused stamp replays too.
      await page.evaluate(()=>{window.clips=[];});
      await slot.focus();await page.keyboard.press('Enter');
      await page.waitForFunction(()=>window.clips.length>=3);await settle();
      assert.deepEqual(errors,[],`${label}: no page errors`);
      await context.close();
      console.log(`PASS ${label}`);
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
