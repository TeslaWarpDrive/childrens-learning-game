'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const ROSTER='letters-offline-clients';
const ROSTER_URL='http://localhost/letters-offline-roster';
function fakeCaches(keys){
  const bags=new Map(),deleted=[];
  const caches={
    keys:async()=>keys.slice(),
    delete:async name=>{deleted.push(name);return true;},
    open:async name=>{
      if(!bags.has(name))bags.set(name,new Map());
      const bag=bags.get(name);
      return {
        put:async(request,response)=>{bag.set(request.url,typeof response.text==='function'?await response.text():String(response));},
        match:async request=>{
          const body=bag.get(request.url);
          if(body===undefined)return undefined;
          return {json:async()=>JSON.parse(body)};
        }
      };
    }
  };
  return {caches,deleted,async roster(){
    const cache=await caches.open(ROSTER);
    const response=await cache.match({url:ROSTER_URL});
    return response?response.json().then(data=>data.clients||{}):{};
  }};
}
function boot(store,{clients=[]}={}){
  const listeners={},navigations=[],messages=[];
  for(const client of clients){
    client.postMessage=message=>messages.push({id:client.id,type:message.type});
    client.navigate=()=>{navigations.push(client.url);return Promise.resolve();};
  }
  const caches=store.caches;
  vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{
    URL,Request,Response,importScripts:()=>{},caches,
    self:{
      OFFLINE_MANIFEST:{version:'fixture',files:[]},
      location:new URL('http://localhost/sw.js'),
      registration:{scope:'http://localhost/'},
      addEventListener:(name,fn)=>listeners[name]=fn,
      clients:{claim:async()=>{},matchAll:async()=>clients,get:async id=>clients.find(client=>client.id===id)||null}
    }
  });
  return {listeners,navigations,messages,async send(client,data){
    let job;listeners.message({data,source:client,waitUntil:promise=>{job=promise;}});
    if(job)await job;else await tick();
  },async activate(){
    let activation;listeners.activate({waitUntil:promise=>activation=promise});
    await activation;
  }};
}
async function seed(store,clients){
  const cache=await store.caches.open(ROSTER);
  await cache.put({url:ROSTER_URL},{text:async()=>JSON.stringify({clients})});
}
async function pageAnnounces(file){
  const sent=[];
  let found;
  const installing={postMessage:message=>sent.push({target:'installing',type:message.type})};
  const registration={
    active:{postMessage:message=>sent.push({target:'active',type:message.type})},
    waiting:null,
    installing,
    addEventListener(type,fn){if(type==='updatefound')found=fn;}
  };
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{
    window:{
      navigator:{serviceWorker:{getRegistration:()=>Promise.resolve(registration),addEventListener(){}}},
      ACCOUNTS:undefined
    },
    location:{protocol:'https:',replace(){}}
  });
  await tick();
  const next={postMessage:message=>sent.push({target:'updatefound',type:message.type})};
  registration.installing=next;
  found();
  return sent;
}
(async()=>{
  const failures=[];
  async function check(name,fn){
    try{await fn();console.log('PASS '+name);}
    catch(error){failures.push(name);console.error('FAIL '+name);console.error(error);}
  }
  const sw=fs.readFileSync('sw.js','utf8');
  const fetchHandler=sw.slice(sw.indexOf("addEventListener('fetch'"));
  assert.match(fetchHandler,/cache:'no-store'/);
  assert.doesNotMatch(fetchHandler,/navigate\(/);
  const paths=[
    ['letter','http://localhost/v1-letter-post/'],
    ['moonboat','http://localhost/v3-moonboat/index.html'],
    ['ribbon','http://localhost/v4-silk-thread/?theme=1'],
    ['accounts','http://localhost/accounts/'],
    ['home','http://localhost/index.html'],
    ['chooser','http://localhost/']
  ];
  await check('old game windows are not force-reloaded on the first takeover',async()=>{
    const clients=paths.map(([id,url])=>({id,url}));
    const store=fakeCaches(['letters-with-lucy-old']);
    const worker=boot(store,{clients});
    await worker.send(clients[0],{type:'letters-offline-aware',inRound:false});
    await worker.activate();
    assert.deepEqual(worker.navigations.filter(url=>url==='http://localhost/index.html'||url==='http://localhost/'||url.startsWith('http://localhost/accounts/')),[],'Site home and accounts stay put');
    assert.deepEqual(worker.navigations,[], 'An old game window that cannot announce is not force-reloaded');
    assert.deepEqual(worker.messages.map(message=>message.id).sort(),['letter','moonboat','ribbon'].sort());
    assert.deepEqual(store.deleted,['letters-with-lucy-old']);
  });
  await check('a takeover with no previous cache does not reload or message',async()=>{
    const clients=paths.map(([id,url])=>({id,url}));
    const worker=boot(fakeCaches([]),{clients});
    await worker.activate();
    assert.deepEqual(worker.navigations,[]);
    assert.deepEqual(worker.messages,[]);
  });
  await check('announced and in-round state is stored for a restarted worker',async()=>{
    const client={id:'mid-round',url:'http://localhost/v1-letter-post/'};
    const store=fakeCaches(['letters-with-lucy-old']);
    const writer=boot(store,{clients:[client]});
    await writer.send(client,{type:'letters-offline-aware'});
    await writer.send(client,{type:'letters-offline-round',inRound:true});
    const saved=await store.roster();
    assert.equal(saved[client.id]?.aware,true,'The announce is still there after the worker is gone');
    assert.equal(saved[client.id]?.inRound,true,'The open round is still there after the worker is gone');
    const restarted=boot(store,{clients:[client]});
    await restarted.activate();
    assert.deepEqual(restarted.navigations,[], 'A worker that lost its memory does not reload a persisted in-round window');
    await restarted.send(client,{type:'letters-offline-round',inRound:false});
    assert.deepEqual(restarted.navigations,[],'The page owns the final reload decision');
    assert.equal(restarted.messages.length,2,'After restart, the safe report asks the page to check again');
  });
  await check('unknown roster state is not force-reloaded',async()=>{
    const client={id:'unknown',url:'http://localhost/v3-moonboat/index.html'};
    const store=fakeCaches(['letters-with-lucy-old']);
    store.caches.open=async()=>{throw new Error('disk unavailable');};
    const worker=boot(store,{clients:[client]});
    await worker.activate();
    assert.deepEqual(worker.navigations,[], 'Unreadable or missing round state defaults to no force-reload');
    assert.ok(!store.deleted.includes(ROSTER));
  });
  await check('a deferred takeover asks the page again after each safe report',async()=>{
    const client={id:'playing',url:'http://localhost/v4-silk-thread/?theme=1'};
    const store=fakeCaches([]);
    await seed(store,{playing:{aware:true,inRound:true,pending:true}});
    const worker=boot(store,{clients:[client]});
    await worker.send(client,{type:'letters-offline-round',inRound:false,updateWaiting:true});
    assert.deepEqual(worker.navigations,[],'A safe report never authorizes forced navigation');
    assert.deepEqual(worker.messages,[{id:client.id,type:'letters-offline-update'}]);
    await worker.send(client,{type:'letters-offline-round',inRound:false,updateWaiting:true});
    assert.deepEqual(worker.navigations,[]);
    assert.equal(worker.messages.length,2,'A page that deferred again can receive another update request');
  });
  await check('an ordinary safe report without a pending takeover does not reload',async()=>{
    const client={id:'playing',url:'http://localhost/v1-letter-post/'};
    const store=fakeCaches([]);
    await seed(store,{playing:{aware:true,inRound:true,pending:false}});
    const worker=boot(store,{clients:[client]});
    await worker.send(client,{type:'letters-offline-round',inRound:false,updateWaiting:true});
    assert.deepEqual(worker.navigations,[]);
  });
  await check('game pages still skip their own reload during a round and publish round state',async()=>{
    for(const file of ['v1-letter-post/app.js','v3-moonboat/app.js']){
      const source=fs.readFileSync(file,'utf8');
      assert.match(source,/letters-offline-update'&&state!=='listen'&&state!=='match'&&!roundId&&!savingRounds/);
      assert.doesNotMatch(source,/letters-offline-update'&&[^;\n]*\bbusy\b/);
      assert.equal(source.includes("else if(event.data?.type==='letters-offline-update')offlineUpdateWaiting=true"),true,file+' keeps an update that arrived during a round');
      assert.equal(source.includes("type:'letters-offline-round',inRound,updateWaiting"),true,file+' tells the worker when the round is open');
      assert.equal(source.includes("state==='listen'||state==='match'||!!roundId||savingRounds>0"),true,file+' uses the same safe moment as its own reload');
      const sent=await pageAnnounces(file);
      assert.deepEqual(sent,[
        {target:'active',type:'letters-offline-aware'},
        {target:'installing',type:'letters-offline-aware'},
        {target:'updatefound',type:'letters-offline-aware'}
      ],file);
    }
  });
  if(failures.length){
    console.error('FAILED '+failures.length+' '+failures.join('; '));
    process.exitCode=1;
    return;
  }
  console.log('PASS first takeover: old and unknown windows stay, a stored in-round window stays, the next safe report can reload');
})().catch(error=>{console.error(error);process.exitCode=1;});
