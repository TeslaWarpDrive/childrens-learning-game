'use strict';
const assert=require('node:assert/strict');
const {staticServer,playwright}=require('./accounts_sync.cjs');
(async()=>{
 const local=await staticServer(),browser=await playwright().chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  for(const layout of ['v1-letter-post','v3-moonboat','v4-silk-thread']){
   const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'no-preference'});
   await context.route('**/*',route=>new URL(route.request().url()).origin===local.url?route.continue():route.abort());
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(local.url+'/'+layout+'/?mode=guest');
   async function start(){
    await page.waitForFunction(()=>document.body.dataset.screen==='home');
    await page.locator('[data-letter="A"]').click();
    await page.waitForFunction(()=>document.body.dataset.screen==='listen'&&!document.body.dataset.effect);
   }
   await start();
   await page.evaluate(()=>{
    window.pressResult=null;window.replays=0;
    const press=Fun.press,replay=Fun.replay;
    Fun.press=async button=>{const result=await press(button);window.pressResult=result;return result;};
    Fun.replay=(...args)=>{window.replays++;return replay(...args);};
    document.querySelector('[data-action=match]').click();
    const theme=document.getElementById('theme');theme.value='1';theme.dispatchEvent(new Event('change'));
   });
   await page.waitForFunction(()=>window.pressResult===false);
   assert.equal(await page.evaluate(()=>document.body.dataset.screen),'listen','Cancelled press must not open Match');
   await page.locator('[data-action=replay]').click();assert.equal(await page.evaluate(()=>window.replays),1,'Replay works after cancelled press');
   await page.locator('[data-action=match]').click();await page.waitForFunction(()=>document.body.dataset.screen==='match');
   assert.equal(await page.evaluate(()=>window.pressResult),true,'Successful press opens Match');
   await page.keyboard.press('Escape');
   for(const exit of ['home','escape']){
    await start();
    await page.evaluate(exit=>{
     window.originalPress=Fun.press;window.originalExit=Fun.exit;
     Fun.press=()=>new Promise(resolve=>window.releasePress=resolve);
     Fun.exit=()=>new Promise(resolve=>window.releaseExit=resolve);
     document.querySelector('[data-action=match]').click();
     if(exit==='home')document.querySelector('[data-action=home]').click();
     else document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
     window.releasePress(false);
    },exit);
    // Keep the new route's exit pending: the old press must not unlock its controls.
    const before=await page.evaluate(()=>window.replays);
    await page.evaluate(()=>document.querySelector('[data-action=replay]').click());
    assert.equal(await page.evaluate(()=>window.replays),before,'An old cancellation cannot clear a new route’s busy state');
    await page.evaluate(()=>{Fun.press=window.originalPress;Fun.exit=window.originalExit;window.releaseExit(true);});
    await page.waitForFunction(()=>document.body.dataset.screen==='home');
   }
   await start();await page.locator('[data-action=match]').click();await page.waitForFunction(()=>document.body.dataset.screen==='match');
   assert.deepEqual(errors,[]);
   console.log(`PASS ${layout}: real theme-cancelled press releases busy, replay and Match work, Home/Escape keep new route locked until ready`);
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>local.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
