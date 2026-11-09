'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {staticServer,backend,playwright,form}=require('./accounts_sync.cjs');
(async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'kid-signout-'));
  fs.symlinkSync(path.resolve(__dirname,'..'),path.join(root,'letterswithlucy'),'dir');
  const {server,url}=await staticServer(root),fixture=backend();let browser;
  fixture.seed('fixture_adult','7234ab','Fixture grown-up');
  fixture.seed('fixture_kid','7234ab','Fixture kid',{role:'child'});
  try{
    browser=await playwright().chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
    for(const role of ['child','grownup']){
      for(const entry of ['index.html','accounts/index.html','grown-ups/index.html','v1-letter-post/index.html','v3-moonboat/index.html','v4-silk-thread/index.html','expiry']){
        const context=await browser.newContext({viewport:{width:1000,height:900},serviceWorkers:'block'});
        await context.route('**/*',route=>{
          const target=new URL(route.request().url());
          if(target.origin===url)return route.continue();
          if(target.protocol==='https:'&&target.hostname.endsWith('.supabase.co'))return fixture.route(route);
          return route.abort();
        });
        const page=await context.newPage();
        await page.goto(url+'/letterswithlucy/'+(role==='child'?'index.html':'accounts/index.html'));
        await form(page,role==='child'?'child-signin-form':'signin-form',{handle:role==='child'?'fixture_kid':'fixture_adult',password:'7234ab'});
        await page.goto(url+'/letterswithlucy/'+(entry==='expiry'?'accounts/index.html':entry));
        await page.waitForFunction(()=>Boolean(window.ACCOUNTS?.profile));
        const game=/^v[134]-/.test(entry);
        const navigation=entry==='index.html'?null:page.waitForEvent('framenavigated',frame=>frame===page.mainFrame());
        if(entry==='index.html'){
          await page.locator('#continue-player').click();
          await page.locator('#change-player').click();
        }else if(entry==='expiry')await page.evaluate(()=>void ACCOUNTS.expireSession());
        else if(game){
          await page.locator('#account-strip summary').click();
          await page.getByRole('button',{name:'Sign out'}).click();
        }else await page.locator('#sign-out').click();
        if(navigation){await navigation;await page.waitForLoadState('load');}
        const expected=role==='grownup'&&!game&&entry!=='index.html'?'accounts/index.html':'index.html';
        await page.waitForURL(url+'/letterswithlucy/'+expected+(entry==='expiry'?'?expired=1':''));
        await page.waitForFunction(()=>window.ACCOUNTS&&ACCOUNTS.profile===null);
        await page.evaluate(()=>ACCOUNTS.ready);
        assert.equal(await page.evaluate(()=>ACCOUNTS.profile),null);
        if(expected==='index.html')await page.waitForFunction(()=>document.querySelector('#login-dialog').matches(':modal'));
        else assert(await page.locator('#signin-form').isVisible());
        console.log(`PASS ${role}: ${entry} → /letterswithlucy/${expected}; session cleared`);
        await context.close();
      }
    }
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
