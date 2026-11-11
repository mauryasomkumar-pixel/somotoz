// Firebase Cloud Messaging Service Worker for Somotoz AI Suite
/* eslint-disable no-undef */

// Give the service worker access to Firebase Messaging.
// Note that you can also load any scripts needed here.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Somotoz AI', body: event.data.text() };
    }
  }

  const title = data.notification?.title || data.title || 'Somotoz Alert';
  const options = {
    body: data.notification?.body || data.body || 'You have a new update in Somotoz.',
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: data.data || { url: '/' },
    actions: data.actions || [
      { action: 'open', title: 'Open Somotoz' }
    ],
    tag: data.tag || 'somotoz-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click to focus or open the chat / call
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
