# 📖 Structure des Pages Immo2000

## ✅ Toutes les pages de la navbar sont maintenant disponibles

Chaque page suit la **même charte de design** avec:
- ✅ **Navbar globale** (identique sur toutes les pages)
- ✅ **Layout cohérent** (header + contenu + sections)
- ✅ **Design System** (composants Button, Card, Input, Alert, etc.)
- ✅ **Responsive Design** (mobile, tablet, desktop)

---

## 📍 Pages Disponibles & Routes

### 🏠 **Utilisateurs Connectés**

#### 1. **Dashboard** → `/dashboard`
- 📊 Vue d'ensemble personnalisée
- 📝 Gestion des annonces
- 🔔 Gestion des alertes
- 📚 Ressources et paramètres
- **Rôles**: `user`, `admin`, `notaire`

#### 2. **Recherche d'Annonces** → `/search` (ou **Acheter** dans navbar)
- 🔍 Recherche et filtrage d'annonces
- ❤️ Ajout aux favoris
- 📋 Listes de biens disponibles
- **Accès**: Tous (public et connectés)

#### 3. **Simulateur de Prêt** → `/simulateur-pret` (ou **Simulateur** dans navbar)
- 💰 Calcul de mensualité
- 📊 Taux d'endettement bancaire
- 🏦 Frais de notaire par région
- 🔄 Comparaison ancien/neuf
- **Accès**: Tous (public et connectés)

#### 4. **Matching** → `/matching` (ou **Matching** dans navbar)
- 💑 Matched automatique d'annonces
- 🎯 Filtres personnalisés
- 📧 Notifications d'alertes
- **Accès**: Utilisateurs connectés (user)

#### 5. **Alertes** → `/alertes` (ou **Alertes** dans navbar)
- 🔔 Création d'alertes immobilières
- 🔍 Surveillance de critères
- 📲 Notifications personnalisées
- **Accès**: Utilisateurs connectés (user)

#### 6. **Guides** → `/guides` (ou **Guides** dans navbar)
- 📚 Guides d'achat/vente
- 📖 Articles détaillés
- ⏱️ Temps de lecture
- 🏷️ Catégorisation par thème
- **Accès**: Tous

#### 7. **Modèles** → `/modeles` (ou **Modèles** dans navbar)
- 📄 Modèles de documents
- 📋 Checklists d'achat/vente
- 💾 Téléchargement PDF/Word
- 📊 Statistiques d'utilisation
- **Accès**: Tous

---

### 👨‍💼 **Admin Only**

#### 8. **Admin Dashboard** → `/admin`
- 📊 Statistiques globales (users, annonces, offres, revenus)
- 👥 Liste des utilisateurs
- 📋 Gestion des annonces
- 💳 Transactions et revenus
- ⚠️ Comptes suspects et détection de fraude
- **Accès**: Admin uniquement

---

### 👨‍⚖️ **Notaire Only**

#### 9. **Notaire Dashboard** → `/notaire`
- 📑 Dossiers en cours
- ✍️ Gestion de la signature électronique
- 💼 Actes de vente
- 📊 Suivi des transactions
- **Accès**: Notaires uniquement

---

## 🎨 Composants Réutilisables

Tous les pages utilisent les mêmes composants:

| Composant | Utilisation |
|-----------|------------|
| `Card` | Conteneur blanc avec ombre |
| `Button` | Boutons (primary, secondary, danger) |
| `Input` | Champs de texte/nombre |
| `Select` | Listes déroulantes |
| `Alert` | Messages (info, warning, error) |
| `FormContainer` | Wrapper pour formulaires |
| `PageLayout` | Template pour pages cohérentes |

---

## 🔄 Structure d'une Page (Template)

```jsx
import PageLayout from '../layouts/PageLayout';

const MyPage = () => {
  return (
    <PageLayout
      icon="📊"
      title="Titre de la Page"
      subtitle="Sous-titre descriptif"
      actionButton={<Button>Action</Button>}
      stats={[
        { label: 'Statistique 1', value: '123', trend: '+15%', trendUp: true },
        { label: 'Statistique 2', value: '456', trend: '-5%', trendUp: false },
      ]}
    >
      {/* Contenu principal */}
      <div>Contenu...</div>
    </PageLayout>
  );
};
```

---

## 🛣️ Flux de Navigation

```
HomePage (/)
  ├─ Navbar: [🏠 Acheter] → /search
  ├─ Navbar: [📈 Simulateur] → /simulateur-pret
  ├─ Navbar: [📚 Guides] → /guides
  └─ Navbar: [📄 Modèles] → /modeles

Dashboard (/dashboard)
  ├─ Navbar: [❤️ Matching] → /matching
  ├─ Navbar: [🔔 Alertes] → /alertes
  ├─ Navbar: [📊 Dashboard] → /dashboard
  ├─ Navbar: [⚙️ Admin] → /admin (si admin)
  └─ Sidebar: [Mes annonces] [Mes alertes]

/user/dashboard
  ├─ Stats: Annonces, Vues, Messages, Alertes
  ├─ Onglet: Mes annonces
  ├─ Onglet: Mes alertes
  └─ Ressources: Guides, Modèles, Simulateur
```

---

## 🎯 Prochains Améliorations

Pour améliorer l'expérience utilisateur:

1. **Intégrer PageLayout** dans plus de pages
2. **Ajouter des stats/KPIs** à chaque page
3. **Créer des pages de détail** (annonce, offre, transaction)
4. **Améliorer la navigation** (breadcrumbs, retour)
5. **Ajouter des filtres avancés** sur les pages de liste
6. **Créer des workflows** (création d'annonce, offre d'achat, etc.)

---

## 📱 Responsive Design

- **Desktop**: 2-4 colonnes, navigation horizontale
- **Tablet**: 1-2 colonnes, drawer menu
- **Mobile**: 1 colonne, drawer navigation

Tous les composants sont responsive avec `@media` queries.

---

## 🔐 Authentification & Rôles

Chaque page vérifie le rôle de l'utilisateur:

```javascript
// Vérifier l'authentification
const { user } = useAuth();
if (!user) navigate('/login');

// Vérifier le rôle
if (user.role !== 'admin') navigate('/');
```

Pages protégées avec `<ProtectedRoute>` wrapper.
