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
      await page.waitForFunction(()=>document.querySelector('#login-dialog').matches(':modal'));
      const login=await page.locator('#login-dialog').evaluate(dialog=>{
        const box=dialog.getBoundingClientRect();
        const controls=[...dialog.querySelectorAll('input,button,a')].filter(e=>!e.hidden).map(e=>{
          const r=e.getBoundingClientRect();return {name:e.name||e.id||e.textContent,height:r.height,top:r.top,bottom:r.bottom};
        });
        return {top:box.top,bottom:box.bottom,height:dialog.clientHeight,scrollHeight:dialog.scrollHeight,controls};
      });
      assert(login.top>=0 && login.bottom<=viewport.height,JSON.stringify(login));
      assert(login.scrollHeight<=login.height,JSON.stringify(login));
      for(const control of login.controls){
        assert(control.height>=60,JSON.stringify(control));
        assert(control.top>=login.top && control.bottom<=login.bottom,JSON.stringify(control));
      }
      await page.screenshot({path:`${shots}/login-${viewport.width}.png`});
      console.log(`PASS sign-in ${viewport.width}x${viewport.height}: no scrolling, all controls >=60px`);
      // Returning children get a real continuation control from the local fixture.
      fixture.seed('fix24b_child_'+viewport.width,'test1234','Test child',{role:'child'});
      await page.locator('[name=handle]').fill('fix24b_child_'+viewport.width);
      await page.locator('[name=password]').fill('test1234');
      await page.locator('#child-signin-form button').click();
      await page.waitForFunction(()=>document.body.dataset.homeStep==='layouts');
      await page.goto(local.url);
      await page.waitForFunction(()=>!document.querySelector('#continue-player').hidden);
      const returning=await page.locator('#login-dialog').evaluate(dialog=>({height:dialog.clientHeight,scrollHeight:dialog.scrollHeight}));
      assert(returning.scrollHeight<=returning.height,JSON.stringify(returning));
      await page.screenshot({path:`${shots}/login-returning-${viewport.width}.png`});
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
        if(board){
          assert.equal(await page.locator('[data-letter] .pick-glyph').first().evaluate(e=>getComputedStyle(e).fontSize),'64px');
          await page.screenshot({path:`${shots}/${game}-${viewport.width}-home.png`,fullPage:true});
        }
        await page.locator('[data-letter="A"]').click(); await settle(page);
        await fits('letter');
        if(board){
          const letter=await page.locator('.listen-layout').evaluate(layout=>{
            const size=selector=>parseFloat(getComputedStyle(layout.querySelector(selector)).fontSize);
            const box=layout.getBoundingClientRect(),card=layout.querySelector('.listen-letter').getBoundingClientRect();
            const button=layout.querySelector('.continue').getBoundingClientRect();
            return {width:box.width,heading:size('.play-title'),glyph:size('.glyph'),copy:size('.play-copy'),buttonFont:size('.continue'),buttonHeight:button.height,cardHeight:card.height,cardWidth:card.width,portrait:layout.querySelector('.guide-lucy').getBoundingClientRect().width};
          });
          assert(letter.width>=viewport.width*.8,JSON.stringify(letter));
          assert(letter.heading>=80 && letter.glyph>=260 && letter.copy>=28,JSON.stringify(letter));
          assert(letter.cardHeight>=400 && letter.cardWidth>=400,JSON.stringify(letter));
          assert(letter.buttonHeight>=88 && letter.buttonFont>=28 && letter.portrait>=280,JSON.stringify(letter));
          console.log(`PASS enlarged letter ${game} ${viewport.width}: ${JSON.stringify(letter)}`);
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
        if(board){
          await page.locator('[data-answer="A"]').click();await settle(page);
          await page.locator('.reward-art img').evaluate(img=>img.decode());
          assert.equal(await page.locator('.reward-art img').evaluate(e=>getComputedStyle(e).width),'320px');
          assert.equal(await page.locator('.word-line').evaluate(e=>getComputedStyle(e).fontSize),'44px');
          await fits('reward');
          await page.screenshot({path:`${shots}/${game}-${viewport.width}-reward.png`,fullPage:true});
        }
        console.log(`PASS ${game} ${viewport.width}x${viewport.height}: home, letter, find; board=${board}; ${JSON.stringify(sizes)}`);
      }
      assert.deepEqual(errors,[]); await context.close();
    }
    // Optional exact visual comparison against a named local commit.
    if(process.env.FIX24_BASELINE){
      const {execFileSync}=require('node:child_process');
      const oldCSS=new Map(['home/home.css','v1-letter-post/word-pictures.css'].map(file=>[
        '/'+file,execFileSync('git',['show',`${process.env.FIX24_BASELINE}:${file}`],{encoding:'utf8'})
      ]));
      for(const viewport of [{width:768,height:1024},{width:1440,height:1000},{width:1920,height:900}]){
        const captures=[];
        for(const baseline of [true,false]){
          const context=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
          await context.route('https://*.supabase.co/**',fixture.route);
          if(baseline)await context.route('**/*.css',route=>{
            const css=oldCSS.get(new URL(route.request().url()).pathname);
            return css===undefined?route.continue():route.fulfill({contentType:'text/css',body:css});
          });
          await context.addInitScript(()=>{Math.random=()=>0.25;});
          const page=await context.newPage(),frames=[];
          const capture=async label=>{
            await page.evaluate(()=>document.fonts.ready);await page.mouse.move(0,0);
            const geometry=await page.locator('body *').evaluateAll(nodes=>nodes.filter(e=>e.getClientRects().length).map(e=>{
              const r=e.getBoundingClientRect(),style=getComputedStyle(e);
              const properties=['display','position','font','color','background','padding','margin','gap','border','borderRadius','boxShadow','opacity','transform','gridTemplateColumns','gridTemplateRows','maxWidth','minHeight','width','height','overflow'];
              return {tag:e.tagName,css:e.getAttribute('class'),x:r.x,y:r.y,width:r.width,height:r.height,styles:properties.map(key=>style[key])};
            }));
            // Compare game content separately from Chrome's native header-control repaint.
            const image=label==='login'||label==='picker'?await page.screenshot({fullPage:true}):await page.locator('#main').screenshot();
            frames.push({label,geometry,image});
          };
          await page.goto(local.url);await page.waitForFunction(()=>document.querySelector('#login-dialog').matches(':modal'));
          await capture('login');await page.locator('#play-unsaved').click();await capture('picker');
          for(const game of ['v4-silk-thread','v3-moonboat','v1-letter-post']){
            await page.goto(`${local.url}/${game}/`);await settle(page);
            await page.locator('#mute').click();await capture(game+' home');
            await page.locator('[data-letter="A"]').click();await settle(page);await capture(game+' letter');
            await page.locator('[data-action="match"]').click();await settle(page);
            await page.locator('.choice img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
            await capture(game+' find');
          }
          captures.push(frames);await context.close();
        }
        const comparison=await browser.newPage();
        for(let i=0;i<captures[0].length;i++){
          const before=captures[0][i],after=captures[1][i];
          assert(JSON.stringify(before.geometry)===JSON.stringify(after.geometry),`${viewport.width} ${before.label}: geometry or styles changed`);
          const pixels=await comparison.evaluate(async sources=>{
            const images=await Promise.all(sources.map(async src=>{const img=new Image();img.src=src;await img.decode();return img;}));
            if(images[0].width!==images[1].width||images[0].height!==images[1].height)return {changed:Infinity,maxDelta:Infinity};
            const canvas=document.createElement('canvas');canvas.width=images[0].width;canvas.height=images[0].height;
            const ctx=canvas.getContext('2d'),data=images.map(img=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data;});
            let changed=0,maxDelta=0;
            for(let p=0;p<data[0].length;p+=4){let delta=0;for(let c=0;c<4;c++)delta=Math.max(delta,Math.abs(data[0][p+c]-data[1][p+c]));if(delta)changed++;maxDelta=Math.max(maxDelta,delta);}
            return {changed,maxDelta,total:canvas.width*canvas.height};
          },[before.image,after.image].map(bytes=>'data:image/png;base64,'+bytes.toString('base64')));
          // Allow only tiny raster rounding differences after exact layout/style checks.
          if(pixels.changed>pixels.total*0.001||pixels.maxDelta>32){
            fs.writeFileSync(`${shots}/compare-before.png`,before.image);fs.writeFileSync(`${shots}/compare-after.png`,after.image);
            assert.fail(`${viewport.width} ${before.label}: ${JSON.stringify(pixels)}`);
          }
        }
        await comparison.close();
        console.log(`PASS unchanged ${viewport.width}x${viewport.height}: all ${captures[0].length} captures match ${process.env.FIX24_BASELINE} geometry/styles exactly; image differences <=0.1% of pixels and <=32 per color channel`);
      }
    }
  } finally {await browser.close();await new Promise(resolve=>local.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
