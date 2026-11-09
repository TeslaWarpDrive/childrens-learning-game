'use strict';
importScripts('./sw-assets.js');
const CACHE = 'letters-with-lucy-'+self.OFFLINE_MANIFEST.version;
const files = new Set(self.OFFLINE_MANIFEST.files.map(file=>new URL(file,self.location.href).href));
const games = ['v1-letter-post/','v3-moonboat/','v4-silk-thread/'].map(path=>new URL(path,self.registration.scope).href);
const owned = key=>key.startsWith('little-woof-')||key.startsWith('letters-with-lucy-');
const ROSTER='letters-offline-clients';
const memory=new Map(),settled=new Set();
let loadJob=null,tail=Promise.resolve(),arming=false;
const gameClient=client=>!!client&&games.some(url=>String(client.url||'').startsWith(url));
function rosterRequest(){return new Request(new URL('letters-offline-roster',self.registration.scope).href);}
async function readRoster(){
  try{
    if(typeof caches==='undefined'||typeof caches.open!=='function')return null;
    const cache=await caches.open(ROSTER);
    const response=await cache.match(rosterRequest());
    if(!response)return {};
    const data=await response.json();
    return data&&typeof data.clients==='object'&&data.clients?data.clients:null;
  }catch{return null;}
}
function rememberDisk(clients){
  for(const [id,record] of Object.entries(clients)){
    if(!record||typeof record!=='object')continue;
    const prev=memory.get(id);
    if(!prev){
      memory.set(id,{aware:record.aware===true,inRound:typeof record.inRound==='boolean'?record.inRound:null,pending:record.pending===true});
      continue;
    }
    if(record.aware===true)prev.aware=true;
    if(record.pending===true)prev.pending=true;
    if(prev.inRound===null&&typeof record.inRound==='boolean')prev.inRound=record.inRound;
  }
}
function load(){
  if(!loadJob)loadJob=(async()=>{
    const disk=await readRoster();
    if(disk)rememberDisk(disk);
    return disk;
  })().catch(()=>null);
  return loadJob;
}
function snapshot(){
  const clients={};
  for(const [id,record] of memory)clients[id]={aware:record.aware===true,inRound:typeof record.inRound==='boolean'?record.inRound:null,pending:record.pending===true};
  return clients;
}
function persist(){
  const job=tail.catch(()=>{}).then(async()=>{
    if(typeof caches==='undefined'||typeof caches.open!=='function')return;
    const cache=await caches.open(ROSTER);
    await cache.put(rosterRequest(),new Response(JSON.stringify({clients:snapshot()})));
  }).catch(()=>{});
  tail=job;
  return job;
}
function apply(id,data){
  const prev=memory.get(id)||{aware:false,inRound:null,pending:false};
  const wasInRound=prev.inRound===true;
  const record={
    aware:data.type==='letters-offline-aware'||prev.aware===true||data.aware===true,
    inRound:typeof data.inRound==='boolean'?data.inRound:(typeof prev.inRound==='boolean'?prev.inRound:null),
    pending:prev.pending===true
  };
  memory.set(id,record);
  return {record,wasInRound};
}
self.addEventListener('message',event=>{
  const id=event.source?.id,data=event.data;
  if(!id||(data?.type!=='letters-offline-aware'&&data?.type!=='letters-offline-round'))return;
  const job=(async()=>{
    await load();
    const {record,wasInRound}=apply(id,data);
    const armed=record.pending||arming;
    if(data.inRound===false&&!settled.has(id)&&armed&&(wasInRound||data.updateWaiting===true)){
      try{
        const client=typeof self.clients?.get==='function'?await self.clients.get(id):null;
        if(gameClient(client)){
          record.pending=false;
          memory.set(id,record);
          settled.add(id);
          await client.navigate(client.url);
        }
      }catch{
        record.pending=true;
        memory.set(id,record);
        settled.delete(id);
      }
    }
    await persist();
  })();
  if(typeof event.waitUntil==='function')event.waitUntil(job);
  else job.catch(()=>{});
});
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    try{await cache.addAll(self.OFFLINE_MANIFEST.files);}
    catch(error){
      try{await caches.delete(CACHE);}catch{}
      throw error;
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const old = (await caches.keys()).filter(key=>owned(key)&&key!==CACHE);
    await Promise.all(old.map(key=>caches.delete(key)));
    await self.clients.claim();
    // An old window cannot report listen, match, roundId, or a save. Unknown and
    // in-round clients stay. A later true-to-false round report reloads once.
    if(!old.length)return;
    arming=true;
    await load();
    for(const client of await self.clients.matchAll({type:'window'})){
      if(!gameClient(client))continue;
      try{client.postMessage({type:'letters-offline-update'});}catch{}
      if(settled.has(client.id))continue;
      const prev=memory.get(client.id)||{aware:false,inRound:null,pending:false};
      prev.pending=true;
      memory.set(client.id,prev);
    }
    arming=false;
    await persist();
  })());
});
self.addEventListener('fetch',event=>{
  const url = new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  if(url.pathname.endsWith('/'))url.pathname+='index.html';
  url.search='';url.hash='';
  if(!files.has(url.href))return;
  event.respondWith((async()=>{
    // Online loads always ask for the current build; installed assets remain offline fallbacks.
    try{
      const response=await fetch(event.request,{cache:'no-store'});
      if(response.ok)return response;
      const saved=await caches.match(url.href,{cacheName:CACHE});
      return saved||response;
    }catch(error){
      const saved=await caches.match(url.href,{cacheName:CACHE});
      if(saved)return saved;
      throw error;
    }
  })());
});
