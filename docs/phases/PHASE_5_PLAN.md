# Phase 5 : Advanced Features

**Objectif**: Ajouter des fonctionnalités avancées pour une meilleure UX
**Priorité**: 🟠 MOYENNE (Après Phase 4 optimisation)
**Durée**: 4-5 heures pour implémentation complète

---

## 📊 Status Actuel

```
✅ Phase 1-4: COMPLÈTES
✅ Frontend: Zustand, API centralisée, Forms, Code splitting
✅ Backend: Structure, Performance, Indexes, Cache, Rate limiting
⏳ Phase 5: À démarrer
```

---

## 🎯 Phase 5 : 4 Sous-Tâches

### **Phase 5.1 : WebSockets pour Real-Time** (1 heure)
**Objectif**: Implémenter la communication bidirectionnelle en temps réel

#### Cas d'usage
```
Messages:
- Utilisateur A écrit un message
- Utilisateur B le reçoit INSTANTANÉMENT (pas de polling)

Notifications:
- Admin publie une annonce
- Utilisateurs intéressés reçoivent notification en temps réel

Visites:
- Vendeur confirme une visite
- Acheteur le sait immédiatement
```

#### Architecture
```
Client (Frontend):
├── WebSocket connection au backend
├── Listen pour "message:new", "notification:new", etc.
└── Envoyer messages via WebSocket

Server (Backend):
├── Flask-SocketIO pour WebSocket
├── Event handlers pour les messages
├── Broadcast à tous les utilisateurs affectés
└── Fallback sur HTTP polling si WebSocket échoue
```

#### Implémentation
```python
# backend/src/app.py
from flask_socketio import SocketIO, emit, join_room

socketio = SocketIO(app)

@socketio.on('message:send')
def handle_send_message(data):
    # Sauvegarder en DB
    msg = Message.create(...)

    # Envoyer en temps réel
    emit('message:new', {
        'id': msg.id,
        'content': msg.content,
        'sender': msg.sender.email,
    }, room=f"conversation_{msg.conversation_id}")
```

#### Frontend
```javascript
// src/hooks/useWebSocket.js
const { socket, connected } = useWebSocket();

// Envoyer message
socket.emit('message:send', { content: 'Bonjour!' });

// Écouter nouveaux messages
socket.on('message:new', (msg) => {
  useNotificationStore().showSuccess('Nouveau message!');
  // Mettre à jour UI
});
```

#### Gains
- Pas de latence (vs polling toutes les 5s)
- 60-80% moins de requêtes HTTP
- Meilleure UX (instantanée)

---

### **Phase 5.2 : Push Notifications** (1 heure)
**Objectif**: Alerter les utilisateurs même hors ligne

#### Cas d'usage
```
Utilisateur reçoit une notification même s'il n'a pas le navigateur ouvert!
- Nouvelle offre sur son annonce
- Rendez-vous confirmé
- Message reçu
- Alerte prix
```

#### Architecture
```
Service Worker:
├── Enregistré au premier visite
├── Stocke les notifications en cache
└── Affiche notification même offline

Backend:
├── Envoie une notification au Service Worker
├── Firebase Cloud Messaging (FCM) ou similaire
└── Platform notifications (web push)

Client:
├── Demande permission pour les notifications
├── Reçoit les notifications du système
└── Peut cliquer pour ouvrir l'app
```

#### Implémentation
```javascript
// src/utils/notifications.js
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.register('/sw.js');

    // Demander permission
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
}

// Envoyer notification
export function sendNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        icon: '/logo.png',
        badge: '/badge.png',
        tag: 'immo2000',
        ...options,
      });
    });
  }
}
```

#### Backend
```python
# backend/src/services/push_service.py
class PushNotificationService:
    def send_notification(self, user_id, title, message, data=None):
        # Envoyer via FCM ou Web Push
        # Ou broadcast via WebSocket si connecté
        pass
```

#### Gains
- Utilisateurs alertés 24/7
- Engagement +40-50%
- Campagnes marketing possibles

---

### **Phase 5.3 : File Upload Optimization** (1.5 heures)
**Objectif**: Uploads rapides et sécurisés des photos/documents

#### Cas d'usage
```
Créer une annonce:
1. Uploader 10 photos (10 MB total)
2. Optionnel: Upload documents (contrats, etc.)

Processus:
├── Validation côté client (size, type)
├── Compression des images (resize)
├── Upload progressif (afficher barre de progression)
├── Vérification de virus/malware
└── Générer thumbnails
```

#### Architecture
```
Client:
├── Drag-drop zone
├── File validation (size, extension)
├── Image compression (sharp in browser)
└── Chunked upload (pour gros fichiers)

Server:
├── Virus scan (ClamAV ou similar)
├── Image optimization (resize, webp)
├── Generate thumbnails
├── Store in S3/CDN
└── Database: store URLs
```

