'use strict';
/* Lucy's pointing hint in every world: nothing after one miss, Lucy on the right
   picture after two, transform/opacity motion only, a still highlight under reduced
   motion and the grown-ups' calm setting, and no change to sounds or the round. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/usr/local/lib/pnpm/5/.pnpm/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const shots=process.env.HINT_SHOTS||'';
const games=[['v4-silk-thread','ribbon-road'],['v1-letter-post','letter-post'],['v3-moonboat','moonboat']];
const sizes=[[390,844],[1024,576],[1920,1080]];
const modes=['motion','reduced','calm'];
const manifest=fs.readFileSync(path.join(root,'sw-assets.js'),'utf8');
assert(manifest.includes('"./v1-letter-post/hint.js"'),'hint.js is cached for offline play');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    for(const [game,name] of games) for(const [width,height] of sizes) for(const mode of modes) {
      const label=`${name} ${width}x${height} ${mode}`;
      const context=await browser.newContext({viewport:{width,height},reducedMotion:mode==='reduced'?'reduce':'no-preference'});
      await context.route(/^https?:/,route=>route.abort());
      if(mode==='calm')await context.addInitScript(()=>localStorage.setItem('little-woof-grown-ups',JSON.stringify({calm:true})));
      await context.addInitScript(()=>{
        window.clips=[];
        HTMLMediaElement.prototype.play=function(){window.clips.push(this.src.split('/').pop());setTimeout(()=>this.dispatchEvent(new Event('ended')),20);return Promise.resolve();};
      });
      const page=await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(pathToFileURL(path.join(root,game,'index.html')).href);
      const screen=name=>page.waitForFunction(name=>document.body.dataset.screen===name,name);
      const settle=()=>page.waitForFunction(()=>!document.body.dataset.effect&&!document.body.classList.contains('talking'));
      await screen('home');
      if(mode==='calm')assert.equal(await page.evaluate(()=>document.documentElement.hasAttribute('data-calm')),true,`${label}: calm is on`);
      await page.locator('[data-letter=B]').first().click();await screen('listen');await settle();
      await page.locator('[data-action=match]').click();await screen('match');await settle();
      const wrong=page.locator('.choice:not([data-answer=B])');
      assert.equal(await wrong.count(),2);
      await wrong.nth(0).click();await settle();
      assert.equal(await page.locator('.lucy-hint,.lucy-hinted').count(),0,`${label}: no hint after one miss`);
      assert.match(await page.locator('.feedback').innerText(),/Try another picture\.$/);
      await page.evaluate(()=>{window.clips=[];});
      await wrong.nth(1).click();
      await page.locator('[data-answer=B].lucy-hinted .lucy-hint').waitFor();
      assert.equal(await page.locator('.lucy-hint').count(),1,`${label}: one pointing Lucy`);
      assert.match(await page.locator('.feedback').innerText(),/Look where Lucy is pointing!$/);
      assert.equal(await page.locator('[data-answer=B]').getAttribute('aria-label'),'ball','The card keeps its name');
      // The placeholder is an existing Lucy photo and it loads.
      const image=await page.locator('.lucy-hint img').evaluate(async img=>{await img.decode().catch(()=>{});return {src:img.getAttribute('src'),loaded:img.naturalWidth>0};});
      assert.equal(image.src,'../accounts/lucy/wave.jpg');assert(image.loaded,`${label}: hint picture loads`);
      // The ring is visible in every mode; only motion differs.
      assert.notEqual(await page.locator('[data-answer=B]').evaluate(n=>getComputedStyle(n).outlineStyle),'none',`${label}: highlight shown`);
      const motion=await page.evaluate(()=>{
        const allowed=new Set(['offset','computedOffset','easing','composite','transform','opacity','translate','rotate','scale','transformOrigin']);
        const hinted=document.getAnimations().filter(a=>a.effect?.target?.closest?.('.lucy-hint')&&a.playState==='running');
        return {count:hinted.length,violations:hinted.flatMap(a=>a.effect.getKeyframes().flatMap(f=>Object.keys(f).filter(k=>!allowed.has(k))))};
      });
      assert.deepEqual(motion.violations,[],`${label}: only cheap animated properties`);
      if(mode==='motion')assert(motion.count>0,`${label}: Lucy moves to point`);
      else assert.equal(motion.count,0,`${label}: Lucy stands still`);
      // The hint keeps the page within the screen and adds no sound.
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`${label}: no horizontal overflow`);
      await settle();
      const clips=await page.evaluate(()=>window.clips);
      assert.equal(clips.length,2,`${label}: ${clips}`);
      assert.match(clips[1],/^lucy-(uh-oh|try-again|oops-try-again)\.mp3$/,`${label}: usual retry clip`);
      if(shots&&mode==='reduced'){
        await page.mouse.move(0,0);
        await page.screenshot({path:path.join(shots,`${name}-${width}x${height}-after.png`)});
      }
      // Leaving and returning to the pictures keeps the hint for this prompt.
      await page.locator('.stepbar .back').click();await screen('listen');await settle();
      await page.locator('[data-action=match]').click();await screen('match');await settle();
      assert.equal(await page.locator('[data-answer=B].lucy-hinted .lucy-hint').count(),1,`${label}: hint survives Listen and back`);
      await page.locator('[data-answer=B]').click();await screen('celebrate');await settle();
      // A new prompt starts without the hint.
      await page.keyboard.press('Escape');await screen('home');
      await page.locator('[data-letter=C]').first().click();await screen('listen');await settle();
      await page.locator('[data-action=match]').click();await screen('match');await settle();
      assert.equal(await page.locator('.lucy-hint,.lucy-hinted').count(),0,`${label}: fresh prompt has no hint`);
      assert.deepEqual(errors,[],`${label}: no page errors`);
      await context.close();
      console.log(`PASS ${label}`);
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
