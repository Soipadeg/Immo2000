# 🎬 Identifiants pour la Présentation Immo2000

## 📋 Comptes de Test

Le site est accessible à **http://localhost:3000**

### Visiteur (Accès Public)
- **Status**: Pas de compte requis
- **Pages accessibles**:
  - ✅ Page d'accueil
  - ✅ Consultation des annonces (`/search`)
  - ✅ Simulateur de prêt
  - ❌ Dashboard utilisateur
  - ❌ Admin panel

---

### Utilisateur Standard
- **Email**: `user@immo2000.fr`
- **Mot de passe**: `User123!`
- **Pages accessibles**:
  - ✅ Page d'accueil
  - ✅ Consultation des annonces
  - ✅ Simulateur de prêt
  - ✅ Dashboard utilisateur
  - ✅ Mes favoris
  - ✅ Mon historique
  - ✅ Mon profil
  - ✅ Guides & Modèles
  - ❌ Admin panel
  - ❌ Dashboard Notaire

---

### Admin
- **Email**: `admin@immo2000.fr`
- **Mot de passe**: `Admin123!`
- **Pages accessibles**:
  - ✅ Tous les accès utilisateur
  - ✅ Admin panel
  - ✅ Gestion des utilisateurs
  - ✅ Modération des annonces
  - ✅ Dashboard admin
  - ❌ Dashboard Notaire

---

### Notaire
- **Email**: `notaire@immo2000.fr`
- **Mot de passe**: `Notaire123!`
- **Pages accessibles**:
  - ✅ Tous les accès utilisateur
  - ✅ Dashboard Notaire
  - ✅ Documents d'achat
  - ✅ Gestion des offres
  - ❌ Admin panel

---

## 🎯 Plan de Présentation

### 1️⃣ Comme Visiteur (30 secondes)
```
Naviguer vers http://localhost:3000
→ Montrer l'accueil
→ Cliquer sur "Consulter les annonces"
→ Montrer la recherche avec filtres
→ Cliquer sur "Simulateur de prêt"
```

### 2️⃣ Se Connecter comme Utilisateur (45 secondes)
```
Cliquer "Se connecter"
Email: user@immo2000.fr
Mot de passe: User123!
→ Montrer la navbar dynamique (nouveaux items)
→ Aller au Dashboard utilisateur
→ Montrer "Mes favoris"
→ Montrer "Historique"
→ Montrer "Mon profil"
```

### 3️⃣ Admin Features (1 minute)
```
Se déconnecter
Email: admin@immo2000.fr
Mot de passe: Admin123!
→ Navbar montre "Admin"
→ Cliquer Admin > Gestion des utilisateurs
→ Montrer la table avec filtres
→ Cliquer Admin > Modération
→ Cliquer Admin > Dashboard
→ Montrer les statistiques
```

### 4️⃣ Notaire Features (30 secondes)
```
Se déconnecter
Email: notaire@immo2000.fr
Mot de passe: Notaire123!
→ Navbar montre "Dashboard Notaire"
→ Cliquer Dashboard Notaire
→ Montrer les documents
→ Montrer les offres en attente
```

---

## ✨ Features Principales à Montrer

- ✅ Authentification JWT avec localStorage
- ✅ Autorisation basée sur les rôles
- ✅ Navigation dynamique selon le rôle
- ✅ Pages avec données mock (prêt pour API)
- ✅ Responsive design (Material-UI)
- ✅ Chatbot widget flottant
- ✅ Modal protégées par authentification

---

## 🐳 Services Running

- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend**: http://localhost:5000 (Flask API)
- **Database**: PostgreSQL sur port 5432

Tous les containers sont **healthy** ✅

---

## 📝 Notes Technique

- Tous les appels API sont des mocks en dev
- Les rôles sont stockés dans `localStorage` et `user.role`
- Les routes protégées utilisent le composant `ProtectedRoute`
- Theme MUI custom avec couleurs primary (#1976d2) et secondary (#dc004e)

---

**Bonne présentation ! 🚀**
