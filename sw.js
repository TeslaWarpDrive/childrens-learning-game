'use strict';
importScripts('./sw-assets.js');
const CACHE = 'letters-with-lucy-'+self.OFFLINE_MANIFEST.version;
const files = new Set(self.OFFLINE_MANIFEST.files.map(file=>new URL(file,self.location.href).href));
const games = ['v1-letter-post/','v3-moonboat/','v4-silk-thread/'].map(path=>new URL(path,self.registration.scope).href);
const owned = key=>key.startsWith('little-woof-')||key.startsWith('letters-with-lucy-');
const aware=new Set();
self.addEventListener('message',event=>{
  if(event.data?.type==='letters-offline-aware'&&event.source?.id)aware.add(event.source.id);
});
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(self.OFFLINE_MANIFEST.files)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const old = (await caches.keys()).filter(key=>owned(key)&&key!==CACHE);
    await Promise.all(old.map(key=>caches.delete(key)));
    await self.clients.claim();
    // Pages that understand the update decide for themselves. Older game windows reload once.
    if(old.length)for(const client of await self.clients.matchAll({type:'window'})){
      if(!games.some(url=>client.url.startsWith(url)))continue;
      try{client.postMessage({type:'letters-offline-update'});}catch{}
      if(!aware.has(client.id))try{await client.navigate(client.url);}catch{}
    }
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
