'use strict';
// Retirement worker for devices that installed the former offline version.
// Keep this URL available so those registrations can update and remove themselves.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const keys = await caches.keys();
    const owned = keys.filter(key => key.startsWith('little-woof-') || key.startsWith('letters-with-lucy-') || key === 'letters-offline-clients');
    await Promise.all(owned.map(key => caches.delete(key)));
    await self.registration.unregister();
  })());
});
