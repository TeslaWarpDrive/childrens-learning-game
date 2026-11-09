'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {playwright}=require('./accounts_sync.cjs');
const root=path.resolve(__dirname,'..');
let revision='';
const server=http.createServer((request,response)=>{
  let file=new URL(request.url,'http://localhost').pathname;
  if(file.endsWith('/'))file+='index.html';
  const target=path.resolve(root,'.'+file);
  if(!target.startsWith(root+path.sep)){response.writeHead(403).end();return;}
  try{
    let bytes=fs.readFileSync(target);
    if(file==='/sw-assets.js'&&revision)bytes=Buffer.from(bytes.toString().replace(/"version": "([^"]+)"/,'"version": "$1'+revision+'"'));
    const types={'.js':'application/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'};
    response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
  }catch{response.writeHead(404).end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let browser;
  try{
    browser=await playwright().chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox']});
    for(const layout of ['v1-letter-post','v3-moonboat','v4-silk-thread']){
      revision='';
      const context=await browser.newContext({reducedMotion:'reduce'});
      await context.route('**/*',route=>{
        const url=new URL(route.request().url());
        if(url.origin===origin)return route.continue();
        if(url.pathname==='/rest/v1/game_settings')return route.fulfill({json:[{settings:{}}]});
        return route.abort();
      });
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(origin);
      await page.locator('#play-unsaved').click();
      await page.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('#offline-status').textContent==='Games ready for offline play.');
      await page.goto(origin+'/'+layout+'/');
      await page.locator('#mute').click();
      await page.locator('[data-letter=B]').click();
      await page.locator('[data-action=match]').click();
      await page.waitForFunction(()=>document.body.dataset.screen==='match');
      await page.evaluate(()=>{
        window.roundMarker=true;window.updateReceived=false;
        navigator.serviceWorker.addEventListener('message',event=>{if(event.data?.type==='letters-offline-update')window.updateReceived=true;});
      });
      const newWorker=context.waitForEvent('serviceworker');
      revision='-race';
      await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update();});
      const worker=await newWorker;
      await page.waitForFunction(()=>window.updateReceived);
      // Delay one browser client lookup to expose the gap between the safe report
      // and the worker's reload request. Gameplay continues during that gap.
      await worker.evaluate(()=>{
        const get=clients.get.bind(clients);
        clients.get=async id=>{
          clients.get=get;
          self.lookupWaiting=true;
          await new Promise(resolve=>self.releaseLookup=resolve);
          return get(id);
        };
      });
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>document.body.dataset.screen==='home');
      await worker.evaluate(async()=>{
        for(let i=0;i<500&&!self.lookupWaiting;i++)await new Promise(resolve=>setTimeout(resolve,10));
        if(!self.lookupWaiting)throw Error('The deferred update did not reach the client lookup');
      });
      await page.locator('[data-letter=C]').click();
      await page.waitForFunction(()=>document.body.dataset.screen==='listen');
      await worker.evaluate(()=>self.releaseLookup());
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(()=>window.roundMarker),true,'A delayed update must preserve the newly started round');
      assert.equal(await page.evaluate(()=>document.body.dataset.screen),'listen');
      const reloaded=page.waitForEvent('framenavigated',frame=>frame===page.mainFrame());
      await page.keyboard.press('Escape');
      await reloaded;
      await page.waitForFunction(()=>document.body.dataset.screen==='home'&&!window.roundMarker);
      assert.deepEqual(errors,[]);
      console.log(`PASS ${layout}: delayed update preserves the next round and reloads after that round ends`);
      await context.close();
    }
  }finally{
    await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
