# API Centralisée - Phase 4.2

## 📚 Guide d'Utilisation

Cette phase crée une couche API centralisée avec interceptors améliorés, retry logic, et meilleur error handling.

### Structure

```
frontend/src/services/api/
├── client.js        ← Client axios avec interceptors
├── auth.js          ← Authentification
├── listings.js      ← Annonces (listings)
├── messages.js      ← Messages, conversations, notifications
├── offers.js        ← Offres, visites, rendez-vous
└── index.js         ← Exports tout
```

### Utilisation

#### Avant (API éparpillée)
```javascript
// D'une centaine d'endroits différents...
const response = await axios.get('/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### Après (API centralisée)
```javascript
import { authApi } from '../services/api';

const response = await authApi.me();
```

### Modules API

#### **authApi** - Authentification
```javascript
import { authApi } from '../services/api';

// Connexion
const { data } = await authApi.login(email, password);

// Récupérer l'utilisateur actuel
const { data } = await authApi.me();

// Déconnexion
await authApi.logout();

// Réinitialiser le mot de passe
await authApi.requestPasswordReset(email);
```

#### **listingsApi** - Annonces
```javascript
import { listingsApi } from '../services/api';

// Lister les annonces de l'utilisateur
const { data } = await listingsApi.listUserListings(skip, limit, filters);

// Créer une annonce
const { data } = await listingsApi.create(annonceData);

// Récupérer une annonce
const { data } = await listingsApi.getById(id);

// Publier une annonce
const { data } = await listingsApi.publish(id);

// Chercher des annonces
const { data } = await listingsApi.search('paris', { budget_max: 500000 });
```

#### **messagesApi** - Messages
```javascript
import { messagesApi, conversationsApi } from '../services/api';

// Lister les messages d'une conversation
const { data } = await messagesApi.listConversation(conversationId);

// Envoyer un message
const { data } = await messagesApi.send(conversationId, 'Bonjour!');

// Lister les conversations
const { data } = await conversationsApi.list();

// Créer une conversation
const { data } = await conversationsApi.create(userId);
```

#### **offersApi** - Offres
```javascript
import { offersApi, visitsApi, appointmentsApi } from '../services/api';

// Faire une offre
const { data } = await offersApi.create(annonceId, offerData);

// Accepter une offre
await offersApi.accept(offerId);

// Créer une visite
const { data } = await visitsApi.create(visitData);

// Créer un rendez-vous
const { data } = await appointmentsApi.create(appointmentData);
```

### Interceptors Automatiques

#### 1. **Authentication Interceptor**
Ajoute automatiquement le JWT token à chaque requête:

```javascript
// ✅ Automatique! Pas besoin de le faire manuellement
headers: { Authorization: 'Bearer <token>' }

// Ou en mode dev
headers: { 'X-Dev-Role': 'admin' }
```

#### 2. **Retry Logic**
Réessaie automatiquement les requêtes échouées (jusqu'à 3 fois) avec exponential backoff:

```javascript
// 1ère tentative échoue → attend 1s → réessaie
// 2e tentative échoue → attend 2s → réessaie
// 3e tentative échoue → attend 4s → réessaie
// 4e tentative échoue → erreur finale
```

Situations de retry:
- Erreurs réseau
- Erreurs serveur (5xx)
- ❌ Pas de retry pour: 4xx (sauf 5xx), 401, 403

#### 3. **Error Handling**
Gère automatiquement les erreurs courantes:

```javascript
try {
  const { data } = await authApi.login(email, password);
} catch (error) {
  // 401 - Token expiré
  if (error.response?.status === 401) {
    // Déconnecter l'utilisateur
  }

  // 403 - Accès refusé
  if (error.response?.status === 403) {
    // Toast: "Accès refusé"
  }

  // Erreur réseau
  if (!error.response) {
    // Toast: "Erreur de connexion"
  }
}
```

### Gestion des Erreurs

```javascript
import { listingsApi } from '../services/api';
import { useNotificationStore } from '../store';

