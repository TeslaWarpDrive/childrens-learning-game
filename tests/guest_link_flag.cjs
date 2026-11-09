'use strict';
const assert = require('node:assert/strict');
const {staticServer, playwright} = require('./accounts_sync.cjs');

const GUEST_KEY = 'letters-with-lucy-guest';
const SESSION_KEY = 'little-woof-session-v1';
const TARGET_KEY = 'little-woof-target-v1';
const CHILD_ID = '11111111-1111-1111-1111-111111111111';
const ROUND_ID = '22222222-2222-2222-2222-222222222222';

function sessionBlob() {
  const profile = {id: CHILD_ID, handle: 'kept_child', display_name: 'Kept Child', role: 'child', progress_version: 3, avatar: '🐶'};
  return {
    access_token: 'kept-access-token',
    refresh_token: 'kept-refresh-token',
    expires_in: 3600,
    expires_at: 2000000000,
    user: {id: CHILD_ID},
    profile
  };
}

function roundRow() {
  return {
    id: ROUND_ID,
    user_id: CHILD_ID,
    kind: 'round',
    payload: {world: 'silk', letter: 'A', misses: 0},
    progress_version: 3,
    pending: true,
    local_order: 1
  };
}

async function openContext(browser, url) {
  const context = await browser.newContext({serviceWorkers: 'block', reducedMotion: 'reduce'});
  const external = [];
  await context.route('**/*', route => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin === new URL(url).origin) return route.continue();
    external.push(requestUrl.origin + requestUrl.pathname);
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return {context, page, errors, external};
}

async function readRows(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('little-woof-accounts');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('operations')) { db.close(); resolve([]); return; }
      const read = db.transaction('operations').objectStore('operations').getAll();
      read.onerror = () => reject(read.error);
      read.onsuccess = () => { db.close(); resolve(read.result); };
    };
  }));
}

