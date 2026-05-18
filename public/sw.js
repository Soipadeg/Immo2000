/**
 * Service Worker pour Push Notifications
 * Phase 5.2 - Advanced Features
 *
 * Gère:
 * - Notifications même app fermée
 * - Caching des pages
 * - Installation/activation
 */

const CACHE_VERSION = 'immo2000-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/logo.png',
];

// Install: cacher les assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );

  // Skip waiting (activer immédiatement)
  self.skipWaiting();
});

// Activate: nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_VERSION)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );

  // Claim clients immédiatement
  self.clients.claim();
});

// Fetch: stratégie Network-First pour API, Cache-First pour assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network first avec fallback au cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone et cache la réponse réussie
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Si offline, retourner le cache
          console.log('[SW] Network error, returning cached response for:', url.pathname);
          return caches.match(request);
        })
    );
  }
  // Assets: cache first avec fallback au network
  else {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((response) => {
            // Cache les nouvelles réponses
            if (response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_VERSION).then((cache) => {
                cache.put(request, clone);
              });
            }
            return response;
          })
        );
      })
    );
  }
});

// Notification click: ouvrir l'app ou une page spécifique
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  // Récupérer les données de notification
  const data = event.notification.data || {};
  const url = data.url || '/';

  // Chercher si la fenêtre est déjà ouverte
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Si la fenêtre est ouverte, la focus
        for (let client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background Sync: syncer les messages en attente quand reconnecté
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-pending-messages') {
    event.waitUntil(syncPendingMessages());
  }
});

// Synchroniser les messages en attente
async function syncPendingMessages() {
  try {
    // Récupérer les messages en attente depuis IndexedDB
    const db = await openDB('immo2000');
    const pendingMessages = await db.getAll('pendingMessages');

    // Envoyer chaque message
    for (const msg of pendingMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify(msg),
        });

        if (response.ok) {
          // Supprimer de pending après succès
          await db.delete('pendingMessages', msg.id);

          // Notifier le client
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'MESSAGE_SYNCED',
                message: msg,
              });
            });
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// Helper: récupérer le token d'authentification
async function getAuthToken() {
  const db = await openDB('immo2000');
  const auth = await db.get('auth', 'token');
  return auth?.token || null;
}

// Helper: ouvrir IndexedDB
function openDB(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(new DBWrapper(request.result));

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth');
      }
    };
  });
}

// Wrapper pour faire fonctionner IndexedDB avec async/await
class DBWrapper {
  constructor(db) {
    this.db = db;
  }

  get(storeName, key) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readonly');
      const store = txn.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readonly');
      const store = txn.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  add(storeName, value) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readwrite');
      const store = txn.objectStore(storeName);
      const request = store.add(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readwrite');
      const store = txn.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
