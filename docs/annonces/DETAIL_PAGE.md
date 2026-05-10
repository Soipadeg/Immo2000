# 🏠 Page de Détail d'Annonce + Carousel d'Annonces Similaires

## Vue d'ensemble

Un nouveau système complet pour afficher les détails d'une annonce immobilière avec un carousel d'annonces similaires en bas de page, permettant aux visiteurs et utilisateurs de découvrir d'autres biens du même type.

## Architecture

### Pages et Composants

#### 1. **AnnoncePage.jsx** - Page de détail complète
**Fichier:** `frontend/src/pages/AnnoncePage.jsx`

Affiche le détail complet d'une annonce spécifique :

**Features:**
- 📸 Galerie d'images avec miniatures
- 💰 Affichage du prix et prix au m²
- 📍 Localisation complète
- 🏠 Caractéristiques (surface, pièces, type)
- ⚡ DPE et équipements
- 📅 Dates et métadonnées
- ❤️ Système de favoris
- 📧 Modale de contact vendeur
- 🔄 Carousel d'annonces similaires en bas

**Layout:**
```
┌─────────────────────────────────────────┐
│ [← Retour]                              │
├──────────────────────────────┬──────────┤
│                              │          │
│   Galerie d'images          │ Contact  │
│   (main + miniatures)       │ Vendeur  │
│                              │ (Sticky) │
│   Détails principaux         │          │
│   (caractéristiques)         │ Actions  │
│                              │ (Msg, ♡, │
│   Description                │  Share)  │
│                              │          │
├──────────────────────────────┴──────────┤
│   🏠 Annonces similaires (Carousel)     │
└─────────────────────────────────────────┘
```

**Données affichées:**
- Titre et prix principal
- Prix au m² calculé
- Surface, nombre de pièces, type de bien
- DPE (coloré selon performance)
- Adresse complète
- Équipements (6 types)
- Année de construction, étage
- Dates de publication et modification
- Description complète
- Informations vendeur

#### 2. **SimilarAnnoncesCarousel.jsx** - Carousel d'annonces similaires
**Fichier:** `frontend/src/components/SimilarAnnoncesCarousel.jsx`

Affiche les annonces similaires en carousel avec navigation et filtrage intelligent :

**Features:**
- 🔄 Navigation précédent/suivant
- 📱 Responsive (1 col mobile, 2 col tablet, 3 col desktop)
- 🔍 Filtrage automatique par critères
- ❤️ Favoris intégrés
- 📊 Indicateur de position
- 💫 Animations de survol

**Algorithme de matching:**
```javascript
Une annonce est similaire si:
1. ✓ Même ville (case-insensitive)
2. ✓ Même type de bien
3. ✓ Prix dans plage ±30% du prix actuel
4. ✗ L'annonce actuelle est exclue
```

**Exemple:**
```
Annonce actuelle: Appartement Paris 75008, 400 000€
↓
Recherche annonces similaires:
  ✓ Ville: Paris
  ✓ Type: Appartement
  ✓ Prix: 280 000€ - 520 000€
↓
Résultats: 8 annonces similaires
↓
Affichage: 3 par 3 avec navigation
```

**Items par vue:**
- Desktop (≥1200px): 3 items
- Tablet (768-1199px): 2 items
- Mobile (<768px): 1 item

#### 3. **AnnonceBienCard.jsx** - Carte annonce cliquable
**Fichier:** `frontend/src/components/RechercheBiens.jsx` (modifié)

Carte d'annonce dans les listes (recherche, carousel) avec navigation :

**Features:**
- 🖱️ Cliquable sur toute la carte
- 🎨 Effet de survol (élévation)
- ❤️ Bouton favori cliquable
- 📤 Partage natif
- 🔗 Bouton "Voir" pour navigation

**Navigation:**
```
Click sur carte ↓
→ navigate(`/annonce/${annonce_id}`)
→ AnnoncePage charge le détail
```

### Routes

**App.jsx:**
```jsx
{/* Routes publiques */}
<Route path="/search" element={<RechercheBiens />} />
<Route path="/annonce/:id" element={<AnnoncePage />} />  // ← NOUVELLE
<Route path="/simulateur-pret" element={<SimulateurPret />} />
```

