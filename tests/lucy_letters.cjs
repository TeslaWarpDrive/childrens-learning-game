'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/usr/local/lib/pnpm/5/.pnpm/node_modules/playwright');
const root=path.resolve(__dirname,'..'), output=path.join(root,'reports/lucy-letters-claude');
const sizes={tablet:[1024,768],'tablet-portrait':[768,1024],'short-landscape':[1024,576],chromebook:[1366,768],whiteboard:[1920,1080],phone:[390,844]};
const themes=[['air-mail','rgb(185, 220, 230)'],['candy-post','rgb(157, 220, 218)'],['dark','rgb(53, 91, 113)']];
const letters=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const shots=process.argv.includes('--shots');
async function open(browser,game,width,height,{theme=0,reduced=true}={}) {
  const context=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'});
  const errors=[];
  await context.route(/^https?:/,route=>route.abort());
  await context.addInitScript(theme=>localStorage.setItem('little-woof-post-theme',String(theme)),theme);
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('requestfailed',request=>errors.push('failed '+request.url()));
  await page.goto(pathToFileURL(path.join(root,game,'index.html')).href);
  const screen=name=>page.waitForFunction(name=>document.body.dataset.screen===name,name);
  await screen('home');await page.locator('#mute').click();
  return {context,page,screen,errors};
}
const portrait=page=>page.locator('.lucy-portrait').first().evaluate(box=>{
  const image=box.querySelector('img'),style=getComputedStyle(image),outer=box.getBoundingClientRect(),inner=image.getBoundingClientRect();
  return {src:image.getAttribute('src'),complete:image.complete,natural:image.naturalWidth,ratio:inner.width/inner.height,fit:style.objectFit,position:style.objectPosition,transform:style.transform,animation:style.animationName,
    background:getComputedStyle(box).backgroundColor,cutout:Boolean(box.closest('.lucy-cutout')),paw:Boolean(box.querySelector('.lucy-paw')),inside:inner.left>=outer.left&&inner.top>=outer.top&&inner.right<=outer.right&&inner.bottom<=outer.bottom,size:Math.round(outer.width),
    overflow:document.documentElement.scrollWidth-innerWidth,top:Math.round(outer.top),bottom:Math.round(outer.bottom)};
});
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox']});
  const results=[];
  if(shots)fs.mkdirSync(output,{recursive:true});
  try {
    for(const [name,[width,height]] of Object.entries(sizes))for(const [index,[theme,background]] of themes.entries()) {
      const {context,page,screen,errors}=await open(browser,'v1-letter-post',width,height,{theme:index});
      const sizesSeen=new Set();
      for(const letter of letters) {
        while(!await page.locator(`[data-letter=${letter}]`).count())await page.locator('[data-action=letters-next]').click();
        await page.locator(`[data-letter=${letter}]`).click();await screen('listen');
        await page.locator('.lucy-portrait img').evaluate(image=>image.decode());
        const seen=await portrait(page);
        assert.equal(seen.src,`assets/lucy-letter-${letter.toLowerCase()}.webp`);
        assert.equal(seen.natural,768,letter);assert.equal(seen.cutout,true);assert.equal(seen.paw,true);
        assert.equal(seen.background,background,`${name} ${theme}`);
        assert.equal(seen.ratio,1);assert.equal(seen.fit,'cover');assert.equal(seen.position,'50% 50%');assert.equal(seen.transform,'none');assert.equal(seen.animation,'none');
        assert.equal(seen.inside,true,`${name} ${theme} ${letter}`);assert(seen.overflow<=0,`${name} ${letter} overflow`);
        sizesSeen.add(seen.size);
        if(shots&&(['tablet','chromebook','whiteboard'].includes(name)&&'ALQ'[index]===letter))await page.screenshot({path:path.join(output,`${name}-${theme}-${letter.toLowerCase()}.png`)});
        if(shots&&name==='whiteboard'){fs.mkdirSync('/tmp/ll/cells',{recursive:true});await page.locator('.lucy-portrait').screenshot({path:`/tmp/ll/cells/${theme}-${letter}.png`});}
        await page.keyboard.press('Escape');await screen('home');
      }
      assert.deepEqual(errors,[]);
      results.push({name,theme,portrait:[...sizesSeen]});
      await context.close();
    }
    {
      const {context,page,screen,errors}=await open(browser,'v1-letter-post',1920,1080,{reduced:false});
      await page.locator('[data-letter=D]').click();await screen('listen');
      assert.equal((await portrait(page)).animation,'letter-breathe');
      await page.locator('[data-action=match]').click();await screen('match');
      const match=await portrait(page);
      assert.equal(match.src,'assets/lucy-specs.jpg');assert.equal(match.cutout,false);assert.equal(match.animation,'play-breathe');
      assert.deepEqual(errors,[]);await context.close();
    }
    {
      const {context,page,screen,errors}=await open(browser,'v1-letter-post',1366,768);
      assert.equal((await portrait(page)).src,'assets/lucy-default.jpg');
      await page.locator('[data-letter=B]').click();await screen('listen');
      await page.locator('[data-action=match]').click();await screen('match');
      await page.locator('[data-answer=B]').click();await screen('celebrate');
      assert.equal((await portrait(page)).src,'assets/lucy-celebrate.jpg');
      assert.deepEqual(errors,[]);await context.close();
    }
    for(const [game,src] of [['v3-moonboat','assets/lucy-specs.jpg'],['v4-silk-thread','../v1-letter-post/assets/lucy-specs.jpg']]) {
      const {context,page,screen,errors}=await open(browser,game,1366,768);
      await page.locator('[data-letter=B]').click();await screen('listen');
      const seen=await portrait(page);
      assert.equal(seen.src,src);assert.equal(seen.cutout,false);assert.equal(seen.position,'50% 37%');
      assert.deepEqual(errors,[]);await context.close();
    }
    {
      const {staticServer}=require('./accounts_sync.cjs');
      const local=await staticServer(),context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
      await context.route('**/*',route=>route.request().url().startsWith(local.url+'/')?route.continue():route.abort());
      const page=await context.newPage();
      await page.goto(local.url+'/');await page.locator('#play-unsaved').click();
      await page.evaluate(()=>navigator.serviceWorker.ready);
      await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
      await context.setOffline(true);
      await page.goto(local.url+'/v1-letter-post/');
      await page.waitForFunction(()=>document.body.dataset.screen==='home');
      const cached=await page.evaluate(async letters=>Promise.all(letters.map(async letter=>{
        const response=await fetch(`assets/lucy-letter-${letter.toLowerCase()}.webp`);
        return response.status===200&&(await response.blob()).size>1000;
      })),letters);
      assert(cached.every(Boolean));
      await page.locator('[data-letter=D]').click();await page.waitForFunction(()=>document.body.dataset.screen==='listen');
      await page.locator('.lucy-portrait img').evaluate(image=>image.decode());
      assert.equal((await portrait(page)).natural,768);
      await context.close();local.server.closeAllConnections();local.server.close();
    }
    const manifest=fs.readFileSync(path.join(root,'sw-assets.js'),'utf8');
    for(const letter of letters)assert(manifest.includes(`./v1-letter-post/assets/lucy-letter-${letter.toLowerCase()}.webp`),letter);
    console.log(JSON.stringify(results));
    console.log('PASS lucy letters');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
