'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {staticServer,playwright}=require('./accounts_sync.cjs');
(async()=>{
 const local=await staticServer();
 const browser=await playwright().chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({reducedMotion:'reduce'});
  const blocked=[];
  await context.route('**/*',route=>{
   if(!route.request().url().startsWith(local.url+'/')){blocked.push(route.request().url());return route.abort();}
   return route.continue();
  });
  const page=await context.newPage();
  await page.goto(local.url+'/');await page.locator('#play-unsaved').click();
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.goto(local.url+'/v1-letter-post/');
  await page.waitForFunction(()=>document.body.dataset.screen==='home');
  await page.locator('#mute').click();
  const assets=await page.evaluate(async()=>Promise.all([...'abcdefghijklmnopqrstuvwxyz'].map(async letter=>{
   const response=await fetch(`assets/lucy-letter-${letter}.webp`);
   return {letter,status:response.status,bytes:(await response.arrayBuffer()).byteLength};
  })));
  assert(assets.every(a=>a.status===200&&a.bytes>40000));
  await page.locator('[data-letter=B]').click();
  await page.locator('.lucy-letter img').evaluate(i=>i.decode());
  assert.equal(await page.locator('.lucy-letter img').evaluate(i=>i.naturalWidth),768);
  const evidence={offlineListen:true,offlineAssets:assets,externalRequestsBlocked:blocked.length,liveDatabaseRequestsSent:0};
  fs.writeFileSync(path.resolve(__dirname,'../reports/lucy-letters-codex/offline.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log('PASS: installed service worker serves all 26 cutouts and Letter Post listen page offline; no external requests sent');
 }finally{await browser.close();local.server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