async function run() {
  const {server, url} = await staticServer();
  const browser = await playwright().chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const button = await openContext(browser, url);
    await button.page.goto(url + '/', {waitUntil: 'domcontentloaded'});
    await button.page.waitForFunction(() => window.ACCOUNTS);
    assert.equal(await button.page.evaluate(key => sessionStorage.getItem(key), GUEST_KEY), null, 'An ordinary home visit must not store the guest flag');
    await button.page.locator('#play-unsaved').click();
    await button.page.waitForFunction(() => window.ACCOUNTS.guest === true);
    const buttonFlag = await button.page.evaluate(key => sessionStorage.getItem(key), GUEST_KEY);
    console.log('play-without-saving flag:', JSON.stringify(buttonFlag));
    assert.equal(buttonFlag, '1', 'Play without saving stores letters-with-lucy-guest');
    assert.deepEqual(button.errors, []);
    await button.context.close();

    const direct = await openContext(browser, url);
    await direct.page.goto(url + '/v4-silk-thread/index.html?mode=guest', {waitUntil: 'domcontentloaded'});
    await direct.page.waitForFunction(() => window.ACCOUNTS && window.ACCOUNTS.guest === true);
    const directFlag = await direct.page.evaluate(key => sessionStorage.getItem(key), GUEST_KEY);
    console.log('direct ?mode=guest flag:', JSON.stringify(directFlag));
    assert.equal(directFlag, buttonFlag, 'A direct ?mode=guest link must store letters-with-lucy-guest the same way Play without saving does');
    assert.equal(await direct.page.evaluate(key => localStorage.getItem(key), SESSION_KEY), null, 'A guest link with no session must not create one');
    await direct.page.locator('a[href="../index.html?layouts"]').click();
    await direct.page.waitForFunction(() => document.body.dataset.homeStep === 'layouts');
    assert.equal(await direct.page.evaluate(() => window.ACCOUNTS.guest), true, 'The stored flag keeps Choose a layout in guest play');
    assert.equal(await direct.page.evaluate(key => sessionStorage.getItem(key), GUEST_KEY), '1');
    assert.equal(await direct.page.locator('#login-dialog').evaluate(dialog => dialog.matches(':modal')), false);
    assert.deepEqual(direct.errors, []);
    await direct.context.close();

    const blob = sessionBlob();
    const row = roundRow();
    const target = {actor: CHILD_ID, profile: blob.profile};
    const kept = await openContext(browser, url);
    await kept.page.goto(url + '/', {waitUntil: 'domcontentloaded'});
    await kept.page.waitForFunction(() => window.ACCOUNTS);
    await kept.page.evaluate(() => window.ACCOUNTS.ready.catch(() => {}));
    await kept.page.evaluate(async ({sessionKey, targetKey, blob, target, row}) => {
      localStorage.setItem(sessionKey, JSON.stringify(blob));
      sessionStorage.setItem(targetKey, JSON.stringify(target));
      await new Promise((resolve, reject) => {
        const request = indexedDB.open('little-woof-accounts', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('operations', {keyPath: 'id'});
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('operations', 'readwrite');
          tx.onerror = () => reject(tx.error);
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.objectStore('operations').put(row);
        };
      });
    }, {sessionKey: SESSION_KEY, targetKey: TARGET_KEY, blob, target, row});
    const beforeSession = await kept.page.evaluate(key => localStorage.getItem(key), SESSION_KEY);
    const beforeTarget = await kept.page.evaluate(key => sessionStorage.getItem(key), TARGET_KEY);
    const beforeRows = await readRows(kept.page);
    await kept.page.goto(url + '/v4-silk-thread/index.html?mode=guest', {waitUntil: 'domcontentloaded'});
    await kept.page.waitForFunction(() => window.ACCOUNTS && window.ACCOUNTS.guest === true);
    await kept.page.evaluate(() => window.ACCOUNTS.ready.catch(() => {}));
    const after = await kept.page.evaluate(keys => ({
      guestFlag: sessionStorage.getItem(keys.guest),
      guest: window.ACCOUNTS.guest,
      publicSession: window.ACCOUNTS.session,
      snapshotCount: window.ACCOUNTS.snapshot.count,
      storedSession: localStorage.getItem(keys.session),
      storedTarget: sessionStorage.getItem(keys.target)
    }), {guest: GUEST_KEY, session: SESSION_KEY, target: TARGET_KEY});
    const afterRows = await readRows(kept.page);
    console.log('existing session after ?mode=guest:', JSON.stringify({
      guestFlag: after.guestFlag,
      guest: after.guest,
      publicSessionHidden: after.publicSession === null,
      storedSessionUnchanged: after.storedSession === beforeSession,
      storedTargetUnchanged: after.storedTarget === beforeTarget,
      snapshotCount: after.snapshotCount,
      rowCount: afterRows.length,
      rowLetter: afterRows[0] && afterRows[0].payload.letter,
      rowPending: afterRows[0] && afterRows[0].pending
    }));
    assert.equal(after.guestFlag, '1', 'A direct ?mode=guest link must store the guest flag even when a session is already saved');
    assert.equal(after.storedSession, beforeSession, 'A guest link must leave the saved session blob in place');
    assert.equal(after.storedTarget, beforeTarget, 'A guest link must not sign out of the stored session');
    assert.equal(after.publicSession, null, 'Guest play hides the saved session without deleting it');
    assert.equal(after.snapshotCount, 0, 'Guest play does not show the saved rounds');
    assert.deepEqual(afterRows, beforeRows, 'A guest link must not delete IndexedDB round rows');
    assert.deepEqual(beforeRows, [row]);
    await kept.page.goto(url + '/', {waitUntil: 'domcontentloaded'});
    await kept.page.waitForFunction(() => window.ACCOUNTS);
    await kept.page.evaluate(() => window.ACCOUNTS.ready.catch(() => {}));
    assert.equal(await kept.page.evaluate(() => window.ACCOUNTS.guest), true, 'The stored flag keeps this tab a guest after the query is gone');
    assert.equal(await kept.page.evaluate(key => localStorage.getItem(key), SESSION_KEY), beforeSession, 'Leaving the guest link must still keep the saved session');
    assert.deepEqual(await readRows(kept.page), [row], 'Leaving the guest link must still keep the saved round');
    assert.equal(kept.external.some(path => /logout|delete|rpc\/reset/i.test(path)), false, 'The guest link must not call a sign-out or delete request');
    assert.deepEqual(kept.errors, []);
    await kept.context.close();
    console.log('PASS guest link stores letters-with-lucy-guest and leaves a saved session and round in place');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
