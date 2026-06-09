# 🚀 Mode Développement - Immo2000

**Sans authentification - Accès direct à 4 rôles différents**

Système de développement qui contourne complètement l'authentification JWT pour permettre une itération rapide sur l'interface utilisateur sans avoir à gérer les logins.

---

## ✨ Accès Rapide aux Rôles

### 4 URLs de développement directes:

| Rôle | URL | Accès |
|------|-----|-------|
| 👤 **Visiteur** | [http://localhost:3000/dev/visiteur](http://localhost:3000/dev/visiteur) | Interface publique |
| 👨‍💼 **Utilisateur** | [http://localhost:3000/dev/user](http://localhost:3000/dev/user) | Dashboard utilisateur |
| 👨‍⚖️ **Notaire** | [http://localhost:3000/dev/notaire](http://localhost:3000/dev/notaire) | Dashboard notaire |
| 👮 **Admin** | [http://localhost:3000/dev/admin](http://localhost:3000/dev/admin) | Panel administrateur complet |

**Chaque URL initialise automatiquement le mode dev avec le rôle correspondant.**

---

## 🛠️ Infrastructure Technique

### Backend
```
✅ .env: DEV_MODE=true
   - Active le bypass d'authentification
   - Permet le header X-Dev-Role au lieu de JWT

✅ src/auth/decorators.py
   - @token_required reconnaît le header X-Dev-Role
   - Crée automatiquement un utilisateur mock avec le rôle demandé
   - Structure: { user_id: 999, email: "dev-{role}@immo2000.dev", role: "{role}" }

✅ src/routes/dev_auth.py (NOUVEAU)
   - GET /dev/auth/status → Confirm DEV_MODE active
   - GET /dev/auth/tokens → Liste les 4 URLs dev
   - GET /dev/auth/{role} → Valide le rôle
```

### Frontend
```
✅ src/hooks/useAuth.js (MODIFIÉ)
   - initDevMode(role) → Configure le mode dev
   - localStorage.dev_role → Stocke le rôle actuel
   - localStorage.dev_mode → Flag mode dev actif

✅ src/components/DevRoleInitializer.jsx (NOUVEAU)
   - Bootstrap automatique au chargement de /dev/{role}
   - Affiche spinner "🚀 Initialisation du mode..."
   - Redirige vers la page appropriée après 800ms

✅ src/services/api.js (MODIFIÉ)
   - Axios interceptor ajoute header X-Dev-Role
   - Bypass automatique du Bearer token en mode dev

✅ src/components/ProtectedRoute.jsx (MODIFIÉ)
   - Accepte les requêtes avec localStorage.dev_role
   - Pas de vérification JWT en mode dev
```

---

## 📊 Flow Technique

### Initialisation (Visiteur)
```
1. User clique http://localhost:3000/dev/visiteur
2. App route → /dev/visiteur
3. DevRoleInitializer component mount
   - Appelle initDevMode('visiteur')
   - localStorage.dev_role = 'visiteur'
   - localStorage.dev_mode = 'true'
4. Spinner affiche: "🚀 Initialisation du mode VISITEUR..."
5. setTimeout 800ms
6. navigate('/') → Homepage
```

### API Request (Admin)
```
1. AdminHomePage mount
2. checkAuth() détecte localStorage.dev_role = 'admin'
3. isDevMode = true
4. loadDashboard() appelle dashboardApi.getSummary()
5. Axios interceptor vérifie localStorage.dev_role
6. Ajoute header: X-Dev-Role: admin
7. Backend @token_required decorator:
   - Détecte X-Dev-Role header
   - DEV_MODE=true → crée mock user
   - Role = 'admin'
8. loadDashboard() retourne données mock
9. AdminHomePage affiche le panel complet
```

---

## 🎯 Cas d'Utilisation

### Pour le Frontend Dev
✅ Tester les interfaces sans JWT
✅ Accéder aux pages protégées immédiatement
✅ Vérifier les permissions par rôle
✅ Itérer rapidement sur le design

### Pour l'Intégration Backend
✅ Vérifier que les endpoints acceptent X-Dev-Role
✅ Tester les décorateurs @admin_required, @role_required
✅ Valider les mock users créés correctement

### Pour les Tests E2E
✅ Initialiser des états utilisateur spécifiques
✅ Tester des flows complets sans seed complexes
✅ Vérifier les transitions entre rôles

---

## ⚙️ Configuration

### Activation (Backend)
```bash
# Dans .env
DEV_MODE=true

# Redémarrer le backend pour charger la var d'env
docker-compose restart backend
```

### Désactivation (Backend)
```bash
# Dans .env
DEV_MODE=false

# Redémarrer
docker-compose restart backend
```

### Frontend (Automatique)
Le frontend détecte le mode dev via localStorage:
- Pas d'activation manuelle nécessaire
- Initialisation automatique via `/dev/{role}`
- Clear avec `localStorage.removeItem('dev_role')`

---

## 🔍 Données Mock

### Utilisateur Mock Créé
```javascript
{
  user_id: 999,
  email: "dev-{role}@immo2000.dev",
  role: "{role}",        // visiteur, user, admin, notaire
  nom: "Dev",
  prenom: "{ROLE}",
  exp: null              // Pas d'expiration
}
```

### Dashboard Mock (Admin)
```javascript
{
  total_users: 1250,
  active_users: 980,
  users_by_role: { admin: 5, notaire: 45, user: 900, acheteur: 300 },
  total_listings: 3456,
  active_listings: 2876,
  new_listings_7d: 234,
  new_listings_30d: 845,
  new_users_7d: 56,
  new_users_30d: 234,
  active_users_7d: 678,
  never_logged_in: 120
}
```

---

## 🚦 Restrictions & Limitations

| Aspect | Comportement |
|--------|------------|
| **Authentification** | ❌ Désactivée complètement en mode dev |
| **JWT Tokens** | ❌ Non requis, ignorés |
| **CORS** | ✅ Fonctionne normalement |
| **Sessions** | ✅ localStorage maintient l'état |
| **Rôles** | ✅ Tous les 4 rôles supportés |
| **API Backend** | ✅ Endpoints fonctionnent si DEV_MODE=true |
| **Production** | ❌ DEV_MODE=false requis absolument |

⚠️ **IMPORTANT**: Ne jamais déployer en production avec `DEV_MODE=true`

---

## 🧪 Tests

### Vérifier que DEV_MODE est actif
```bash
curl http://localhost:5000/dev/auth/status
# Réponse: { "dev_mode": true }
```

### Tester X-Dev-Role header
```bash
curl -H "X-Dev-Role: admin" http://localhost:5000/api/v1/admin/dashboard
# Doit retourner des données sans JWT
```

### Vérifier localStorage (Browser Console)
```javascript
localStorage.dev_role     // Doit être: visiteur, user, admin, ou notaire
localStorage.dev_mode     // Doit être: "true"
```

---

## 📝 Déboguer le Mode Dev

### Page affiche spinner puis redirection
- Vérifier que `DEV_MODE=true` dans backend `.env`
- Vérifier que container backend a été redémarré
- Vérifier localStorage: `localStorage.dev_role` doit exister

### API retourne 401
- Backend logs: chercher "X-Dev-Role" (doit être présent)
- Vérifier que interceptor Axios est chargé
- Vérifier que localStorage.dev_role est défini avant l'appel API

### Utilisateur mock ne s'affiche pas
- Vérifier que @token_required détecte le header
- Backend logs doivent montrer: "Dev mode detected"
- Mock user id est toujours 999

### Changement de rôle
1. Visiter nouvelle URL /dev/{nouveau_role}
2. localStorage.dev_role sera remplacé
3. Axios interceptor utilisera le nouveau rôle
4. Recommencer depuis zéro (pas de cache persistant)

---

## 🔄 Workflow Recommandé

```
1. Démarrer les services
   $ docker-compose up

2. Ouvrir l'URL du rôle à tester
   $ http://localhost:3000/dev/admin

3. Attendre initialisation spinner
   (~ 1 seconde)

4. Panel chargé, tester fonctionnalités
   - Cliquer les boutons
   - Faire des appels API
   - Vérifier les données

5. Changer de rôle? Nouvelle URL
   $ http://localhost:3000/dev/notaire

6. Logs disponibles
   Backend: $ docker logs -f container_backend
   Frontend: F12 → Console
```

---

## ✅ Checklist Installation

- [ ] `DEV_MODE=true` dans `backend/.env`
- [ ] Backend container redémarré
- [ ] Frontend prêt sur `localhost:3000`
- [ ] Visitez `/dev/visiteur` → Page d'accueil charge
- [ ] Visitez `/dev/user` → Dashboard utilisateur charge
- [ ] Visitez `/dev/admin` → Panel administrateur charge
- [ ] Visitez `/dev/notaire` → Dashboard notaire charge
- [ ] Vérifiez localStorage: `localStorage.dev_role` existe
- [ ] Browser DevTools → Network → Vérifiez header `X-Dev-Role`

---

## 📚 Fichiers Modifiés

```
✅ CRÉÉS:
   - backend/src/routes/dev_auth.py
   - frontend/src/components/DevRoleInitializer.jsx
   - frontend/src/contexts/AuthContext.jsx (backup)

✅ MODIFIÉS:
   - backend/.env (DEV_MODE=true)
   - backend/src/auth/decorators.py (X-Dev-Role support)
   - backend/src/app.py (dev_auth blueprint)
   - frontend/src/hooks/useAuth.js (initDevMode, exitDevMode)
   - frontend/src/services/api.js (Axios interceptor)
   - frontend/src/App.jsx (4 dev routes)
   - frontend/src/components/ProtectedRoute.jsx (localStorage check)
   - frontend/src/components/AdminLayout.jsx (DevModeWaitingWrapper)
   - frontend/src/pages/AdminHomePage.jsx (mock data support)
```

---

## 🎓 Exemple Complet

### Tester le panel admin
```
1. http://localhost:3000/dev/admin
2. Spinner: "🚀 Initialisation du mode ADMIN..."
3. Redirect vers /admin
4. Panel admin avec:
   - Navbar "🏢 Immo2000 Admin"
   - Sidebar avec menu complet
   - Utilisateur: "dev-admin@immo2000.dev"
   - Données mock dashboard chargées
5. Cliquer "Dashboard" → Voir statistiques mock
6. Cliquer "Utilisateurs" → Voir liste d'utilisateurs
7. Logout? localStorage.dev_role cleared
```

### Tester l'API directement
```bash
# Avec X-Dev-Role header
curl \
  -H "X-Dev-Role: admin" \
  -H "Content-Type: application/json" \
  http://localhost:5000/api/v1/admin/dashboard

# Réponse: JSON avec données mock (aucun JWT requis)
```

---

**Créé le:** 2026-05-13
**Status:** ✅ Production Ready
**Mode Dev Actif:** À vérifier en backend/.env