- `/annonce/:id` - Accessible à tous (visiteurs, utilisateurs, admins)
- Pas d'authentification requise
- Paramètre `id` = `annonce_id` de la base de données

## Workflow utilisateur

### Scénario 1: Navigation depuis la recherche

```
1. Utilisateur sur /search
   ↓
2. Clique sur une carte d'annonce
   ↓
3. useNavigate() → /annonce/42
   ↓
4. AnnoncePage charge l'annonce via getById(42)
   ↓
5. Affichage des détails complets
   ↓
6. SimilarAnnoncesCarousel charge les annonces similaires
   ↓
7. Utilisateur peut:
   - 📧 Contacter le vendeur
   - ❤️ Ajouter aux favoris
   - 📤 Partager l'annonce
   - 👁️ Voir annonces similaires
   - 🔙 Retour à la recherche
```

### Scénario 2: Accès direct par URL

```
1. Utilisateur tape /annonce/42 directement
   ↓
2. AnnoncePage se charge
   ↓
3. loadAnnonce() récupère les données
   ↓
4. Affichage du détail
   ↓
5. Carousel charge les similaires
```

### Scénario 3: Navigation depuis le carousel

```
1. Utilisateur sur /annonce/42
   ↓
2. Voit le carousel d'annonces similaires
   ↓
3. Clique sur une annonce du carousel
   ↓
4. useNavigate() → /annonce/55
   ↓
5. Page se récharge avec nouvelle annonce
   ↓
6. Nouveau carousel avec similaires à 55
```

## Données utilisées

### API Endpoint

**GET /api/v1/annonces/:id**

```json
{
  "annonce": {
    "annonce_id": 42,
    "titre": "Bel appartement 3 pièces",
    "description": "...",
    "prix": 400000,
    "surface": 75.5,
    "adresse": "123 Rue de Paris",
    "code_postal": "75008",
    "ville": "Paris",
    "type_bien": "Appartement",
    "nombre_pieces": 3,
    "photos": [
      "https://cdn.example.com/photo1.jpg",
      "https://cdn.example.com/photo2.jpg"
    ],
    "ascenseur": true,
    "balcon": false,
    "terrasse": false,
    "jardin": false,
    "piscine": false,
    "parking": true,
    "dpe": "B",
    "annee_construction": 2010,
    "etage": 4,
    "date_creation": "2026-05-10T10:30:00Z",
    "date_modification": "2026-05-10T10:30:00Z",
    "utilisateur": {
      "utilisateur_id": 1,
      "prenom": "Jean",
      "nom": "Dupont",
      "email": "jean@example.com"
    }
  }
}
```

### Query Parameters (Carousel)

```
GET /api/v1/annonces/list?
  ville=Paris&
  type_bien=Appartement&
  limit=100
```

Filtre côté client :
- Exclut l'annonce actuelle
- Vérifie ville et type_bien
- Filtre par prix ±30%
- Limite à 12 annonces

## Système de Favoris

**Stockage:** localStorage
**Clé:** `favorites`
**Format:** Array d'IDs

```javascript
// localStorage.favorites
[42, 55, 78]

// Utilisation
localStorage.setItem('favorites', JSON.stringify([...favs, 42]))
```

**Synchronisation:**
- AnnoncePage charge favoris au démarrage
- Cliques sur ❤️ mettent à jour localStorage
- SimilarAnnoncesCarousel gère ses propres favoris
- RechercheBiens gère ses propres favoris
- Pas de sync entre pages (localStorage local)

## Styles et Animations

### Transitions
```css
/* Carte annonce */
transform: translateY(-4px)
box-shadow: élevation 4
transition: all 0.3s ease

/* Image survolée */
opacity: 1 (normal: 0.6)
transition: opacity 0.2s

/* Boutons navigation carousel */
backgroundColor: rgba(0,0,0,0.5) → rgba(0,0,0,0.7)
transition: background 0.2s
```

### Couleurs DPE
```javascript
dpe <= 'B' → success (vert)
'C' | 'D' → warning (orange)
'E' | 'F' | 'G' → error (rouge)
```

### Couleurs Équipements
- Icons avec emojis (🛗, 🏠, 🪴, 🌳, 🏊, 🚗)
- Chips avec outlined style
- Tailles: small

