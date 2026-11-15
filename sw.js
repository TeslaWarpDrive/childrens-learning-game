'use strict';
/* Letters with Lucy is online-only: it is never available offline.
   Earlier versions installed an offline worker and cached the games. This file
   replaces it so devices that still have that worker clean themselves up:
   it deletes every cache the old worker made, unregisters itself and reloads
   open pages so they load straight from the network. Keep this file deployed
   at the same URL; browsers only retire the old worker by fetching it here. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('letters-') || key.startsWith('little-woof-')).map(key => caches.delete(key)));
    await self.registration.unregister();
    const pages = await self.clients.matchAll({type: 'window'});
    for (const page of pages) { try { page.navigate(page.url); } catch {} }
  })());
});
