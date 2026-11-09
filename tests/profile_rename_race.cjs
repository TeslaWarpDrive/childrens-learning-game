'use strict';
const assert=require('node:assert/strict');
const {staticServer,backend,playwright}=require('./accounts_sync.cjs');
(async()=>{
 const local=await staticServer(),browser=await playwright().chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const fixture=backend(),password='fixture-only',writes=[];
  fixture.seed('fixture_admin',password,'Fixture admin');const target=fixture.seed('fixture_adult',password,'Fixture adult');
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const u=new URL(route.request().url());if(u.origin===local.url)return route.continue();
   if(u.hostname.endsWith('.supabase.co')){const data=route.request().postDataJSON();if(data?.action==='edit-profile')writes.push(data);return fixture.route(route);}
   return route.abort();
  });
  const page=await context.newPage();await page.goto(local.url+'/accounts/');await page.evaluate(password=>ACCOUNTS.signIn('fixture_adult',password),password);
  await page.locator('#my-account').click();await page.locator('#profile-form').evaluate(f=>f.closest('details').open=true);
  const values=await page.locator('#profile-form [name=avatar]').evaluateAll(inputs=>inputs.map(i=>i.value));
  await page.evaluate(avatar=>ACCOUNTS.manage('edit-profile',{handle:'fixture_adult',display_name:'Concurrent name',avatar}),values[2]);
  await page.locator('#profile-form [name=handle]').fill('fixture_renamed');await page.locator('#profile-form button[type=submit]').click();
  await page.locator('#risky-password').fill(password);await page.locator('#risky-password-form button[type=submit]').click();
  await page.waitForFunction(()=>!document.querySelector('#profile-form').hasAttribute('aria-busy')&&document.querySelector('#profile-form .form-result').textContent.includes('saved'));
  assert.equal(await page.locator('#profile-form [name=avatar]:checked').inputValue(),values[2]);
  await page.evaluate(avatar=>ACCOUNTS.manage('edit-profile',{handle:'fixture_renamed',display_name:'Second concurrent name',avatar}),values[4]);
  writes.length=0;await page.locator('#profile-form [name=display_name]').fill('Name only');await page.locator('#profile-form button[type=submit]').click();
  await page.waitForFunction(()=>!document.querySelector('#profile-form').hasAttribute('aria-busy')&&document.querySelector('#profile-form .form-result').textContent.includes('saved'));
  const persisted=await page.evaluate(id=>ACCOUNTS.rest('/profiles?id=eq.'+id+'&select=*'),target);
  const result={check:'name-only save after username rename and refreshed avatar',sentAvatarDespiteNoPictureEdit:writes[0]?.avatar===values[2],overwroteNewerAvatar:persisted[0].avatar===values[2],preservedNewerAvatar:persisted[0].avatar===values[4]};
  assert(writes[0]?.avatar===null,'Name-only save must omit the displayed picture');assert.equal(result.preservedNewerAvatar,true);console.log(JSON.stringify(result));await context.close();
 }finally{await browser.close();await new Promise(resolve=>local.server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
