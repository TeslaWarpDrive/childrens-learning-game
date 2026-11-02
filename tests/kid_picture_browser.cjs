'use strict';
// Mock transport only: the set_own_avatar migration is not needed to run this.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {staticServer,backend,playwright}=require('./accounts_sync.cjs');
(async()=>{
 const shots='reports/kid-fixes-claude';fs.mkdirSync(shots,{recursive:true});
 const local=await staticServer(),browser=await playwright().chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const fixture=backend(),password='7234ab';
  const adult=fixture.seed('picture_adult',password,'Picture Grown-up');
  fixture.seed('picture_kid',password,'Picture Kid',{role:'child',adult_id:adult});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let migrationApplied=false;
  await context.route('https://*.supabase.co/**',route=>!migrationApplied&&route.request().url().endsWith('/set_own_avatar')?route.fulfill({status:404,contentType:'application/json',body:'{"code":"PGRST202","message":"Could not find the function public.set_own_avatar(p_avatar)"}'}):fixture.route(route));
  const saved=()=>page.evaluate(()=>ACCOUNTS.profile.avatar);
  const result=page.locator('#my-picture-form .form-result');
  await page.goto(local.url+'/accounts/');
  await page.evaluate(([handle,password])=>ACCOUNTS.ready.then(()=>ACCOUNTS.signIn(handle,password)),['picture_kid',password]);
  await page.locator('#my-picture').waitFor();
  assert.equal(await page.locator('#my-picture input[name=avatar]').count(),6);
  await page.screenshot({path:`${shots}/kid-picture-card.png`,fullPage:true});

  const before=await saved(),lucy=page.locator('#my-picture input[name=avatar]').nth(3),lucyValue=await lucy.inputValue();
  await lucy.check({force:true});await page.locator('#my-picture-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#my-picture-form .form-result').classList.contains('error'));
  assert.equal(await result.innerText(),'Your picture did not save. Please try again.','Unapplied migration stays kid-friendly');
  assert.equal(await saved(),before,'A failed save changes nothing');

  migrationApplied=true;
  await page.locator('#my-picture-form button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#my-picture-form .form-result').textContent==='Your picture is saved!');
  assert.equal(await saved(),lucyValue);
  await page.reload();await page.locator('#my-picture').waitFor();await page.evaluate(()=>ACCOUNTS.ready);
  assert.equal(await lucy.isChecked(),true,'Lucy choice sticks after reload');
  assert.equal(await page.locator('#my-picture-preview').getAttribute('src'),lucyValue);

  const photo=await page.screenshot();
  await page.locator('#my-picture-upload').setInputFiles({name:'kid.png',mimeType:'image/png',buffer:photo});
  await page.waitForFunction(value=>document.getElementById('my-picture-preview').src.startsWith('data:image/jpeg')&&document.getElementById('my-picture-preview').src!==value,lucyValue);
  await page.locator('#my-picture-form button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#my-picture-form .form-result').textContent==='Your picture is saved!');
  const uploaded=await saved();assert.match(uploaded,/^data:image\/jpeg;base64,/);assert.notEqual(uploaded,lucyValue);assert(uploaded.length<=150000,'Upload fits the database limit');
  await page.screenshot({path:`${shots}/kid-picture-saved.png`,fullPage:true});
  await page.reload();await page.locator('#my-picture').waitFor();await page.evaluate(()=>ACCOUNTS.ready);
  assert.equal(await page.locator('#my-picture-preview').getAttribute('src'),uploaded,'Upload sticks after reload');
  assert.equal(await page.locator('#my-picture input[name=avatar]:checked').count(),0,'No Lucy looks chosen for an upload');

  await page.goto(local.url+'/v3-moonboat/index.html');await page.waitForFunction(value=>document.querySelector('#account-strip summary img')?.src===value,uploaded);
  await page.goto(local.url+'/accounts/');await page.evaluate(()=>ACCOUNTS.ready.then(()=>ACCOUNTS.signOut()));

  await page.evaluate(([handle,password])=>ACCOUNTS.ready.then(()=>ACCOUNTS.signIn(handle,password,{role:'grownup'})),['picture_adult',password]);
  await page.locator('#children-list li').first().waitFor();
  assert.equal(await page.locator('#my-picture').isVisible(),false,'Grown-ups do not get the kid card');
  assert.equal(await page.locator('#children-list .child-avatar img').first().getAttribute('src'),uploaded,'Linked grown-up sees the new picture');
  await assert.rejects(page.evaluate(()=>ACCOUNTS.setOwnAvatar('x')),/Sign in as a child/);
  assert.deepEqual(errors,[]);
  console.log('PASS kid picture browser (mock transport): card, failed save, Lucy and upload stick after reload, game strip, grown-up roster');
 }finally{await browser.close();local.server.close();}
})().catch(error=>{console.error(error);process.exit(1);});
