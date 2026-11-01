'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/usr/local/lib/pnpm/5/.pnpm/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'reports/lucy-letters-codex');fs.mkdirSync(out,{recursive:true});
const baseline=execFileSync('git',['show','56c396e78eddfbb3eed013a03e1cedfbc86038a3:v1-letter-post/app.js'],{cwd:root,encoding:'utf8'});
for(const letter of 'abcdefghijklmnopqrstuvwxyz'){
 const name=`lucy-letter-${letter}.webp`;
 assert.deepEqual(fs.readFileSync(path.join(root,'v1-letter-post/assets',name)),execFileSync('git',['show',`57ce4ce:letter-post/cutout/${name}`],{cwd:root}));
 assert.ok(fs.readFileSync(path.join(root,'sw-assets.js'),'utf8').includes(`./v1-letter-post/assets/${name}`));
}
for(const game of ['v3-moonboat','v4-silk-thread'])assert.equal(execFileSync('git',['diff','56c396e78eddfbb3eed013a03e1cedfbc86038a3','--',game],{cwd:root,encoding:'utf8'}),'');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const results=[];
 try{
  for(const [name,width,height] of [['tablet',768,1024],['chromebook',1366,768],['whiteboard',1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   await context.route(/^https?:/,route=>route.abort());
   await context.addInitScript(()=>{Math.random=()=>.37});
   const page=await context.newPage();
   await page.goto(pathToFileURL(path.join(root,'v1-letter-post/index.html')).href);
   await page.locator('#mute').click();
   for(let theme=0;theme<3;theme++){
    await page.selectOption('#theme',String(theme));
    while(await page.locator('[data-action=letters-previous]').isEnabled())await page.locator('[data-action=letters-previous]').click();
    for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
     if(!await page.locator(`[data-letter=${letter}]`).count())await page.locator('[data-action=letters-next]').click();
     await page.locator(`[data-letter=${letter}]`).click();
     const img=page.locator('.guide-lucy .lucy-letter img');
     await img.evaluate(image=>image.decode());
     assert.equal(await img.getAttribute('src'),`assets/lucy-letter-${letter.toLowerCase()}.webp`);
     assert.equal(await img.evaluate(i=>i.naturalWidth),768);
     assert.equal(await img.evaluate(i=>getComputedStyle(i).transform),'none');
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
     if(letter==='B')await page.screenshot({path:path.join(out,`${name}-theme-${theme}.png`),fullPage:true});
     await page.locator('[data-action=match]').click();
     await page.waitForFunction(()=>document.body.dataset.screen==='match');
     assert.equal(await page.locator('.match-lucy img').getAttribute('src'),'assets/lucy-specs.jpg');
     await page.keyboard.press('Escape');
     await page.waitForFunction(()=>document.body.dataset.screen==='home');
    }
    console.log(`${name} theme ${theme} passed`);
    results.push(`${name}, theme ${theme}: all 26 letter images loaded; match portrait unchanged; no horizontal overflow`);
   }
   await context.close();
  }
  // Compare the shared app's rendered DOM and computed styles against the starting revision.
  for(const game of ['v1-letter-post','v4-silk-thread','v3-moonboat']){
   const signatures=[];
   for(const old of [true,false]){
    const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});
    await context.route(/^https?:/,route=>route.abort());
    if(old)await context.route('**/v1-letter-post/app.js',route=>route.fulfill({body:baseline,contentType:'application/javascript'}));
    await context.addInitScript(()=>{Math.random=()=>.37});
    const page=await context.newPage();
    await page.goto(pathToFileURL(path.join(root,game,'index.html')).href);
    await page.locator('#mute').click();
    const shots={};
    async function capture(screen){
     await page.waitForFunction(()=>!document.body.dataset.effect&&!document.body.classList.contains('talking'));
     await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
     shots[screen]=await page.locator('.app').evaluate(app=>({html:app.outerHTML,styles:[...app.querySelectorAll('*')].map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height,s.color,s.backgroundColor,s.transform,s.objectFit]})}));
    }
    await capture('home');await page.locator('[data-letter=B]').click();
    if(game!=='v1-letter-post')await capture('listen');
    await page.locator('[data-action=match]').click();await capture('match');
    await page.locator('[data-answer=B]').click();await page.waitForFunction(()=>document.body.dataset.screen==='celebrate');await capture('celebrate');
    signatures.push(shots);await context.close();
   }
   assert.deepEqual(signatures[1],signatures[0],`${game} unchanged screens`);
   results.push(`${game}: baseline/current DOM, geometry and computed styles identical for ${Object.keys(signatures[0]).join(', ')}`);
  }
  fs.writeFileSync(path.join(out,'checks.txt'),results.join('\n')+'\n');console.log(results.join('\n'));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
