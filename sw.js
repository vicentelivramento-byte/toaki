// TÔAKI Service Worker v3 — Firebase FCM
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBaIBG5FSyCS7xqfsCYG54x5dLvx8FMz-Y",
  authDomain: "toaki-b5eb4.firebaseapp.com",
  projectId: "toaki-b5eb4",
  storageBucket: "toaki-b5eb4.firebasestorage.app",
  messagingSenderId: "118921367632",
  appId: "1:118921367632:web:428f86defd0517b2354155"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('TÔAKI push recebido:', payload);
  const data = payload.data || {};
  self.registration.showNotification(data.title || 'TÔAKI 📍', {
    body: data.body || 'Nova localização partilhada!',
    icon: 'https://vicentelivramento-byte.github.io/toaki/icon-192.png',
    badge: 'https://vicentelivramento-byte.github.io/toaki/icon-192.png',
    data: { url: data.url || 'https://vicentelivramento-byte.github.io/toaki/toaki.html' },
    vibrate: [200, 100, 200],
    requireInteraction: true
  });
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  const url = e.notification.data?.url || 'https://vicentelivramento-byte.github.io/toaki/toaki.html';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url === url && 'focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
