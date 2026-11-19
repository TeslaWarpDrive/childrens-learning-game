'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {playwright,backend,settle}=require('./accounts_sync.cjs');
const root=path.resolve(__dirname,'..'),prefix='/letterswithlucy/';
const oldWorker=execFileSync('git',['show','114906d:sw.js'],{cwd:root,encoding:'utf8'});
const oldManifest=execFileSync('git',['show','114906d:sw-assets.js'],{cwd:root,encoding:'utf8'});
let retiring=false;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.woff2':'font/woff2','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(!route.startsWith(prefix))return res.writeHead(404).end();
 const relative=route.slice(prefix.length),file=path.resolve(root,relative||'index.html');
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 if(relative==='sw.js'||relative==='sw-assets.js')return res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'}).end(relative==='sw-assets.js'?oldManifest:retiring?fs.readFileSync(path.join(root,'sw.js')):oldWorker);
 try{const target=fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'}).end(fs.readFileSync(target));}catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+prefix;
 const browser=await playwright().chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({reducedMotion:'reduce'});await context.route('https://*.supabase.co/**',backend().route);
  const page=await context.newPage();await page.goto(url);await page.locator('#play-unsaved').click();
  await page.evaluate(async()=>{await navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'});await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  assert((await page.evaluate(()=>caches.keys())).some(key=>key.startsWith('letters-with-lucy-')),'Old worker really cached the site');
  await page.evaluate(async()=>{
   localStorage.setItem('uiux-preserve','saved preferences');
   await caches.open('unrelated-site-cache');
   await new Promise((resolve,reject)=>{const r=indexedDB.open('uiux-preserve',1);r.onupgradeneeded=()=>r.result.createObjectStore('rounds');r.onsuccess=()=>{const db=r.result,tx=db.transaction('rounds','readwrite');tx.objectStore('rounds').put('pending round','one');tx.oncomplete=()=>{db.close();resolve();};};r.onerror=()=>reject(r.error);});
  });
  await page.goto(url+'v1-letter-post/?mode=guest');await settle(page);await page.locator('#mute').click();await page.locator('[data-letter=B]').click();await settle(page);
  await page.evaluate(()=>{window.retirementMarker='round stays open';});
  retiring=true;
  await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.getRegistration();await registration.update();
    const worker=registration.installing||registration.waiting||registration.active;
    await new Promise((resolve,reject)=>{
      const check=()=>{if(worker.state==='activated')resolve();else if(worker.state==='redundant')reject(new Error('Retirement worker failed'));};
      worker.addEventListener('statechange',check);check();
    });
  });
  await page.waitForFunction(async()=>(await navigator.serviceWorker.getRegistrations()).length===0);
  assert.equal(await page.evaluate(()=>window.retirementMarker),'round stays open','Retirement does not reload a child mid-round');
  assert.equal(await page.evaluate(()=>document.body.dataset.screen),'listen');
  await page.waitForFunction(async()=>(await caches.keys()).every(key=>key==='unrelated-site-cache'));
  assert.deepEqual(await page.evaluate(()=>caches.keys()),['unrelated-site-cache']);
  assert.equal(await page.evaluate(()=>localStorage.getItem('uiux-preserve')),'saved preferences');
  assert.equal(await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('uiux-preserve');r.onsuccess=()=>{const db=r.result,read=db.transaction('rounds').objectStore('rounds').get('one');read.onsuccess=()=>{db.close();resolve(read.result);};};})),'pending round');
  await page.reload();await settle(page);assert.equal(await page.evaluate(()=>navigator.serviceWorker.controller),null);
  assert.equal(await page.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).length),0);
  await context.close();console.log('PASS actual 114906d worker retirement at /letterswithlucy/: game caches removed, unrelated cache and saved data preserved, active round stays open, reload has no worker');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