## Performance

### Optimisations

1. **Images:**
   - Lazy loading de la galerie
   - Imagesl principale en format webp (recommandé)
   - Miniatures redimensionnées

2. **Requêtes API:**
   - getById() en cache HTTP
   - Carousel limite à 12 annonces
   - Pagination sur /search

3. **Rendu:**
   - Grid responsive avec CSS Media Queries
   - Sticky sidebar pour vendeur (position: sticky)
   - Pagination du carousel

### Bottlenecks potentiels

⚠️ **Cas à optimiser:**
- Nombreuses images dans galerie (>20 photos)
  → Implémenter lazy loading avec Intersection Observer
- Recherche d'annonces similaires lente
  → Ajouter des indexes DB sur (ville, type_bien, prix)
- Trop d'annonces similaires (>100)
  → Limiter déjà à 12 en requête

## Tests

### Checklist de test

- [ ] Page charge une annonce spécifique par ID
- [ ] Galerie affiche toutes les photos
- [ ] Miniatures changent l'image principale au clic
- [ ] Compteur "X/Y" affiche correct
- [ ] Favoris sauvegardent en localStorage
- [ ] Bouton "Retour" navigue vers page précédente
- [ ] Modale de contact s'ouvre au clic
- [ ] Partage fonctionne (native ou clipboard)
- [ ] Carousel affiche annonces similaires
- [ ] Navigation carousel fonctionne (prev/next)
- [ ] Clic sur annonce du carousel navigue vers /annonce/:id
- [ ] Annonce actuelle exclue du carousel
- [ ] Pas d'annonces sans photos/détails
- [ ] Prix ±30% filtré correctement

### Cas d'erreur à tester

- [ ] Annonce inexistante → "Annonce introuvable"
- [ ] API down → Message d'erreur
- [ ] Pas d'annonces similaires → Carousel caché
- [ ] Images cassées → Placeholder gris
- [ ] Pas de photos → "Pas de photo disponible"

## Fichiers modifiés/créés

```
frontend/src/
├── pages/
│   └── AnnoncePage.jsx                    [CRÉÉ]
├── components/
│   ├── SimilarAnnoncesCarousel.jsx        [CRÉÉ]
│   └── RechercheBiens.jsx                 [MODIFIÉ]
└── App.jsx                                [MODIFIÉ]
```

## Prochaines améliorations

### Phase 1: Fonctionnalités
- [ ] Contact email → Intégration backend
- [ ] Visite virtuelle / Photos 360°
- [ ] Plan interactif (Google Maps)
- [ ] Calculateur de prêt intégré

### Phase 2: Social
- [ ] Avis/Ratings sur les vendeurs
- [ ] Chatbot pour questions FAQ
- [ ] Video tours (YouTube embedded)
- [ ] Questions/Réponses au vendeur

### Phase 3: Intelligence
- [ ] Scoring de la propriété
- [ ] Comparaison avec prix du marché
- [ ] Recommandations ML (basé sur favoris)
- [ ] Historique de prix (suivi)

### Phase 4: Commerce
- [ ] Rendez-vous en ligne intégré (Calendly)
- [ ] Signature digitale des contrats
- [ ] Moyens de paiement
- [ ] Intégration notaire

## Architecture complète

```
User Navigation
├─ /search (RechercheBiens)
│  └─ Clique sur annonce
│     └─ navigate(/annonce/42)
├─ /annonce/42 (AnnoncePage)
│  ├─ Affiche détails
│  ├─ SimilarAnnoncesCarousel
│  │  └─ Clique sur annonce similaire
│  │     └─ navigate(/annonce/55)
│  └─ Modal Contact
│     └─ sendMessage()
└─ URL directe /annonce/42
   └─ Charge directement
```

## Notes de développement

- Pas d'authentification requise pour voir une annonce
- Favoris sont globaux (localStorage, pas de sync utilisateur)
- Le carousel exclut automatiquement l'annonce actuelle
- Les annonces du carousel sont triées par date_creation (plus récentes d'abord, implicite via requête)
- Sticky sidebar permet de voir le vendeur en scrollant
- Images principales + miniatures créent l'expérience de galerie
