'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function installWorker({addAll,version='fixture'}){
  const handlers={};
  let skipped=0;
  const removed=[],opened=[];
  vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{
    URL,importScripts:()=>{},
    self:{
      OFFLINE_MANIFEST:{version,files:['./index.html']},
      location:new URL('http://localhost/sw.js'),
      registration:{scope:'http://localhost/'},
      addEventListener:(name,fn)=>handlers[name]=fn,
      skipWaiting(){skipped++;}
    },
    caches:{
      keys:async()=>['letters-with-lucy-good','little-woof-good'],
      open:async name=>{opened.push(name);return {addAll};},
      delete:async name=>{removed.push(name);return true;}
    }
  });
  let install;
  handlers.install({waitUntil:promise=>install=promise});
  return {install,skipped:()=>skipped,removed,opened};
}
(async()=>{
  const failed=installWorker({addAll:async()=>{throw Error('Precache failed');}});
  await assert.rejects(failed.install,/Precache failed/);
  assert.equal(failed.skipped(),0,'A failed precache must not skip waiting');
  assert.deepEqual(failed.opened,['letters-with-lucy-fixture']);
  assert.deepEqual(failed.removed,['letters-with-lucy-fixture'],'The empty cache opened by this install is deleted');
  assert.equal(failed.removed.includes('letters-with-lucy-good'),false);
  assert.equal(failed.removed.includes('little-woof-good'),false);
  const ready=installWorker({addAll:async()=>{},version:'ready'});
  await ready.install;
  assert.equal(ready.skipped(),1);
  assert.deepEqual(ready.removed,[]);
  console.log('PASS failed precache deletes only the cache this install opened');
})().catch(error=>{console.error(error);process.exitCode=1;});
