# 🏠 Immo2000 Frontend

Frontend React complet pour la plateforme immobilière Immo2000.

## ✨ Tâches Implémentées

### ✅ Tâche 3: Tableau de bord vendeur
Interface de gestion des annonces pour les vendeurs avec filtres, pagination et actions d'état.

**Fichiers:**
- `src/components/VendeurDashboard.jsx` (380 lignes)
- Filtres: statut, ville, type de bien
- Actions: Publier, Archiver, Vendre, Éditer, Supprimer
- Pagination: 20 annonces par page
- Notifications: Messages succès/erreur

### ✅ Tâche 4: Recherche de biens
Interface publique pour rechercher les annonces publiées avec filtres avancés et favoris.

**Fichiers:**
- `src/components/RechercheBiens.jsx` (420 lignes)
- Recherche texte + filtres avancés (prix, surface, localisation)
- Résultats en grille paginée (12 par page)
- Système de favoris (localStorage)
- Partage social (Web Share API)

## 🚀 Démarrage rapide

```bash
# Installation
npm install

# Développement
npm run dev          # http://localhost:3000

# Production
npm run build        # Créer dist/
npm run preview      # Prévisualiser
```

## 📖 Documentation

- [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) - Guide complet
- [../TASK_3_4_COMPLETE.md](../TASK_3_4_COMPLETE.md) - Détails implémentation

## 🏗️ Architecture

```
src/
├── components/          # Composants React
│   ├── VendeurDashboard.jsx
│   └── RechercheBiens.jsx
├── hooks/              # Hooks personnalisés
│   └── useAnnoncesStore.js (Zustand)
├── services/           # Services API
│   └── api.js
├── App.jsx             # Routage principal
├── index.jsx           # Point d'entrée
└── index.css           # Styles globaux
```

## 🔌 Intégration API

**Base URL:** `http://localhost:5000/api/v1`

**Endpoints principaux:**
```javascript
// Annonces
GET    /annonces                      // Lister (publiques)
GET    /annonces?utilisateur_id=123  // Lister (personnelles)
POST   /annonces/{id}/publier        // Publier
POST   /annonces/{id}/archiver       // Archiver
POST   /annonces/{id}/vendre         // Marquer vendue

// Notifications
POST   /notifications/test            // Tester email
```

## 🔐 Authentification

Le frontend stocke les credentials en localStorage:
```javascript
localStorage.setItem('auth_token', token)
localStorage.setItem('user_id', userId)
localStorage.setItem('user_role', role)  // 'vendeur', 'acheteur', 'agent'
```

## 📦 Dépendances

- React 18.2
- React Router 6
- Material-UI 5
- Zustand (state management)
- Axios (HTTP client)
- date-fns (dates)

## ✅ Tests

Le frontend est prêt pour tests E2E. Exemple avec Cypress:
```bash
npm install --save-dev cypress
npx cypress open
```

## 🎨 Personnalisation

**Theme Material-UI:** Éditer `src/App.jsx` > `createTheme()`
**Styles globaux:** Éditer `src/index.css`
**Variables d'environnement:** Copier et éditer `.env`

## 📱 Responsive Design

Testé et optimisé pour:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1200px+)

## 🔄 Prochaines étapes

- [ ] Tests unitaires (Jest)
- [ ] Tests E2E (Cypress)
- [ ] Optimisation images
- [ ] PWA support
- [ ] Déploiement Vercel (Tâche 7)

## 📞 Support

Voir [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) pour FAQ et dépannage.

---

**Status:** ✅ Prêt pour intégration | **Progress:** 5/7 MVP tasks
