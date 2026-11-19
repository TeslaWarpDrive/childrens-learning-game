'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {staticServer, backend, playwright, form, settle} = require('./accounts_sync.cjs');
const output = process.env.UIUX_REPORT_DIR || '/tmp/lwl-uiux-review';
const viewports = [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:1024,height:600},{width:1366,height:768},{width:1920,height:1080}];
(async () => {
  fs.mkdirSync(output, {recursive:true});
  const {server,url} = await staticServer();
  const browser = await playwright().chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome',args:['--no-sandbox']});
  const results = [];
  try {
    for (const viewport of viewports) {
      const fixture = backend();
      const adult = fixture.seed('review_master','test123','Morgan');
      fixture.seed('review_adult','test123','Avery');
      const kid = fixture.seed('review_kid','test123','Alex',{role:'child',adult_id:adult});
      const context = await browser.newContext({viewport,reducedMotion:'reduce'});
      await context.route('https://*.supabase.co/**',fixture.route);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      async function capture(name) {
        await page.evaluate(() => document.fonts.ready);
        await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${viewport.width} ${name}: horizontal overflow`);
        assert.equal(await page.locator('img').evaluateAll(images => images.filter(i => i.getClientRects().length && (!i.complete || !i.naturalWidth)).length),0,`${name}: images loaded`);
        if (!process.env.NO_SCREENSHOTS) await page.screenshot({path:path.join(output,`${viewport.width}-${name}.png`),fullPage:true});
        results.push({width:viewport.width,screen:name,fit:true});
      }
      async function password(formId) {
        const input = page.locator(`#${formId} [name=password]`);
        const toggle = page.locator(`#${formId} [data-password-toggle]`);
        await input.fill('wrong-password');await toggle.click();
        assert.equal(await input.getAttribute('type'),'text');
        assert.equal(await toggle.getAttribute('aria-pressed'),'true');
        const box = await toggle.boundingBox();assert(box.width >= 44 && box.height >= 44);
        await toggle.click();assert.equal(await input.getAttribute('type'),'password');
      }
      await page.goto(url+'/');
      await page.waitForFunction(() => document.querySelector('#login-dialog').matches(':modal'));
      assert.equal(await page.evaluate(()=>document.activeElement.id),'login-title','Opening sign-in does not summon the touch keyboard');
      await capture('child-signin');
      await password('child-signin-form');
      await page.locator('#child-signin-form [name=handle]').fill('unknown_user');
      await page.locator('#child-signin-form button[type=submit]').click();
      await page.locator('#login-status.error').waitFor();
      assert.match(await page.locator('#login-status').innerText(),/Check your username and password/);
      assert.equal(await page.locator('#child-signin-form [name=password]').inputValue(),'');
      await capture('child-signin-error');
      await page.locator('#play-unsaved').click();
      await page.waitForFunction(()=>document.body.dataset.homeStep==='layouts');
      await capture('world-picker');
      await context.setOffline(true);await page.locator('.connection-notice').waitFor();
      assert.match(await page.locator('.connection-notice').innerText(),/needs the internet/);
      await page.locator('#change-player').click();
      assert(await page.locator('#login-dialog .connection-notice').isVisible(),'Connection notice follows the login dialog');
      await context.setOffline(false);await page.locator('.connection-notice').waitFor({state:'hidden'});
      await page.locator('#play-unsaved').click();
      await page.waitForFunction(()=>document.body.dataset.homeStep==='layouts');
      assert.equal(await page.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).length),0,'No worker installed for a new visitor');
      for (const world of ['v1-letter-post','v3-moonboat','v4-silk-thread']) {
        await page.goto(`${url}/${world}/?mode=guest`);await settle(page);await page.locator('#mute').click();
        for (const theme of ['0','1','2']) {
          await page.selectOption('#theme',theme);await settle(page);
          await capture(`${world}-${theme}-home`);
          if(world==='v1-letter-post' && viewport.width<=550){
            const title=await page.locator('.post-intro h1').boundingBox(),copy=await page.locator('.post-intro .lead').boundingBox();
            assert(title.y+title.height<=copy.y,'Title and description must not overlap');
          }
          await page.locator('[data-letter=B]').click();await page.waitForFunction(()=>document.body.dataset.screen==='listen');await settle(page);
          if(theme==='0')await capture(`${world}-listen`);
          await page.locator('[data-action=match]').click();await page.waitForFunction(()=>document.body.dataset.screen==='match');await settle(page);
          const wrong=page.locator('[data-answer]:not([data-answer=B])').first();await wrong.click();await settle(page);await wrong.click();await settle(page);
          assert.equal(await page.locator('.lucy-hint').count(),1,'Lucy points after two misses');
          if(theme==='0')await capture(`${world}-hint`);
          await page.locator('[data-answer=B]').click();await page.waitForFunction(()=>document.body.dataset.screen==='celebrate');await settle(page);
          if(theme==='0')await capture(`${world}-reward`);
          await page.locator('[data-action=next]').click();await page.waitForFunction(()=>document.body.dataset.screen==='listen');await settle(page);
          await page.keyboard.press('Escape');await page.waitForFunction(()=>document.body.dataset.screen==='home');await settle(page);
        }
        const back=await page.getByRole('link',{name:'Choose a world'}).boundingBox();assert(back.height>=44,'World navigation has a touch target');
      }
      await page.goto(url+'/accounts/');await page.locator('#signed-out').waitFor();
      await capture('grownup-signin');await password('signin-form');
      await page.locator('#signin-form [name=handle]').fill('unknown_user');
      await page.locator('#signin-form button[type=submit]').click();
      await page.locator('#signin-form .form-result.error').waitFor();
      assert.match(await page.locator('#signin-form .form-result').innerText(),/Check your username and password/);
      await capture('grownup-signin-error');
      await form(page,'signin-form',{handle:'review_master',password:'test123'});await page.locator('#children-list li').waitFor();
      await capture('kids');
      await page.locator('#children-list input[type=checkbox]').check();await capture('kids-selected');
      await page.locator('#clear-kids').click();
      await page.locator('#children-list button').click();await page.locator('#child-management').waitFor();await capture('child-progress');
      await page.locator('#delete-child').click();await page.locator('#confirm-child').waitFor();await capture('delete-confirmation');await page.locator('#cancel-child').click();
      await page.goto(url+'/accounts/#account');await page.locator('#my-account-page').waitFor();await capture('my-account');
      await page.locator('#adults-view').click();await page.locator('#grownups-list li').first().waitFor();await capture('grownups');
      await page.locator('#grownups-list button').filter({hasText:'Edit'}).first().click();await page.locator('#edit-grownup').waitFor();await capture('edit-grownup');await page.locator('#close-edit-grownup').click();
      await page.goto(`${url}/grown-ups/?child=${kid}`);await page.locator('#settings[data-open=true]').waitFor();await capture('child-settings');
      await page.locator('[data-preset=starter]').click();
      await page.locator('#apply-children').click();await page.locator('#confirm-settings').waitFor();await capture('settings-review');
      await page.locator('#confirm-settings-action').click();await page.locator('#confirm-settings').waitFor({state:'hidden'});
      assert.deepEqual(fixture.overrides.get(kid).letters,[...'SATPIN']);
      await page.goto(url+'/grown-ups/');await page.locator('#settings[data-open=true]').waitFor();await capture('game-defaults');
      if(viewport.width<960)assert(await page.locator('.index').isVisible(),'Settings navigation stays available on small screens');
      await page.locator('#sign-out').click();await page.waitForURL('**/accounts/index.html');await page.locator('#signed-out').waitFor();
      await page.goto(url+'/');await form(page,'child-signin-form',{handle:'review_kid',password:'test123'});await page.waitForFunction(()=>document.body.dataset.homeStep==='layouts');
      await page.goto(url+'/accounts/');await page.locator('#my-picture').waitFor();await capture('kid-profile');
      await page.goto(url+'/grown-ups/');await page.waitForURL('**/accounts/index.html');assert(await page.locator('#people').isHidden(),'Child cannot enter grown-up management');
      assert.deepEqual(errors,[]);
      await context.close();console.log(`PASS ${viewport.width}x${viewport.height}: sign-in, errors, guest play, 9 world/theme journeys, accounts, dialogs, settings, role separation`);
    }
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({backend:'isolated Supabase protocol fixture; no live database writes',results},null,2)+'\n');
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
