'use strict';
/* Lucy's pointing hint in every world: nothing after one miss, Lucy on the right
   picture after two (or as the grown-ups' "Help when stuck" sets it: 1 miss or off), transform/opacity motion only, a still highlight under reduced
   motion and the grown-ups' calm setting, and no change to sounds or the round.
   Lucy's paw and the arrow both point up-left, so she must sit below-right of the
   right picture with that line through its middle, covering no word, sound icon,
   other picture or feedback line; and her picture follows the world's theme. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/usr/local/lib/pnpm/5/.pnpm/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const shots=process.env.HINT_SHOTS||'';
const manifest=fs.readFileSync(path.join(root,'sw-assets.js'),'utf8');
const games=[['v4-silk-thread','ribbon-road'],['v1-letter-post','letter-post'],['v3-moonboat','moonboat']];
const pointing={'ribbon-road':['silk-0-pink-paw','silk-1-purple-paw','silk-2-yellow-paw'],'letter-post':['post-0-airmail-paw','post-1-candy-paw','post-2-dark-paw'],'moonboat':['space-0-dark-paw','space-1-cloud-day-paw','space-2-plum-dusk-paw']};
for(const names of Object.values(pointing))for(const file of names){
  assert(fs.existsSync(path.join(root,'accounts/lucy/pointing',file+'.webp')),`${file}.webp exists`);
  assert(manifest.includes(`"./accounts/lucy/pointing/${file}.webp"`),`${file}.webp is cached for offline play`);
}
// Where Lucy sits against the right picture, and what she covers.
const geometry=()=>{
  const r=n=>n.getBoundingClientRect(), hit=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
  const ink=n=>{const g=document.createRange();g.selectNodeContents(n);return [...g.getClientRects()];};
  const card=document.querySelector('.choice.lucy-hinted'),hint=card.querySelector('.lucy-hint'),arrow=hint.querySelector('.lucy-hint-arrow');
  const P=r(card.querySelector('.word-picture')),H=r(hint),A=r(arrow);
  const dx=(H.left+H.right-P.left-P.right)/2,dy=(H.top+H.bottom-P.top-P.bottom)/2;
  const blocked=[...ink(card.querySelector('.word')),...ink(document.querySelector('.feedback'))];
  document.querySelectorAll('.choice:not(.lucy-hinted)').forEach(o=>{blocked.push(r(o.querySelector('.word-picture')),...ink(o.querySelector('.word')));});
  return {dx,dy,miss:Math.abs(dx-dy)*Math.SQRT1_2/Math.min(P.width,P.height),
    arrowTurn:getComputedStyle(arrow.querySelector('svg')).rotate,arrowSide:[(A.left+A.right)/2<(H.left+H.right)/2,(A.top+A.bottom)/2<(H.top+H.bottom)/2],
    covers:Math.round(blocked.reduce((s,b)=>s+hit(H,b)+hit(A,b),0)),onScreen:A.left>=0&&H.right<=document.documentElement.clientWidth};
};
const checkPlace=async(page,label)=>{
  const g=await page.evaluate(geometry);
  assert(g.dx>0&&g.dy>0,`${label}: Lucy is below-right of the picture (${g.dx},${g.dy})`);
  assert(g.miss<=.31,`${label}: her up-left paw line runs through the picture's middle (${g.miss})`);
  assert.equal(g.arrowTurn,'90deg',`${label}: the arrow points up-left, like her paw`);
  assert.deepEqual(g.arrowSide,[true,true],`${label}: the arrow sits on her paw's side`);
  assert.equal(g.covers,0,`${label}: Lucy covers no word, sound icon, other picture or feedback line`);
  assert(g.onScreen,`${label}: Lucy stays on screen`);
};
const sizes=[[390,844],[1024,576],[1920,1080]];
const modes=['motion','reduced','calm'];
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
      assert.equal(await page.locator('.feedback').innerText(),'Here’s a hint! Look where Lucy is pointing.',`${label}: the hint line alone, naming no card`);
      assert.equal(await page.locator('[data-answer=B]').getAttribute('aria-label'),'ball','The card keeps its name');
      // The world's own pointing Lucy for its first theme, and it loads.
      const image=await page.locator('.lucy-hint img').evaluate(async img=>{await img.decode().catch(()=>{});return {src:img.getAttribute('src'),loaded:img.naturalWidth>0};});
      assert.equal(image.src,`../accounts/lucy/pointing/${pointing[name][0]}.webp`);assert(image.loaded,`${label}: hint picture loads`);
      await checkPlace(page,label);
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
      await checkPlace(page,`${label} after Listen and back`);
      // Changing the theme swaps her backdrop at once, and she stays in place.
      if(mode==='motion'){
        for(const theme of [1,2,0]){
          await page.locator('#theme').selectOption(String(theme));
          assert.equal(await page.locator('.lucy-hint img').getAttribute('src'),`../accounts/lucy/pointing/${pointing[name][theme]}.webp`,`${label}: theme ${theme} picture`);
        }
        await settle();await checkPlace(page,`${label} after theme changes`);
      }
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
    // Grown-ups' "Help when stuck" (hintAfter): 1 points after one miss, 0 never points.
    for(const [game,name] of games) for(const hintAfter of [1,0]) {
      const label=`${name} hintAfter=${hintAfter}`;
      const context=await browser.newContext({viewport:{width:1024,height:576}});
      await context.route(/^https?:/,route=>route.abort());
      await context.addInitScript(hintAfter=>{
        localStorage.setItem('little-woof-grown-ups',JSON.stringify({hintAfter}));
        window.clips=[];
        HTMLMediaElement.prototype.play=function(){window.clips.push(this.src.split('/').pop());setTimeout(()=>this.dispatchEvent(new Event('ended')),20);return Promise.resolve();};
      },hintAfter);
      const page=await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(pathToFileURL(path.join(root,game,'index.html')).href);
      const screen=name=>page.waitForFunction(name=>document.body.dataset.screen===name,name);
      const settle=()=>page.waitForFunction(()=>!document.body.dataset.effect&&!document.body.classList.contains('talking'));
      await screen('home');
      assert.equal(await page.evaluate(()=>LucyHint.line),'Here’s a hint! Look where Lucy is pointing.','The hint line is one string in hint.js');
      await page.locator('[data-letter=B]').first().click();await screen('listen');await settle();
      await page.locator('[data-action=match]').click();await screen('match');await settle();
      const wrong=page.locator('.choice:not([data-answer=B])');
      await wrong.nth(0).click();await settle();
      if(hintAfter===1){
        assert.equal(await page.locator('[data-answer=B].lucy-hinted .lucy-hint').count(),1,`${label}: Lucy points after one miss`);
        assert.equal(await page.locator('.feedback').innerText(),'Here’s a hint! Look where Lucy is pointing.',`${label}: the hint line alone, naming no card`);
      }else{
        await wrong.nth(1).click();await settle();
        assert.equal(await page.locator('.lucy-hint,.lucy-hinted').count(),0,`${label}: off never points`);
        assert.match(await page.locator('.feedback').innerText(),/Try another picture\.$/);
      }
      const clips=await page.evaluate(()=>window.clips);
      assert.match(clips.at(-1),/^lucy-(uh-oh|try-again|oops-try-again)\.mp3$/,`${label}: usual retry clip`);
      assert.deepEqual(errors,[],`${label}: no page errors`);
      await context.close();
      console.log(`PASS ${label}`);
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