#### Implémentation
```javascript
// src/components/FileUploader.jsx
export function FileUploader({ onUpload }) {
  const handleDrop = async (files) => {
    for (const file of files) {
      // Validation
      if (file.size > 50 * 1024 * 1024) { // 50 MB
        showError('Fichier trop gros');
        continue;
      }

      // Compression (images)
      let toUpload = file;
      if (file.type.startsWith('image/')) {
        toUpload = await compressImage(file);
      }

      // Upload avec progression
      const formData = new FormData();
      formData.append('file', toUpload);

      try {
        const response = await apiClient.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const percent = (e.loaded / e.total) * 100;
            onProgress(percent); // Afficher barre
          },
        });

        onUpload(response.data.url);
      } catch (error) {
        showError('Upload échoué');
      }
    }
  };

  return (
    <DropZone onDrop={handleDrop}>
      <p>Drag photos ici (5 MB max)</p>
    </DropZone>
  );
}
```

#### Backend
```python
# backend/src/routes/uploads.py
@app.route('/uploads', methods=['POST'])
@token_required
def upload_file(current_user):
    file = request.files['file']

    # Validation
    if file.size > 50 * 1024 * 1024:
        return {'error': 'File too large'}, 400

    # Scan virus
    if scan_virus(file):
        return {'error': 'Virus detected'}, 400

    # Optimize image
    filename = secure_filename(file.filename)
    path = f"uploads/{current_user.id}/{filename}"

    if file.content_type.startswith('image/'):
        file = optimize_image(file)  # Resize, compress

    # Upload to S3
    url = upload_to_s3(file, path)

    # Generate thumbnail
    if file.content_type.startswith('image/'):
        thumbnail_url = generate_thumbnail(url)

    return {
        'url': url,
        'thumbnail': thumbnail_url if file.content_type.startswith('image/') else None,
    }
```

#### Gains
- Uploads 5-10x plus rapides (compression)
- Meilleure UX (progress bar)
- Sécurité: Virus scan
- Performance: Images optimisées

---

### **Phase 5.4 : Service Workers & Offline Mode** (1 heure)
**Objectif**: Accès offline + caching avancé

#### Cas d'usage
```
Utilisateur sans internet:
- Peut voir les pages cachées
- Peut voir les messages précédents
- Peut rédiger les messages (envoie au reconnect)
- Notification "Mode hors ligne"
```

#### Architecture
```
Service Worker:
├── Cache-first strategy pour assets
├── Network-first pour API calls
├── Enqueue requests offline
└── Sync quand reconnecté

IndexedDB:
├── Store messages en attente
├── Store pages cachées
├── Sync avec backend
└── Auto-sync quand connexion revient
```

#### Implémentation
```javascript
// public/sw.js
const CACHE_NAME = 'immo2000-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
];

// Install - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // API calls: network first
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone et cache la réponse
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          // Si offline, retourner le cache
          return caches.match(event.request);
        })
    );
  } else {
    // Assets: cache first
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Sync - sync quand reconnecté
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});
```

#### Frontend
```javascript
// src/hooks/useOfflineMode.js
export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}

// Utiliser
function MessageForm() {
  const { isOnline } = useOfflineMode();

  const handleSend = async (data) => {
    if (!isOnline) {
      // Enqueuer offline
      await db.pendingMessages.add(data);
      showSuccess('Message enregistré, sera envoyé quand connecté');
      return;
    }

    // Envoyer maintenant
    await sendMessage(data);
  };
}
```

#### Gains
- Accès offline
- Meilleure performance (cached)
- Auto-sync transparent
- UX excellente même en 2G

---

## 📦 Dépendances à Ajouter

```json
{
  "dependencies": {
    "socket.io-client": "^4.7.0",
    "workbox-window": "^7.0.0"
  },
  "devDependencies": {
    "workbox-build": "^7.0.0"
  }
}
```

```
Backend:
- flask-socketio
- python-socketio
- python-engineio
```

---

## 📈 Métriques de Succès

### Avant Phase 5
```
Message latency: 2-5s (polling)
Push notifications: Non
Offline mode: Non
Upload speed: 1-2 MB/s
```

### Après Phase 5
```
Message latency: <100ms (WebSocket)
Push notifications: ✅ Instant
Offline mode: ✅ Full cache
Upload speed: 10-20 MB/s (compression)
```

---

## 🚀 Git Strategy

Chaque sous-phase = 1 commit:

```bash
git add backend/src/services/websocket.py frontend/src/hooks/useWebSocket.js
git commit -m "Advanced 5.1: Implémenter WebSockets pour real-time"

git add backend/src/services/push.py public/sw.js
git commit -m "Advanced 5.2: Push notifications avec Service Workers"

git add backend/src/routes/uploads.py frontend/src/components/FileUploader.jsx
git commit -m "Advanced 5.3: File upload optimization + compression"

git add public/sw.js frontend/src/hooks/useOfflineMode.js
git commit -m "Advanced 5.4: Service Workers + offline mode"
```

---

## 🎯 Prochaines Étapes Après Phase 5

**Phase 6**: Mobile App (React Native)
  ├─ React Native setup
  ├─ API bridge layer
  ├─ Native UI components
  └─ iOS/Android builds

**Phase 7**: Analytics & Monitoring
  ├─ Sentry for error tracking
  ├─ Analytics tracking
  ├─ Performance monitoring
  └─ Alerting system

---

## 📝 Status de Commencage

- [ ] 5.1: WebSockets (Backend + Frontend)
- [ ] 5.2: Push Notifications (Service Worker + Backend)
- [ ] 5.3: File Upload Optimization (Backend + Frontend)
- [ ] 5.4: Offline Mode (Service Worker + IndexedDB)
