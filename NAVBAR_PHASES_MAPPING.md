# Navbar Phases Mapping

## Architecture des Navbars par Phase

### 🏠 Navbar Visiteur
**Utilisateurs non authentifiés**
- Logo + Routes publiques
- ANNONCES → /search
- SIMULATEUR → /simulateur-pret
- SE CONNECTER → http://localhost:5000/login.html
- S'INSCRIRE → http://localhost:5000/register.html

---

## Phase 3: Pages Utilisateur
### 👤 Navbar Utilisateur (role='user')
Intègre toutes les pages de Phase 3 pour l'expérience utilisateur complète.

| Fonctionnalité | Route | Page |
|---|---|---|
| 🔍 ANNONCES | `/search` | RechercheBiens.jsx |
| 📈 SIMULATEUR | `/simulateur-pret` | SimulateurPret.jsx |
| 📊 DASHBOARD | `/dashboard` | **UserDashboardPage.jsx** |
| 👤 PROFIL | `/profile` | **ProfilePage.jsx** |
| ❤️ FAVORIS | `/favoris` | **FavoritesPage.jsx** |
| 🔔 ALERTES | `/alertes` | **AlertesPage.jsx** |
| 📢 NOTIFS | `/notifications` | **NotificationsPage.jsx** |

**Fonctionnalités Non-Affichées (Accès Direct):**
- 📜 Historique → `/historique` (HistoryPage.jsx)

---

## Phase 4: Pages Admin
### 👨‍💼 Navbar Administrateur (role='admin')
Combine Phase 3 + outils d'administration spécialisés.

| Fonctionnalité | Route | Page | Phase |
|---|---|---|---|
| 🔍 ANNONCES | `/search` | RechercheBiens.jsx | 3 |
| 📈 SIMULATEUR | `/simulateur-pret` | SimulateurPret.jsx | 3 |
| 📊 DASHBOARD ADMIN | `/admin/dashboard` | **AdminDashboardPage.jsx** | 4 |
| 👥 UTILISATEURS | `/admin/users` | **AdminUsersPage.jsx** | 4 |
| 🛡️ MODÉRATION | `/admin/moderation` | **ModerationPage.jsx** | 4 |

**Statut:**
- ✅ Dashboard Admin: implémenté
- ✅ Gestion Utilisateurs: implémenté
- ✅ Modération Annonces: implémenté
- 📋 Statistiques: à intégrer

---

## Phase 5: Pages Notaire
### ⚖️ Navbar Notaire (role='notaire')
Combine Phase 3 + outils spécialisés pour notaires.

| Fonctionnalité | Route | Page | Phase |
|---|---|---|---|
| 🔍 ANNONCES | `/search` | RechercheBiens.jsx | 3 |
| 📈 SIMULATEUR | `/simulateur-pret` | SimulateurPret.jsx | 3 |
| 📋 DASHBOARD | `/notaire/dashboard` | **NotaireDashboardPage.jsx** | 5 |
| 📄 DOCUMENTS | `/notaire/documents` | **À créer** | 5 |

**Statut:**
- ✅ Dashboard Notaire: implémenté
- 📋 Gestion Documents: à créer

---

## Implémentation Technique

### Smart Role Detection
Le script `navbar-component-loader.js` détecte automatiquement:

```javascript
localStorage.auth_token    // Authentification
localStorage.user_role     // user | admin | notaire

// Routes déterminées:
- Pas de token → navbar-visiteur.html
- role='user' → navbar-utilisateur.html
- role='admin' → navbar-administrateur.html
- role='notaire' → navbar-notaire.html
```

### Flux de Navigation

```
┌─────────────────┐
│  Visiteur       │
│  (visiteur.html)│
└────────┬────────┘
         │ Login
         ↓
    ┌────────────────┐
    │  User          │
    │ (user.html)    │────→ Phase 3 Pages
    └────────────────┘
         ↑
         │ Promote
         │
    ┌────────────────┐
    │  Admin         │
    │ (admin.html)   │────→ Phase 3 + Phase 4 Pages
    └────────────────┘

    ┌────────────────┐
    │  Notaire       │
    │ (notaire.html) │────→ Phase 3 + Phase 5 Pages
    └────────────────┘
```

---

## À Faire

### Phase 4 (Admin)
- [ ] Vérifier route `/admin/dashboard` vs `/admin`
- [ ] Ajouter page Statistiques
- [ ] Implémenter statistiques système

### Phase 5 (Notaire)
- [ ] Créer route `/notaire/documents`
- [ ] Créer page NotaireDocumentsPage.jsx
- [ ] Implémenter gestion documents

---

## Conventions de Couleurs

| Rôle | Couleur | Hex |
|---|---|---|
| Visiteur | Bleu | #1976d2 |
| Utilisateur | Blanc | #FFFFFF |
| Admin | Or | #ffd700 |
| Notaire | Violet | #9c27b0 |
