// TÔAKI Service Worker v6
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('push', function(e) {
  let data = {};
  try { data = e.data.json(); } catch { data = {title:'TOAKI', body: e.data?.text()||'Nova localizacao!'}; }
  e.waitUntil(self.registration.showNotification(data.title||'TOAKI', {
    body: data.body||'Nova localizacao!',
    icon: 'https://toaki.pt/icon-192.png',
    data: {url: data.url||'https://toaki.pt/toaki.html'},
    vibrate: [200,100,200],
    requireInteraction: true
  }));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  const url = e.notification.data?.url||'https://toaki.pt/toaki.html';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
    for (const c of list) { if (c.url===url && 'focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
