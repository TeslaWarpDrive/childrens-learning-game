'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('accounts/navigation.js','utf8');
const saving='Saving the games for offline play…',ready='Games ready for offline play.',failed='Offline copy is not ready. Keep this page online and reload to try again.';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class Worker extends EventTarget{
 constructor(state){super();this.state=state;}
 change(state){this.state=state;this.dispatchEvent(new Event('statechange'));}
}
function page(registration){
 const offline={textContent:''};let persisted=0;
 vm.runInNewContext(source,{
  URL,location:new URL('http://localhost/index.html'),window:{ACCOUNTS:{}},
  document:{currentScript:{src:'http://localhost/accounts/navigation.js'},body:{dataset:{page:'home'}},getElementById:()=>offline},
  navigator:{serviceWorker:{register:async()=>{if(registration instanceof Error)throw registration;return registration;},get ready(){throw Error('Must not use an older worker’s ready promise');}},storage:{persist:async()=>{persisted++;}}}
 });
 return {offline,persisted:()=>persisted};
}
(async()=>{
 for(const outcome of ['installed','redundant']){
  const worker=new Worker('installing'),p=page({installing:worker,active:new Worker('activated')});
  await tick();assert.equal(p.offline.textContent,saving);
  worker.change(outcome);await tick();assert.equal(p.offline.textContent,outcome==='installed'?ready:failed);
  assert.equal(p.persisted(),outcome==='installed'?1:0);
 }
 for(const state of ['installed','activating','activated','redundant']){
  const p=page({waiting:new Worker(state)});await tick();assert.equal(p.offline.textContent,state==='redundant'?failed:ready);
 }
 for(const outcome of ['unchanged','update','failure']){
  let finish;
  const registration={active:new Worker('activated'),update:()=>new Promise((resolve,reject)=>finish=()=>{
   if(outcome==='failure')reject(Error('Update failed'));
   else{if(outcome==='update')registration.installing=new Worker('installing');resolve();}
  })};
  const p=page(registration);await tick();assert.equal(p.offline.textContent,saving);
  finish();await tick();
  if(outcome==='update'){
   assert.equal(p.offline.textContent,saving);registration.installing.change('installed');await tick();
  }
  assert.equal(p.offline.textContent,ready);
 }
 for(const registration of [new Error('Register failed'),{update:async()=>{}},{update:async()=>{throw Error('Update failed without an active worker');}}]){
  const p=page(registration);await tick();assert.equal(p.offline.textContent,failed);
 }
 // Run the actual install handler: a rejected precache never activates/deletes the old cache.
 const handlers={};let skipped=0,deleted=0,install;
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{
  URL,importScripts:()=>{},self:{OFFLINE_MANIFEST:{version:'fixture',files:['./index.html']},location:new URL('http://localhost/sw.js'),registration:{scope:'http://localhost/'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:()=>skipped++},
  caches:{open:async()=>({addAll:async()=>{throw Error('Precache failed');}}),delete:()=>deleted++}
 });
 handlers.install({waitUntil:promise=>install=promise});await assert.rejects(install,/Precache failed/);
 assert.equal(skipped,0);assert.equal(deleted,0);
 console.log('PASS offline readiness: current install, old active worker, update check, waiting worker, registration/install failures, failed addAll keeps old cache');
})().catch(error=>{console.error(error);process.exitCode=1;});
