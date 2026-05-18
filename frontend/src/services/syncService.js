/**
 * Offline Mode & Sync Service
 * Phase 5.4 - Advanced Features
 *
 * Gère:
 * - Détection online/offline
 * - IndexedDB pour cache complet
 * - Auto-sync quand reconnecté
 * - Queue de requêtes en attente
 */

/**
 * Service de synchronisation
 */
export class SyncService {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.pendingRequests = [];
    this.syncing = false;

    this.init();
  }

  /**
   * Initialiser le service
   */
  async init() {
    await this.setupIndexedDB();
    this.setupEventListeners();
  }

  /**
   * Configurer IndexedDB
   */
  async setupIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('immo2000-sync', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[SyncService] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store pour les requêtes en attente
        if (!db.objectStoreNames.contains('pendingRequests')) {
          const store = db.createObjectStore('pendingRequests', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store pour les données cachées
        if (!db.objectStoreNames.contains('cachedData')) {
          const store = db.createObjectStore('cachedData', { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store pour les métadonnées
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      };
    });
  }

  /**
   * Écouter les changements de connexion
   */
  setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('[SyncService] Back online!');
      this.isOnline = true;
      this.sync();
    });

    window.addEventListener('offline', () => {
      console.log('[SyncService] Offline!');
      this.isOnline = false;
    });
  }

  /**
   * Intercepter une requête
   * Si offline: l'enqueuer
   * Si online: l'envoyer normalement
   */
  async request(method, url, data = null, options = {}) {
    const request = {
      method,
      url,
      data,
      timestamp: Date.now(),
      retries: 0,
      options,
    };

    if (!this.isOnline) {
      console.log('[SyncService] Offline - enqueue request:', url);
      await this.addPendingRequest(request);
      return {
        cached: true,
        offline: true,
        pending: true,
      };
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : null,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();

      // Cacher la réponse
      await this.cacheData(url, json);

      return json;
    } catch (error) {
      console.error('[SyncService] Request failed:', error);

      // Essayer de retourner du cache
      const cached = await this.getCachedData(url);
      if (cached) {
        console.log('[SyncService] Returning cached data');
        return {
          ...cached,
          cached: true,
          fromCache: true,
        };
      }

      throw error;
    }
  }

  /**
   * Ajouter une requête en attente
   */
  async addPendingRequest(request) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(['pendingRequests'], 'readwrite');
      const store = txn.objectStore('pendingRequests');
      const req = store.add(request);

      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        console.log('[SyncService] Request queued:', req.result);
        resolve(req.result);
      };
    });
  }

  /**
   * Récupérer les requêtes en attente
   */
  async getPendingRequests() {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(['pendingRequests'], 'readonly');
      const store = txn.objectStore('pendingRequests');
      const req = store.getAll();

      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        resolve(req.result);
      };
    });
  }

  /**
   * Supprimer une requête en attente
   */
  async removePendingRequest(id) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(['pendingRequests'], 'readwrite');
      const store = txn.objectStore('pendingRequests');
      const req = store.delete(id);

      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        console.log('[SyncService] Request removed:', id);
        resolve();
      };
    });
  }

  /**
   * Synchroniser les requêtes en attente
   */
  async sync() {
    if (this.syncing || !this.isOnline) return;

    this.syncing = true;

    try {
      const pending = await this.getPendingRequests();
      console.log(`[SyncService] Syncing ${pending.length} requests`);

      for (const request of pending) {
        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: {
              'Content-Type': 'application/json',
              ...request.options.headers,
            },
            body: request.data ? JSON.stringify(request.data) : null,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          // Succès: supprimer de la queue
          await this.removePendingRequest(request.id);

          // Notifier
          window.dispatchEvent(
            new CustomEvent('syncSuccess', {
              detail: { url: request.url },
            })
          );
        } catch (error) {
          console.error('[SyncService] Sync failed:', error);

          // Retirer après 3 essais
          if (request.retries >= 3) {
            await this.removePendingRequest(request.id);

            window.dispatchEvent(
              new CustomEvent('syncFailed', {
                detail: { url: request.url, error: error.message },
              })
            );
          }
        }
      }
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Cacher des données
   */
  async cacheData(url, data) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(['cachedData'], 'readwrite');
      const store = txn.objectStore('cachedData');
      const req = store.put({
        url,
        data,
        timestamp: Date.now(),
      });

      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  /**
   * Récupérer les données cachées
   */
  async getCachedData(url) {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(['cachedData'], 'readonly');
      const store = txn.objectStore('cachedData');
      const req = store.get(url);

      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        resolve(req.result?.data || null);
      };
    });
  }

  /**
   * Vider le cache
   */
  async clearCache() {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(['cachedData'], 'readwrite');
      const store = txn.objectStore('cachedData');
      const req = store.clear();

      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        console.log('[SyncService] Cache cleared');
        resolve();
      };
    });
  }
}

// Instance globale
let syncService = null;

/**
 * Obtenir l'instance du SyncService
 */
export function getSyncService() {
  if (!syncService) {
    syncService = new SyncService();
  }
  return syncService;
}

/**
 * Hook React pour le mode offline
 */
export function useOfflineMode() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [pendingCount, setPendingCount] = React.useState(0);
  const sync = getSyncService();

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sync.sync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleSyncSuccess = () => {
      setPendingCount((prev) => Math.max(0, prev - 1));
    };

    const handleSyncFailed = () => {
      // Laisser le count tel quel
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('syncSuccess', handleSyncSuccess);
    window.addEventListener('syncFailed', handleSyncFailed);

    // Compter les requêtes en attente
    sync.getPendingRequests().then((requests) => {
      setPendingCount(requests.length);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('syncSuccess', handleSyncSuccess);
      window.removeEventListener('syncFailed', handleSyncFailed);
    };
  }, []);

  return {
    isOnline,
    pendingCount,
    sync: () => sync.sync(),
  };
}
