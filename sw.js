// TÔAKI Service Worker v2
const CACHE = 'toaki-v1';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('push', function(e) {
  let data = {};
  try { data = e.data.json(); } catch { data = { title: 'TÔAKI 📍', body: e.data?.text() || 'Nova localização!' }; }

  e.waitUntil(self.registration.showNotification(data.title || 'TÔAKI 📍', {
    body: data.body || 'Alguém partilhou a localização contigo!',
    icon: 'https://vicentelivramento-byte.github.io/toaki/icon-192.png',
    badge: 'https://vicentelivramento-byte.github.io/toaki/icon-192.png',
    data: { url: data.url || 'https://vicentelivramento-byte.github.io/toaki/toaki.html' },
    vibrate: [200, 100, 200],
    requireInteraction: true
  }));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  const url = e.notification.data?.url || 'https://vicentelivramento-byte.github.io/toaki/toaki.html';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url === url && 'focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
