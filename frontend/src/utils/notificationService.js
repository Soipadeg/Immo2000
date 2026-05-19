/**
 * Service de notifications push
 * Phase 5.2 - Advanced Features
 *
 * Gère:
 * - Enregistrement du Service Worker
 * - Demande de permissions
 * - Affichage des notifications
 * - IndexedDB pour les messages en attente
 */

/**
 * Enregistrer le Service Worker et demander les permissions
 */
export async function initNotifications() {
  try {
    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[Notifications] Service Worker enregistré:', registration);
    }

    // Demander la permission
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('[Notifications] Permission:', permission);
      return permission === 'granted';
    }

    return Notification.permission === 'granted';
  } catch (error) {
    console.error('[Notifications] Erreur initialisation:', error);
    return false;
  }
}

/**
 * Afficher une notification
 * @param {string} title - Titre de la notification
 * @param {object} options - Options (icon, badge, tag, data, etc.)
 */
export async function sendNotification(title, options = {}) {
  try {
    if (Notification.permission !== 'granted') {
      console.warn('[Notifications] Permission refusée');
      return;
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(title, {
        icon: '/logo.png',
        badge: '/badge.png',
        tag: 'immo2000',
        requireInteraction: false,
        ...options,
      });

      console.log('[Notifications] Notification envoyée:', title);
    }
  } catch (error) {
    console.error('[Notifications] Erreur affichage:', error);
  }
}

/**
 * Envoyer une notification avec actions
 * (ex: Accepter/Refuser une offre)
 */
export async function sendNotificationWithActions(title, options = {}) {
  const defaultActions = [
    {
      action: 'open',
      title: 'Ouvrir',
    },
    {
      action: 'close',
      title: 'Fermer',
    },
  ];

  return sendNotification(title, {
    actions: options.actions || defaultActions,
    ...options,
  });
}

/**
 * Gérer les notifications reçues du Service Worker
 */
export function setupNotificationListeners() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'MESSAGE_SYNCED') {
        console.log('[Notifications] Message synced:', event.data.message);
        // Émettre un événement custom
        window.dispatchEvent(
          new CustomEvent('messageSynced', {
            detail: event.data.message,
          })
        );
      }
    });
  }
}

/**
 * Vérifier si les notifications sont supportées
 */
export function isNotificationsSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Obtenir le statut de permission
 */
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// ============================================
// IndexedDB pour les messages en attente
// ============================================

/**
 * Initialiser IndexedDB
 */
export function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('immo2000', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store pour les messages en attente
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id', autoIncrement: true });
      }

      // Store pour l'authentification
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth');
      }

      // Store pour les brouillons
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Ajouter un message en attente (offline)
 */
export async function addPendingMessage(message) {
  try {
    const db = await initIndexedDB();
    const txn = db.transaction(['pendingMessages'], 'readwrite');
    const store = txn.objectStore('pendingMessages');

    return new Promise((resolve, reject) => {
      const request = store.add({
        ...message,
        createdAt: new Date().toISOString(),
        synced: false,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[IndexedDB] Message ajouté à la queue:', request.result);
        resolve(request.result);
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erreur ajout message:', error);
    throw error;
  }
}

/**
 * Récupérer les messages en attente
 */
export async function getPendingMessages() {
  try {
    const db = await initIndexedDB();
    const txn = db.transaction(['pendingMessages'], 'readonly');
    const store = txn.objectStore('pendingMessages');

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[IndexedDB] Messages en attente:', request.result);
        resolve(request.result.filter((m) => !m.synced));
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erreur lecture messages:', error);
    return [];
  }
}

/**
 * Marquer un message comme synced
 */
export async function markMessageSynced(messageId) {
  try {
    const db = await initIndexedDB();
    const txn = db.transaction(['pendingMessages'], 'readwrite');
    const store = txn.objectStore('pendingMessages');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(messageId);

      getRequest.onsuccess = () => {
        const message = getRequest.result;
        if (message) {
          message.synced = true;
          const updateRequest = store.put(message);

          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => {
            console.log('[IndexedDB] Message marqué synced:', messageId);
            resolve();
          };
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('[IndexedDB] Erreur mark synced:', error);
  }
}

/**
 * Supprimer un message en attente
 */
export async function deletePendingMessage(messageId) {
  try {
    const db = await initIndexedDB();
    const txn = db.transaction(['pendingMessages'], 'readwrite');
    const store = txn.objectStore('pendingMessages');

    return new Promise((resolve, reject) => {
      const request = store.delete(messageId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[IndexedDB] Message supprimé:', messageId);
        resolve();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erreur suppression:', error);
  }
}

/**
 * Ajouter un brouillon (draft)
 */
export async function saveDraft(conversationId, content) {
  try {
    const db = await initIndexedDB();
    const txn = db.transaction(['drafts'], 'readwrite');
    const store = txn.objectStore('drafts');

    return new Promise((resolve, reject) => {
      const request = store.put({
        id: `draft_${conversationId}`,
        conversationId,
        content,
        savedAt: new Date().toISOString(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[IndexedDB] Brouillon sauvegardé:', conversationId);
        resolve();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erreur sauvegarde brouillon:', error);
  }
}

/**
 * Récupérer un brouillon
 */
export async function getDraft(conversationId) {
  try {
    const db = await initIndexedDB();
    const txn = db.transaction(['drafts'], 'readonly');
    const store = txn.objectStore('drafts');

    return new Promise((resolve, reject) => {
      const request = store.get(`draft_${conversationId}`);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[IndexedDB] Brouillon récupéré:', conversationId);
        resolve(request.result?.content || null);
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erreur lecture brouillon:', error);
    return null;
  }
}

/**
 * Supprimer un brouillon
 */
export async function deleteDraft(conversationId) {
  try {
    const db = await initIndexedDB();
    const txn = db.transaction(['drafts'], 'readwrite');
    const store = txn.objectStore('drafts');

    return new Promise((resolve, reject) => {
      const request = store.delete(`draft_${conversationId}`);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[IndexedDB] Brouillon supprimé:', conversationId);
        resolve();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erreur suppression brouillon:', error);
  }
}

/**
 * Vérifier si online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Écouter les changements de connexion
 */
export function onConnectionChange(callback) {
  window.addEventListener('online', () => {
    console.log('[Network] Online');
    callback(true);
  });

  window.addEventListener('offline', () => {
    console.log('[Network] Offline');
    callback(false);
  });
}
