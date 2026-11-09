'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function loadWorker(){
  const listeners={};
  vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{
    URL,importScripts:()=>{},
    caches:{keys:async()=>[],delete:async()=>true},
    self:{
      OFFLINE_MANIFEST:{version:'fixture',files:[]},
      location:new URL('http://localhost/sw.js'),
      registration:{scope:'http://localhost/'},
      addEventListener:(name,fn)=>listeners[name]=fn,
      clients:{claim:async()=>{},matchAll:async()=>[]}
    }
  });
  return listeners;
}
async function activate(clients,{old=true,announce=[]}={}){
  const listeners={};
  const navigations=[],messages=[];
  for(const client of clients){
    client.postMessage=message=>messages.push({id:client.id,type:message.type});
    client.navigate=()=>{navigations.push(client.url);return Promise.resolve();};
  }
  vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{
    URL,importScripts:()=>{},
    caches:{keys:async()=>old?['letters-with-lucy-old']: [],delete:async()=>true},
    self:{
      OFFLINE_MANIFEST:{version:'fixture',files:[]},
      location:new URL('http://localhost/sw.js'),
      registration:{scope:'http://localhost/'},
      addEventListener:(name,fn)=>listeners[name]=fn,
      clients:{claim:async()=>{},matchAll:async()=>clients}
    }
  });
  if(typeof listeners.message==='function')for(const client of announce)listeners.message({data:{type:'letters-offline-aware'},source:client});
  let activation;
  listeners.activate({waitUntil:promise=>activation=promise});
  await activation;
  return {navigations,messages};
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
  const clients=paths.map(([id,url])=>({id,url}));
  const aware=clients.filter(client=>client.id==='letter');
  const first=await activate(clients,{announce:aware});
  assert.deepEqual(first.navigations.filter(url=>url==='http://localhost/index.html'||url==='http://localhost/'||url.startsWith('http://localhost/accounts/')),[],'Site home and accounts stay put');
  assert.deepEqual(first.navigations.filter(url=>url.startsWith('http://localhost/v1-letter-post/')),[],'A page that announced the protocol is not force-reloaded');
  assert.deepEqual(first.navigations.slice().sort(),[
    'http://localhost/v3-moonboat/index.html',
    'http://localhost/v4-silk-thread/?theme=1'
  ].sort(),'Old game windows reload on the first takeover');
  assert.deepEqual(first.messages.map(message=>message.id).sort(),['letter','moonboat','ribbon'].sort());
  const install=await activate(clients,{old:false});
  assert.deepEqual(install.navigations,[]);
  assert.deepEqual(install.messages,[]);
  for(const file of ['v1-letter-post/app.js','v3-moonboat/app.js']){
    const source=fs.readFileSync(file,'utf8');
    assert.match(source,/letters-offline-update'&&state!=='listen'&&state!=='match'&&!roundId&&!savingRounds/);
    assert.doesNotMatch(source,/letters-offline-update'&&[^;\n]*\bbusy\b/);
    const sent=await pageAnnounces(file);
    assert.deepEqual(sent,[
      {target:'active',type:'letters-offline-aware'},
      {target:'installing',type:'letters-offline-aware'},
      {target:'updatefound',type:'letters-offline-aware'}
    ],file);
  }
  loadWorker();
  console.log('PASS first takeover: old game windows reload, aware pages and site home do not');
})().catch(error=>{console.error(error);process.exitCode=1;});
