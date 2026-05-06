# Guide du Frontend de Matching - Immo2000

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Structure des fichiers](#structure-des-fichiers)
3. [Composants](#composants)
4. [API & Services](#api--services)
5. [Installation & Configuration](#installation--configuration)
6. [Utilisation](#utilisation)
7. [Tests](#tests)
8. [Dépannage](#dépannage)
9. [Améliorations futures](#améliorations-futures)

---

## Vue d'ensemble

La page de Matching permet aux acheteurs de :
- **Filtrer les annonces** par ville, budget, surface et type de bien
- **Voir les résultats de matching** triés par score de pertinence
- **Accéder aux détails d'une annonce** via un lien direct
- **Prendre un RDV** pour visiter un bien

### Technologies utilisées
- **React 18** - Framework UI
- **Material-UI (MUI)** - Composants et styling
- **Axios** - Requêtes HTTP
- **React Router v6** - Navigation
- **Vite** - Bundler

---

## Structure des fichiers

```
frontend/src/
├── pages/
│   ├── MatchingPage.jsx          # Composant principal
│   ├── MatchingPage.css          # Styles spécifiques
│   ├── LoginPage.jsx             # (existant)
│   ├── RegisterPage.jsx          # (existant)
│   └── SimulateurBudget.jsx      # (existant)
├── services/
│   ├── api.js                    # Services API (modifié)
│   └── ...
├── components/
│   └── ... (composants réutilisables)
└── ...
```

---

## Composants

### MatchingPage.jsx

Composant principal qui gère l'interface de matching.

#### Props
Aucune prop - le composant utilise les données du localStorage

#### État (State)
```javascript
{
  filters: {
    ville: '',           // Nom de la ville
    budget_max: '',      // Budget maximum en €
    surface_min: '',     // Surface minimale en m²
    type_bien: ''        // Type de bien (Appartement, Maison, etc.)
  },
  annonces: [],          // Liste des annonces retournées
  loading: false,        // État de chargement
  error: null,           // Message d'erreur
  success: false         // Message de succès
}
```

#### Fonctions principales

**handleFilterChange(e)**
- Mise à jour des filtres au fur et à mesure de la saisie
- Arguments : Event de l'input
- Retour : State mis à jour

**handleSubmit(e)**
- Envoie une requête POST à `/api/v1/matching`
- Récupère l'ID utilisateur depuis localStorage
- Nettoie et valide les données avant envoi
- Arguments : Event du formulaire
- Retour : Liste des annonces ou erreur

**handleClearFilters()**
- Réinitialise tous les filtres et résultats
- Pas d'arguments
- Retour : State réinitialisé

**renderScoreStars(score)**
- Convertit un score 0-100 en étoiles 0-5 pour le composant Rating MUI
- Arguments : score (0-100)
- Retour : Nombre d'étoiles (0-5)

**formatPrice(price)**
- Formate un prix en devises EUR avec séparateurs
- Arguments : price (nombre)
- Retour : String formaté (ex: "300 000,00 €")

#### Exemple d'utilisation dans App.jsx
```javascript
import MatchingPage from './pages/MatchingPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/matching" element={<MatchingPage />} />
        {/* autres routes */}
      </Routes>
    </Router>
  );
}
```

---

## API & Services

### Service matchingApi (dans `frontend/src/services/api.js`)

```javascript
// Récupérer les annonces matchées
await matchingApi.getMatches(acheteur_id, {
  ville: 'Paris',
  budget_max: 500000,
  surface_min: 80,
  type_bien: 'Appartement'
});

// Réponse attendue :
[
  {
    id: 1,
    adresse: "123 Rue de Paris",
    prix: 350000,
    surface: 85,
    type_bien: "Appartement",
    image_url: "https://...",
    description: "Bel appartement",
    score: 95,
    ...autres_champs
  },
  ...
]
```

### Endpoints API utilisés

#### POST `/api/v1/matching`
Récupère les annonces matchées pour un acheteur

**Requête :**
```json
{
  "acheteur_id": 123,
  "ville": "Paris",          // Optionnel
  "budget_max": 500000,      // Optionnel
  "surface_min": 80,         // Optionnel
  "type_bien": "Appartement" // Optionnel
}
```

**Réponse :**
```json
[
  {
    "id": 1,
    "adresse": "123 Rue de Paris",
    "prix": 350000,
    "surface": 85,
    "type_bien": "Appartement",
    "image_url": "https://...",
    "description": "Bel appartement",
    "score": 95,
    "contact": {...},
    "publication_date": "2024-01-15",
    ...
  }
]
```

**Codes d'erreur :**
- `200` - Succès
- `400` - Requête invalide (paramètres manquants)
- `401` - Non authentifié (JWT invalide)
- `500` - Erreur serveur

#### GET `/api/v1/matching/{acheteur_id}/{annonce_id}` (optionnel)
Récupère les détails du matching

**Réponse :**
```json
{
  "score": 95,
  "raisons_matching": [
    "Localisation correspondante",
    "Budget compatible",
    "Surface appropriée"
  ],
  "annonce": {...},
  "acheteur": {...}
}
```

---

## Installation & Configuration

### Prérequis
- Node.js >= 14
- npm ou yarn
- Backend Immo2000 en cours d'exécution

### Installation

1. **Cloner le repository** (si ce n'est pas fait)
   ```bash
   cd /home/djali/code/Soipadeg/Immo2000
   ```

2. **Installer les dépendances frontend**
   ```bash
   cd frontend
   npm install
   ```

3. **Configurer les variables d'environnement**

   Créer un fichier `.env.local` dans le dossier `frontend/` :
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

   Ou pour la production :
   ```env
   VITE_API_URL=https://api.immo2000.com/api/v1
   ```

### Démarrage du serveur de développement

```bash
cd frontend
npm run dev
```

L'application sera accessible à `http://localhost:5173` (Vite)

### Build pour la production

```bash
cd frontend
npm run build
```

Les fichiers seront dans le dossier `dist/`

---

## Utilisation

### Intégration dans l'application principale

1. **Ajouter la route dans App.jsx :**
   ```javascript
   import MatchingPage from './pages/MatchingPage';

   function App() {
     return (
       <BrowserRouter>
         <Routes>
           <Route path="/matching" element={<MatchingPage />} />
         </Routes>
       </BrowserRouter>
     );
   }
   ```

2. **Ajouter un lien de navigation vers la page (dans la navbar) :**
   ```javascript
   <Link to="/matching">Trouver un bien</Link>
   ```

### Utilisation par les utilisateurs

1. **Accéder à la page** : `/matching`
2. **Remplir les filtres** (tous optionnels) :
   - Ville : entrée libre
   - Budget maximum : nombre entier
   - Surface minimum : nombre entier (m²)
   - Type de bien : sélection parmi une liste
3. **Cliquer sur "Rechercher"** pour lancer la recherche
4. **Visualiser les résultats** :
   - Cartes avec image, prix, surface, type
   - Score de matching affiché en étoiles (0-5)
   - Boutons d'action : "Voir l'annonce" et "Prendre RDV"
5. **Prendre un RDV** via le bouton "Prendre RDV"

### Authentification

- L'utilisateur doit être **connecté** pour accéder à cette page
- Le JWT est stocké dans `localStorage.auth_token`
- L'ID utilisateur est stocké dans `localStorage.user_id`
- Si le JWT est invalide/expiré, l'utilisateur est redirigé vers `/login`

---

## Tests

### Tests manuels

#### Test 1 : Affichage initial
- [ ] Ouvrir la page `/matching`
- [ ] Vérifier l'affichage du formulaire et du message "Aucune annonce"
- [ ] Vérifier la page est responsive sur mobile/tablette

#### Test 2 : Recherche simple
- [ ] Laisser tous les filtres vides
- [ ] Cliquer sur "Rechercher"
- [ ] Vérifier que les résultats s'affichent
- [ ] Vérifier le nombre de résultats (<= 10)

#### Test 3 : Filtres individuels
- [ ] Tester chaque filtre individuellement :
  - [ ] Filtre ville
  - [ ] Filtre budget
  - [ ] Filtre surface
  - [ ] Filtre type
- [ ] Vérifier que les résultats changent

#### Test 4 : Filtres combinés
- [ ] Remplir tous les filtres
- [ ] Cliquer sur "Rechercher"
- [ ] Vérifier que les résultats respectent les critères

#### Test 5 : Affichage des annonces
- [ ] Vérifier que chaque carte affiche :
  - [ ] Image (ou placeholder)
  - [ ] Adresse
  - [ ] Prix formaté
  - [ ] Surface et type
  - [ ] Score en étoiles
  - [ ] Deux boutons

#### Test 6 : Navigation
- [ ] Cliquer sur "Voir l'annonce"
  - [ ] Vérifier la redirection vers `/annonces/{id}`
- [ ] Cliquer sur "Prendre RDV"
  - [ ] Vérifier la redirection vers `/visites?annonce_id={id}`

#### Test 7 : Gestion des erreurs
- [ ] Se déconnecter et tenter d'accéder à `/matching`
  - [ ] Vérifier la redirection vers `/login`
- [ ] Vérifier le message d'erreur si l'API est hors ligne
- [ ] Tester avec des filtres invalides

#### Test 8 : Performance
- [ ] Vérifier le temps de réponse de la recherche (<2s)
- [ ] Vérifier que les animations ne ralentissent pas l'interface

#### Test 9 : Responsive
- [ ] Mobile (375px) : layout vertical
- [ ] Tablette (768px) : grille 2 colonnes
- [ ] Desktop (1200px+) : grille 3 colonnes

### Tests automatisés (optionnel avec Jest + React Testing Library)

```javascript
// tests/MatchingPage.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MatchingPage from '../pages/MatchingPage';

describe('MatchingPage', () => {
  test('renders the matching form', () => {
    render(
      <BrowserRouter>
        <MatchingPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/Trouvez votre bien idéal/i)).toBeInTheDocument();
  });

  test('submits form with filters', async () => {
    render(
      <BrowserRouter>
        <MatchingPage />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Rechercher/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Résultats/i)).toBeInTheDocument();
    });
  });

  test('displays error message on API failure', async () => {
    render(
      <BrowserRouter>
        <MatchingPage />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Rechercher/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Erreur/i)).toBeInTheDocument();
    });
  });
});
```

---

## Dépannage

### La page affiche "Vous devez être connecté"
**Cause** : L'utilisateur n'est pas authentifié ou le JWT est expiré
**Solution** : Se connecter à nouveau via la page de login

### Les annonces ne s'affichent pas
**Causes possibles** :
1. Le backend n'est pas accessible
   - Vérifier que le serveur Flask est en cours d'exécution
   - Vérifier l'URL de l'API dans `.env.local`
2. Pas d'annonces correspondant aux critères
   - Vérifier la base de données
   - Essayer sans filtres
3. JWT invalide ou expiré
   - Se reconnecter

### Les images ne s'affichent pas
**Solution** :
1. Vérifier que le champ `image_url` existe dans la base de données
2. Vérifier que les URLs sont valides
3. Le composant affiche un placeholder si l'image est indisponible

### Le formulaire ne soumet pas
**Causes possibles** :
1. Le bouton est désactivé (état loading)
   - Attendre que la requête se termine
2. Erreur JavaScript dans la console
   - Ouvrir les devtools (F12)
   - Vérifier la console pour les erreurs

### Les étoiles de score ne s'affichent pas correctement
**Solution** : Vérifier que le champ `score` dans la réponse API est un nombre entre 0 et 100

### Erreur "CORS" dans les requêtes API
**Cause** : Le serveur backend n'accepte pas les requêtes du frontend
**Solution** :
1. Vérifier la configuration CORS du backend
2. Vérifier l'URL de l'API
3. Vérifier que le JWT est bien inclus dans les headers

---

## Améliorations futures

### Phase 2
- [ ] **Sauvegarde des recherches** : Permettre aux utilisateurs de sauvegarder leurs critères de recherche
- [ ] **Favoris** : Ajouter une fonction pour ajouter des annonces aux favoris
- [ ] **Notifications** : Alerter l'utilisateur quand une nouvelle annonce correspond à ses critères
- [ ] **Historique** : Afficher l'historique des recherches
- [ ] **Tri avancé** : Permettre le tri par prix, surface, date de publication

### Phase 3
- [ ] **Recherche en temps réel** : Afficher les résultats au fur et à mesure de la saisie
- [ ] **Carte interactive** : Afficher les annonces sur une carte
- [ ] **Comparaison d'annonces** : Comparer plusieurs annonces côte à côte
- [ ] **Recommandations** : Algorithme de recommandation basé sur l'historique
- [ ] **Export** : Exporter les résultats en PDF/Excel

### Performance
- [ ] Implémenter la pagination côté frontend
- [ ] Lazy loading des images
- [ ] Caching des résultats
- [ ] Service Worker pour le mode hors ligne

### Accessibilité
- [ ] Améliorer les labels ARIA
- [ ] Support du clavier complet
- [ ] Support des lecteurs d'écran
- [ ] Ratio de contraste amélioré

---

## Documentation pour les développeurs

### Architecture
```
MatchingPage (Conteneur)
├── Page Header (Titre + Description)
├── Filters Form
│   ├── TextField (Ville)
│   ├── TextField (Budget Max)
│   ├── TextField (Surface Min)
│   ├── Select (Type de bien)
│   └── Buttons (Rechercher, Réinitialiser)
├── Alerts (Erreurs/Succès)
└── Results Section
    └── Grid de Cards
        └── AnnounceCard
            ├── CardMedia (Image)
            ├── CardContent (Détails)
            │   ├── Titre
            │   ├── Chips (Prix, Surface, Type)
            │   ├── Rating (Score)
            │   └── Description
            └── CardActions (Boutons)
```

### Points d'extension
1. **Ajouter des filtres** : Ajouter des champs au state `filters` et à la requête API
2. **Ajouter des actions** : Ajouter des boutons dans `CardActions`
3. **Personnaliser le style** : Modifier `MatchingPage.css` ou les props MUI
4. **Intégrer avec d'autres services** : Ajouter de nouveaux appels API dans `MatchingPage.jsx`

### Exemple : Ajouter un filtre pour le type de chauffage
```javascript
// 1. Ajouter au state
filters: {
  ...
  type_chauffage: ''
}

// 2. Ajouter le champ au formulaire
<FormControl fullWidth variant="outlined">
  <InputLabel>Type de chauffage</InputLabel>
  <Select
    name="type_chauffage"
    value={filters.type_chauffage}
    onChange={handleFilterChange}
    label="Type de chauffage"
  >
    <MenuItem value="">Tous</MenuItem>
    <MenuItem value="Électrique">Électrique</MenuItem>
    <MenuItem value="Gaz">Gaz</MenuItem>
    <MenuItem value="Chauffage central">Chauffage central</MenuItem>
  </Select>
</FormControl>

// 3. Le reste fonctionne automatiquement (envoi dans la requête API)
```

---

## Contacts & Support

Pour toute question ou bug :
- Créer une issue sur GitHub
- Contacter l'équipe de développement
- Consulter la documentation du backend : [BACKEND_API.md](../BACKEND_API.md)

---

**Dernière mise à jour** : 2024
**Version** : 1.0
**Statut** : Production Ready ✅
