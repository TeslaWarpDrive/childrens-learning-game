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
      for(const entry of ['accounts/index.html','grown-ups/index.html','v1-letter-post/index.html']){
        const context=await browser.newContext({viewport:{width:1000,height:900},serviceWorkers:'block'});
        await context.route('https://*.supabase.co/**',fixture.route);
        const page=await context.newPage();
        await page.goto(url+'/letterswithlucy/'+(role==='child'?'index.html':'accounts/index.html'));
        await form(page,role==='child'?'child-signin-form':'signin-form',{handle:role==='child'?'fixture_kid':'fixture_adult',password:'7234ab'});
        await page.goto(url+'/letterswithlucy/'+entry);
        await page.waitForFunction(()=>Boolean(window.ACCOUNTS?.profile));
        const navigation=page.waitForEvent('framenavigated',frame=>frame===page.mainFrame());
        if(entry.startsWith('v1-')){
          await page.locator('#account-strip summary').click();
          await page.getByRole('button',{name:'Sign out'}).click();
        }else await page.locator('#sign-out').click();
        await navigation;
        await page.waitForLoadState('load');
        const expected=role==='grownup'&&!entry.startsWith('v1-')?'accounts/index.html':'index.html';
        await page.waitForURL(url+'/letterswithlucy/'+expected);
        await page.evaluate(()=>ACCOUNTS.ready);
        assert.equal(await page.evaluate(()=>ACCOUNTS.profile),null);
        if(expected==='index.html')await page.waitForFunction(()=>document.querySelector('#login-dialog').matches(':modal'));
        else assert(await page.locator('#signin-form').isVisible());
        if(entry==='accounts/index.html'||(role==='child'&&entry.startsWith('v1-'))){
          await page.screenshot({path:path.resolve(__dirname,`../reports/kid-signout-${role}-${entry.startsWith('v1-')?'game':'portal'}.png`)});
        }
        console.log(`PASS ${role}: ${entry} → /letterswithlucy/${expected}; session cleared`);
        await context.close();
      }
    }
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
