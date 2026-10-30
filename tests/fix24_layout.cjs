'use strict';
const assert = require('node:assert/strict');
const {staticServer, backend, playwright, settle} = require('./accounts_sync.cjs');
const fs = require('node:fs');

(async () => {
  const local = await staticServer(), fixture = backend();
  const browser = await playwright().chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const shots = '/tmp/lucy-fix24';
  fs.mkdirSync(shots,{recursive:true});
  try {
    for (const viewport of [{width:1366,height:768},{width:1024,height:768}]) {
      const context = await browser.newContext({viewport,reducedMotion:'reduce'});
      await context.route('https://*.supabase.co/**',fixture.route);
      const page = await context.newPage();
      await page.goto(local.url);
      await page.locator('#play-unsaved').click();
      await page.waitForFunction(()=>document.body.dataset.homeStep==='layouts');
      const fit = await page.evaluate(()=>{
        const button = document.querySelector('#change-player'), box = button.getBoundingClientRect();
        const status = document.querySelector('#offline-status').getBoundingClientRect();
        return {height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,buttonHeight:box.height,font:getComputedStyle(button).fontSize,bottom:box.bottom,statusBottom:status.bottom};
      });
      assert(fit.height<=viewport.height,JSON.stringify(fit));
      assert(fit.width<=viewport.width,JSON.stringify(fit));
      assert(fit.bottom<=viewport.height && fit.statusBottom<=viewport.height,JSON.stringify(fit));
      assert(fit.buttonHeight>=64); assert.equal(fit.font,'20px');
      await page.screenshot({path:`${shots}/picker-${viewport.width}.png`});
      console.log(`PASS picker ${viewport.width}x${viewport.height}: ${JSON.stringify(fit)}`);
      await context.close();
    }
    for (const viewport of [{width:1920,height:1080},{width:2560,height:1440},{width:1600,height:950},{width:1440,height:1000},{width:1920,height:900}]) {
      const board = viewport.width>=1600 && viewport.height>=950;
      const context = await browser.newContext({viewport,reducedMotion:'reduce'});
      await context.route('https://*.supabase.co/**',fixture.route);
      const page = await context.newPage(), errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(local.url); await page.locator('#play-unsaved').click();
      for (const game of ['v4-silk-thread','v3-moonboat','v1-letter-post']) {
        await page.goto(`${local.url}/${game}/`); await settle(page);
        if (await page.locator('#mute').getAttribute('aria-pressed')!=='true') await page.locator('#mute').click();
        const fits = async label => {
          const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
          assert(!overflow,`${game} ${viewport.width} ${label} horizontal overflow`);
        };
        await fits('home');
        if(board)assert.equal(await page.locator('.app').evaluate(e=>getComputedStyle(e).maxWidth),'1760px');
        if(board)await page.screenshot({path:`${shots}/${game}-${viewport.width}-home.png`,fullPage:true});
        await page.locator('[data-letter="A"]').click(); await settle(page);
        await fits('letter');
        if(board){
          assert.equal(await page.locator('.listen-letter .glyph').evaluate(e=>getComputedStyle(e).fontSize),'220px');
          const next=await page.locator('[data-action="match"]').boundingBox();
          assert(next.y+next.height<=viewport.height,`${game}: letter continuation below viewport`);
        }
        if(board)await page.screenshot({path:`${shots}/${game}-${viewport.width}-letter.png`,fullPage:true});
        await page.locator('[data-action="match"]').click(); await settle(page);
        await page.locator('.choice img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
        await fits('find');
        const sizes=await page.locator('.choice').evaluateAll(nodes=>nodes.map(node=>{
          const img=node.querySelector('img'),word=node.querySelector('.word'),r=img.getBoundingClientRect(),b=node.getBoundingClientRect();
          return {image:parseFloat(getComputedStyle(img).width),word:getComputedStyle(word).fontSize,bottom:b.bottom,left:b.left,right:b.right,imageInside:r.left>=b.left&&r.right<=b.right&&r.top>=b.top&&r.bottom<=b.bottom};
        }));
        for(const size of sizes){
          assert(size.imageInside,JSON.stringify(size));
          if(board){assert(Math.abs(size.image-320)<1,JSON.stringify(size));assert.equal(size.word,'44px');assert(size.bottom<=viewport.height,`${game}: ${JSON.stringify(size)}`);}
          else assert(size.image<320,JSON.stringify(size));
        }
        if(board)assert.equal(await page.locator('.match .glyph').evaluate(e=>getComputedStyle(e).fontSize),'110px');
        if(board)for(const theme of ['0','1','2']) {
          await page.selectOption('#theme',theme); await settle(page);
          await page.screenshot({path:`${shots}/${game}-${viewport.width}-find-theme${theme}.png`,fullPage:true});
        }
        console.log(`PASS ${game} ${viewport.width}x${viewport.height}: home, letter, find; board=${board}; ${JSON.stringify(sizes)}`);
      }
      assert.deepEqual(errors,[]); await context.close();
    }
  } finally {await browser.close();await new Promise(resolve=>local.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
