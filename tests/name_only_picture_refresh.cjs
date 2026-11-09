'use strict';
const assert=require('node:assert/strict');
const {staticServer,backend,playwright}=require('./accounts_sync.cjs');
(async()=>{
  const local=await staticServer(),browser=await playwright().chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox']});
  try{
    for(const kind of ['child','self','grownup']){
      const fixture=backend(),password='fixture-only',writes=[];
      const admin=fixture.seed('fixture_admin',password,'Fixture administrator');
      const adult=fixture.seed('fixture_adult',password,'Fixture adult');
      const child=fixture.seed('fixture_child',password,'Fixture child',{role:'child',adult_id:admin});
      const target=kind==='child'?child:adult;
      const handle=kind==='child'?'fixture_child':'fixture_adult';
      const action=kind==='child'?'edit-child-profile':kind==='self'?'edit-profile':'edit-grownup-profile';
      const formId=kind==='child'?'child-profile-form':kind==='self'?'profile-form':'grownup-profile-form';
      const context=await browser.newContext({serviceWorkers:'block'});
      await context.route('**/*',route=>{
        const url=new URL(route.request().url());
        if(url.origin===local.url)return route.continue();
        if(url.protocol==='https:'&&url.hostname.endsWith('.supabase.co')){
          const data=route.request().postDataJSON();
          if(data?.action===action)writes.push(data);
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
      const radios=page.locator(`#${formId} [name=avatar]`);
      const opened=await radios.first().inputValue();
      const newer=kind==='self'?'data:image/jpeg;base64,ROUND3KEPT':await radios.nth(3).inputValue();
      assert.notEqual(newer,opened);
      await page.evaluate(({action,target,handle,newer,kind})=>ACCOUNTS.manage(action,{handle,display_name:'Newer picture',avatar:newer,...(kind==='child'?{child_id:target}:kind==='grownup'?{grownup_id:target}:{})}),{action,target,handle,newer,kind});
      writes.length=0;
      await page.locator(`#${formId} [name=display_name]`).fill('Name only');
      await page.locator(`#${formId} [type=submit]`).click();
      await page.waitForFunction(id=>{const form=document.getElementById(id);return !form.hasAttribute('aria-busy')&&form.querySelector('.form-result').textContent.includes('saved');},formId);
      assert.equal(writes.length,1);
      if(kind==='child')assert.equal(Object.hasOwn(writes[0],'avatar'),false,'Child name-only save omits avatar');
      else assert.equal(writes[0].avatar,null,'Grown-up name-only save sends avatar null');
      if(kind==='self'){
        const preview=page.locator('#profile-avatar-preview');
        assert.equal(await preview.getAttribute('hidden'),null);
        assert.equal(await preview.getAttribute('src'),newer,'Form preview shows the picture the server kept');
      }else{
        assert.equal(await page.locator(`#${formId} [name=avatar]:checked`).inputValue()===newer,true,`${kind} form shows the picture the server kept`);
      }
      writes.length=0;
      await page.locator(`#${formId} [name=display_name]`).fill('Name only again');
      await page.locator(`#${formId} [type=submit]`).click();
      await page.waitForFunction(id=>{const form=document.getElementById(id);return !form.hasAttribute('aria-busy')&&form.querySelector('.form-result').textContent.includes('saved');},formId);
      if(kind==='child')assert.equal(Object.hasOwn(writes[0],'avatar'),false);
      else assert.equal(writes[0].avatar,null,'Refreshed picture is not sent as a new picture');
      const changed=await radios.nth(5).inputValue();
      await radios.nth(5).evaluate(input=>input.click());
      writes.length=0;
      await page.locator(`#${formId} [name=display_name]`).fill('Picture change');
      await page.locator(`#${formId} [type=submit]`).click();
      await page.waitForFunction(id=>{const form=document.getElementById(id);return !form.hasAttribute('aria-busy')&&form.querySelector('.form-result').textContent.includes('saved');},formId);
      assert.equal(writes[0].avatar,changed,'A real picture change is still sent');
      console.log(`PASS ${kind}: name-only refresh keeps the server picture, then a real picture change is sent`);
      await context.close();
    }
  }finally{await browser.close();await new Promise(resolve=>local.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
