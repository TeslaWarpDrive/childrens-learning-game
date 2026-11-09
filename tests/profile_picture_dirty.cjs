'use strict';
const assert=require('node:assert/strict');
const {staticServer,backend,playwright}=require('./accounts_sync.cjs');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=','base64');
(async()=>{
 const local=await staticServer(),browser=await playwright().chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  for(const kind of ['child','self','grownup']){
   const fixture=backend(),password='fixture-only',writes=[];
   const admin=fixture.seed('fixture_admin',password,'Fixture administrator');
   const adult=fixture.seed('fixture_adult',password,'Fixture adult');
   const child=fixture.seed('fixture_child',password,'Fixture child',{role:'child',adult_id:admin});
   const target=kind==='child'?child:adult,handle=kind==='child'?'fixture_child':'fixture_adult';
   const action=kind==='child'?'edit-child-profile':kind==='self'?'edit-profile':'edit-grownup-profile';
   const formId=kind==='child'?'child-profile-form':kind==='self'?'profile-form':'grownup-profile-form';
   const prefix=kind==='self'?'profile':kind;
   const context=await browser.newContext({serviceWorkers:'block'});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===local.url)return route.continue();
    if(url.protocol==='https:'&&url.hostname.endsWith('.supabase.co')){
     const data=route.request().postDataJSON();if(data?.action===action)writes.push(data);
     return fixture.route(route);
    }
    return route.abort();
   });
   const page=await context.newPage();
   await page.goto(local.url+'/accounts/');
   await page.evaluate(({handle,password})=>ACCOUNTS.signIn(handle,password),{handle:kind==='self'?'fixture_adult':'fixture_admin',password});
   if(kind==='child')await page.getByRole('button',{name:"Open Fixture child's progress page"}).click();
   else if(kind==='self'){
    await page.locator('#my-account').click();
    await page.locator('#profile-form').evaluate(form=>form.closest('details').open=true);
   }else{
    await page.locator('#adults-view').click();
    await page.getByRole('button',{name:'Edit Fixture adult (fixture_adult)'}).click();
   }
   await page.locator('#'+formId).waitFor();
   let sequence=0;
   async function save(){
    writes.length=0;
    await page.locator(`#${formId} [name=display_name]`).fill('Saved name '+(++sequence));
    await page.locator(`#${formId} [type=submit]`).click();
    await page.waitForFunction(id=>{const f=document.getElementById(id);return !f.hasAttribute('aria-busy')&&f.querySelector('.form-result').textContent.includes('saved');},formId);
    assert.equal(writes.length,1);
    return writes[0];
   }
   const unchanged=payload=>kind==='child'?assert.equal(Object.hasOwn(payload,'avatar'),false):assert.equal(payload.avatar,null);
   unchanged(await save()); // Missing/legacy picture rendered as default Lucy is unchanged.
   const radios=page.locator(`#${formId} [name=avatar]`);
   const original=await radios.first().inputValue();
   await radios.nth(1).evaluate(input=>input.click());await radios.first().evaluate(input=>input.click());
   unchanged(await save()); // Choose then undo.
   await radios.nth(2).evaluate(input=>input.click());
   const lucy=await radios.nth(2).inputValue();assert.equal((await save()).avatar,lucy);
   unchanged(await save()); // A successful save becomes the loaded comparison.
   await page.locator(`#${prefix}-avatar-upload`).setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:png});
   await page.waitForFunction(id=>!document.getElementById(id).hidden,`${prefix}-avatar-preview`);
   const photo=(await save()).avatar;assert.match(photo,/^data:image\/jpeg;base64,/);
   unchanged(await save());
   // A concurrent writer changes the persisted picture while this form still shows its photo.
   await page.evaluate(({action,target,handle,original,kind})=>ACCOUNTS.manage(action,{handle,display_name:'Newer profile',avatar:original,...(kind==='child'?{child_id:target}:kind==='grownup'?{grownup_id:target}:{})}),{action,target,handle,original,kind});
   unchanged(await save());
   const persisted=await page.evaluate(id=>ACCOUNTS.rest('/profiles?id=eq.'+id+'&select=*'),target);
   assert.equal(persisted[0].avatar,original,'Name save keeps the concurrent picture');
   await radios.nth(4).evaluate(input=>input.click());assert.equal((await save()).avatar,await radios.nth(4).inputValue(),'Photo to Lucy change is saved');
   console.log(`PASS ${kind}: name-only, reverted choice, Lucy, upload, repeated save, concurrent avatar preservation`);
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>local.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
