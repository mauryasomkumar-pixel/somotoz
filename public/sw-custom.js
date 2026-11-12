/**
 * Somotoz Custom Service Worker Extension
 * Handles Background Sync, Offline Journal Queue triggers, and Network Recovery
 */

// Listen for Background Sync events (Chrome/Android/Edge)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-journal-entries' || event.tag === 'journal-sync-queue') {
    event.waitUntil(notifyClientsToSync('background-sync'));
  }
});

// Periodic background sync if supported and permitted
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-journal-sync') {
    event.waitUntil(notifyClientsToSync('periodic-sync'));
  }
});

// Communication channel with React window clients
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'TRIGGER_BACKGROUND_SYNC') {
    event.waitUntil(notifyClientsToSync('client-request'));
  }
});

async function notifyClientsToSync(source) {
  try {
    const clients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window',
    });

    for (const client of clients) {
      client.postMessage({
        type: 'TRIGGER_OFFLINE_SYNC',
        source,
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    console.error('[SW] Failed to notify clients for offline sync:', err);
  }
}
