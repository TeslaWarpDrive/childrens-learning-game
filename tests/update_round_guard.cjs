'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {staticServer,backend,playwright}=require('./accounts_sync.cjs');
async function workerCheck(){
 for(const old of [false,true]){
  const listeners={},messages=[],navigations=[];let activation;
  const paths=['v1-letter-post/','v3-moonboat/index.html','v4-silk-thread/?theme=1','accounts/','index.html'];
  vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{
   URL,importScripts:()=>{},caches:{keys:async()=>old?['letters-with-lucy-old']:[],delete:async()=>true},
   self:{OFFLINE_MANIFEST:{version:'fixture',files:[]},location:new URL('http://localhost/sw.js'),registration:{scope:'http://localhost/'},addEventListener:(name,fn)=>listeners[name]=fn,
    clients:{claim:async()=>{},matchAll:async()=>paths.map(path=>({url:'http://localhost/'+path,postMessage:message=>messages.push({path,type:message.type}),navigate:()=>navigations.push(path)}))}}
  });
  listeners.activate({waitUntil:promise=>activation=promise});await activation;
  assert.equal(navigations.length,0,'Worker cannot force a game navigation');
  assert.deepEqual(messages,old?paths.slice(0,3).map(path=>({path,type:'letters-offline-update'})):[]);
 }
}
(async()=>{
 await workerCheck();
 const local=await staticServer(),browser=await playwright().chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  for(const layout of ['v1-letter-post','v3-moonboat','v4-silk-thread'])for(const guest of [false,true]){
   const fixture=backend();fixture.seed('fixture_admin','fixture-only');fixture.seed('fixture_child','fixture-only','Fixture child',{role:'child'});
   const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===local.url)return route.continue();
    if(url.protocol==='https:'&&url.hostname.endsWith('.supabase.co'))return fixture.route(route);
    return route.abort();
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(local.url+'/');
   if(guest)await page.locator('#play-unsaved').click();
   else await page.evaluate(()=>ACCOUNTS.signIn('fixture_child','fixture-only'));
   await page.goto(local.url+'/'+layout+'/');await page.waitForFunction(()=>document.body.dataset.screen==='home');
   const update=()=>page.evaluate(()=>navigator.serviceWorker.dispatchEvent(new MessageEvent('message',{data:{type:'letters-offline-update'}})));
   async function stays(label){
    await page.evaluate(()=>window.updateMarker=true);await update();await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>window.updateMarker),true,label);
   }
   async function reloads(){
    const navigation=page.waitForEvent('framenavigated',frame=>frame===page.mainFrame());
    await update();await navigation;await page.waitForLoadState();await page.waitForFunction(()=>document.body.dataset.screen==='home');
   }
   await reloads(); // No round yet.
   if(guest){
    await page.locator('#mute').click();
    await page.locator('[data-letter=A]').click();
    await page.waitForFunction(()=>document.body.dataset.screen==='listen');
    await stays('Guest Listen defers reload');
    await page.locator('[data-action=match]').click();
    await page.waitForFunction(()=>document.body.dataset.screen==='match');
    await stays('Guest Match defers reload');
    await page.locator('.choice:not([data-answer=A])').first().click();
    await stays('Guest wrong answer defers reload');
    await page.locator('[data-answer=A]').click();
    await page.waitForFunction(()=>document.body.dataset.screen==='celebrate');
    await page.locator('[data-action=next]').click();
    await page.waitForFunction(()=>document.body.dataset.screen==='listen');
    await stays('Guest next round defers reload');
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.body.dataset.screen==='home');
    await reloads();
    await page.locator('[data-letter=B]').click();
    await page.waitForFunction(()=>document.body.dataset.screen==='listen');
    await page.locator('[data-action=match]').click();
    await page.waitForFunction(()=>document.body.dataset.screen==='match');
    await page.locator('[data-answer=B]').click();
    await page.waitForFunction(()=>document.body.dataset.screen==='celebrate');
    await reloads();
    assert.deepEqual(errors,[]);
    console.log(`PASS ${layout}: guest Listen/Match/wrong/next deferral, safe Home and completed-round reload`);
    await context.close();continue;
   }
   const holdSaves=()=>page.evaluate(()=>{
    window.saves=[];
    const record=ACCOUNTS.recordRound;
    ACCOUNTS.recordRound=(...args)=>new Promise((resolve,reject)=>saves.push({finish:()=>record(...args).then(resolve,reject),fail:()=>reject(Error('Fixture storage failure'))}));
   });
   await holdSaves();
   async function start(letter){
    await page.locator(`[data-letter="${letter}"]`).click();
    await page.waitForFunction(()=>document.body.dataset.screen==='listen');
   }
   async function answer(letter,index){
    await page.locator('[data-action=match]').click();await page.waitForFunction(()=>document.body.dataset.screen==='match');
    await page.locator(`[data-answer="${letter}"]`).click();await page.waitForFunction(n=>saves.length===n,index+1);
   }
   await start('A');await stays('Listen round defers reload');
   await answer('A',0);await stays('Pending save defers reload');
   await page.keyboard.press('Escape');await page.waitForFunction(()=>document.body.dataset.screen==='home');
   await stays('Home still defers an outstanding save');
   await start('B');await page.evaluate(()=>saves[0].finish());await stays('Old save completion does not clear a newer round');
   await answer('B',1);await page.evaluate(()=>saves[1].fail());
   await page.waitForFunction(()=>document.getElementById('announcer').textContent.includes('Could not save'));
   await stays('Failed save keeps the round protected for retry');
   await page.locator('[data-answer="B"]').click();await page.waitForFunction(()=>saves.length===3);
   await page.evaluate(()=>saves[2].finish());await page.waitForFunction(()=>document.body.dataset.screen==='celebrate');
   await reloads();
   await holdSaves();
   await start('C');await answer('C',0);
   await page.keyboard.press('Escape');await page.waitForFunction(()=>document.body.dataset.screen==='home');
   await start('D');await answer('D',1);await page.evaluate(()=>saves[1].finish());
   await page.waitForFunction(()=>document.body.dataset.screen==='celebrate');
   await stays('An older save still outstanding blocks reload after the newest round saves');
   await page.evaluate(()=>saves[0].finish());await reloads();
   assert.deepEqual(errors,[]);
   console.log(`PASS ${layout}: safe reload, Listen/Match/save/Home deferral, overlapping rounds, failed-save retry, later reload after save`);
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>local.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