function MyComponent() {
  const { showError } = useNotificationStore();

  const handleCreate = async (data) => {
    try {
      const { data: listing } = await listingsApi.create(data);
      console.log('Created:', listing);
    } catch (error) {
      // Message d'erreur personnalisé
      const message = error.response?.data?.message || 'Erreur lors de la création';
      showError(message);
    }
  };
}
```

### Utiliser avec Zustand Store

Combiner API + Zustand pour la gestion d'état:

```javascript
import { create } from 'zustand';
import { listingsApi } from '../services/api';

export const useListingStore = create((set) => ({
  listings: [],
  loading: false,

  fetchListings: async (skip = 0, limit = 20) => {
    set({ loading: true });
    try {
      const { data } = await listingsApi.listUserListings(skip, limit);
      set({ listings: data.listings });
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
```

### Migration depuis api.js

L'ancien `api.js` reste pour compatibilité. Migration progressive:

**Avant:**
```javascript
import { annoncesApi } from '../services/api';
const { data } = await annoncesApi.getById(id);
```

**Après:**
```javascript
import { listingsApi } from '../services/api';
const { data } = await listingsApi.getById(id);
```

### Configuration

Variables d'environnement (.env):

```
VITE_API_URL=http://localhost:5000/api/v1
VITE_API_TIMEOUT=10000
```

### Debugging

#### Afficher les logs des requêtes
```javascript
// Dans client.js ou index.js
apiClient.interceptors.request.use((config) => {
  console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
  return config;
});
```

#### Inspecter les réponses
```javascript
apiClient.interceptors.response.use((response) => {
  console.log(`[API Response] ${response.status} ${response.config.url}`);
  return response;
});
```

### Tests

#### Tester une API call
```javascript
import { authApi } from '../services/api';
import axios from 'axios';

jest.mock('axios');

test('login calls correct endpoint', async () => {
  axios.post.mockResolvedValue({
    data: { token: 'test-token' }
  });

  const result = await authApi.login('user@test.com', 'password');
  expect(result.data.token).toBe('test-token');
});
```

#### Tester avec erreurs
```javascript
test('handles 401 errors', async () => {
  const error = new Error('Unauthorized');
  error.response = { status: 401 };
  axios.post.mockRejectedValue(error);

  await expect(authApi.login('user@test.com', 'wrong'))
    .rejects.toThrow();
});
```

### Best Practices

1. **Toujours importer des modules spécifiques:**
   ```javascript
   ✅ import { authApi } from '../services/api';
   ❌ import * as api from '../services/api';
   ```

2. **Utiliser async/await:**
   ```javascript
   ✅ const { data } = await authApi.me();
   ❌ authApi.me().then(res => { ... });
   ```

3. **Gérer les erreurs:**
   ```javascript
   try {
     await authApi.login(email, password);
   } catch (error) {
     showError(error.response?.data?.message || 'Unknown error');
   }
   ```

4. **Utiliser avec Zustand:**
   ```javascript
   const store = create((set) => ({
     fetchData: async () => {
       const { data } = await someApi.get();
       set({ data });
     }
   }));
   ```

### Checklist de Migration

Pendant la migration vers la nouvelle API:

- [ ] Remplacer les imports `authApi` d'où ils proviennent
- [ ] Remplacer les imports `annoncesApi` par `listingsApi`
- [ ] Vérifier les noms de fonctions (create vs post, delete vs remove)
- [ ] Tester chaque endpoint migré
- [ ] Vérifier que les interceptors fonctionnent (auth headers, retry)
- [ ] Mettre à jour les composants utilisant anciennes API
- [ ] Supprimer les anciennes API calls quand tout fonctionne

### Prochaines Étapes

**Phase 4.3:** React Hook Form
- Ajouter validation côté client
- Formulaires typés avec Zod/Yup
- Error handling amélioré

**Phase 4.4:** Code Splitting
- Lazy load les routes
- Optimiser le bundle size
- Vérifier les performances
