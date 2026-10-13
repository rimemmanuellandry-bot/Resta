// resta-sw.js - Service Worker Resta pour les notifications dans la barre du téléphone

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Écoute du clic sur la notification système dans la barre d'état du téléphone
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlCible = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Si une fenêtre Resta est déjà ouverte, l'amener au premier plan et naviguer
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlCible);
          }
          return client.focus();
        }
      }
      // 2. Sinon ouvrir une nouvelle fenêtre
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlCible);
      }
    })
  );
});

// Écoute des événements Push pour compatibilité Web Push
self.addEventListener('push', (event) => {
  let data = { title: 'Resta', body: 'Nouveau message reçu', url: '/' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'resta-notification',
    renotify: true,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Resta', options)
  );
});
