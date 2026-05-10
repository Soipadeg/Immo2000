# 🔔 Système d'Alertes d'Annonces

## Vue d'ensemble

Le système d'alertes permet aux utilisateurs authentifiés de créer des alertes personnalisées pour recevoir des notifications par email lorsque de nouvelles annonces correspondent à leurs critères de recherche.

## Features

✅ **Création d'alertes** - Les utilisateurs peuvent créer des alertes avec :
- Critères de localisation (ville, code postal)
- Critères de prix (min/max)
- Critères de surface (min/max)
- Type de bien (appartement, maison, etc.)
- Nombre de pièces (min/max)
- DPE (A-G)
- Équipements (ascenseur, balcon, terrasse, jardin, piscine, parking)

✅ **Gestion des alertes** - Les utilisateurs peuvent :
- Voir toutes leurs alertes
- Modifier les critères d'une alerte
- Désactiver/réactiver une alerte
- Supprimer une alerte
- Configurer la fréquence de notification (immédiatement, quotidienne, hebdomadaire)

✅ **Notifications** - Le système envoie :
- Notifications par email lorsqu'une nouvelle annonce correspond aux critères
- Respect de la fréquence configurée par l'utilisateur
- Suivi de la dernière notification envoyée

## Architecture

### Backend

#### Models (`backend/src/models/alertes.py`)
```python
class AlerteAnnonce:
    - alerte_id: PK
    - utilisateur_id: FK → utilisateurs
    - nom: str (200 chars)
    - Critères de recherche (ville, type_bien, prix_min/max, surface_min/max, etc.)
    - Équipements (6 booleans)
    - actif: boolean
    - frequence: 'quotidienne' | 'hebdomadaire' | 'immediatement'
    - email_notification: boolean
    - Métadonnées (dates)
```

#### Routes (`backend/src/routes/alertes.py`)
- `GET /api/v1/alertes` - Lister les alertes de l'utilisateur (pagination)
- `POST /api/v1/alertes` - Créer une nouvelle alerte
- `GET /api/v1/alertes/{id}` - Récupérer une alerte spécifique
- `PUT /api/v1/alertes/{id}` - Mettre à jour une alerte
- `DELETE /api/v1/alertes/{id}` - Supprimer une alerte
- `POST /api/v1/alertes/{id}/toggle` - Activer/désactiver une alerte

#### Schemas (`backend/src/schemas/alertes.py`)
- `CreateAlerteAnnonce` - Validation création
- `UpdateAlerteAnnonce` - Validation mise à jour
- `AlerteAnnonceResponse` - Response unique
- `AlerteAnnonceListResponse` - Response list avec pagination

### Frontend

#### Components

**AlertesPage.jsx** (`frontend/src/pages/AlertesPage.jsx`)
- Page complète de gestion des alertes
- Liste de toutes les alertes de l'utilisateur
- Modal pour créer/éditer une alerte
- Actions: éditer, supprimer, activer/désactiver

**CreateAlerteQuickModal.jsx** (`frontend/src/components/CreateAlerteQuickModal.jsx`)
- Modal de création rapide depuis la page de recherche
- Pré-remplit les filtres de la recherche actuelle
- Configuration rapide (nom, fréquence)

#### Routes (App.jsx)
```jsx
{isAuthenticated && <Route path="/alertes" element={<AlertesPage />} />}
```

#### Navigation (AppBar)
- Bouton "🔔 Alertes" visible pour les utilisateurs connectés
- Lien vers `/alertes`

### Database

#### Table `alertes_annonces`
- 40+ colonnes pour les critères
- Indexes optimisés sur utilisateur_id, type_bien, ville, etc.
- Cascade delete sur utilisateur

## Workflow utilisateur

### 1. Créer une alerte depuis la recherche

```
RechercheBiens.jsx
  ↓
Utilisateur clique sur "🔔 Créer une alerte"
  ↓
CreateAlerteQuickModal s'ouvre
  ↓
Pré-remplit les filtres actuels
  ↓
Utilisateur entre un nom
  ↓
POST /api/v1/alertes
  ↓
Alerte créée avec succès
```

### 2. Gérer les alertes

```
AppBar → Clic sur "🔔 Alertes"
  ↓
AlertesPage.jsx charge les alertes
  ↓
GET /api/v1/alertes
  ↓
Liste des alertes affichées
  ↓
Actions disponibles:
  - Éditer (PUT /api/v1/alertes/{id})
  - Supprimer (DELETE /api/v1/alertes/{id})
  - Activer/Désactiver (POST /api/v1/alertes/{id}/toggle)
```

## Configuration

### Fréquences de notification

- **`immediatement`** - Email dès qu'une nouvelle annonce correspond
- **`quotidienne`** - Email une fois par jour avec toutes les correspondances
- **`hebdomadaire`** - Email une fois par semaine avec toutes les correspondances

### Types de bien supportés

- Appartement
- Maison
- Studio
- T2, T3, T4, T5+
- Terrain
- Local commercial
- Immeuble
- Penthouse

### Équipements disponibles

- Ascenseur
- Balcon
- Terrasse
- Jardin
- Piscine
- Parking

## API Reference

### POST /api/v1/alertes
Créer une nouvelle alerte

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "nom": "Appartement 3 pièces Paris",
  "ville": "Paris",
  "code_postal": "75008",
  "type_bien": "Appartement",
  "prix_min": 300000,
  "prix_max": 500000,
  "surface_min": 60,
  "surface_max": 100,
  "nombre_pieces_min": 3,
  "nombre_pieces_max": 4,
  "dpe": "B",
  "ascenseur": true,
  "balcon": true,
  "terrasse": false,
  "jardin": false,
  "piscine": false,
  "parking": true,
  "frequence": "quotidienne",
  "email_notification": true
}
```

**Response (201):**
```json
{
  "alerte_id": 1,
  "utilisateur_id": 42,
  "nom": "Appartement 3 pièces Paris",
  "actif": true,
  "date_creation": "2026-05-10T10:30:00Z",
  ...
}
```

### GET /api/v1/alertes
Lister les alertes de l'utilisateur

**Query Parameters:**
```
?page=1&per_page=10
```

**Response:**
```json
{
  "alertes": [
    {
      "alerte_id": 1,
      "nom": "Appartement 3 pièces Paris",
      "actif": true,
      ...
    }
  ],
  "total": 5,
  "pages": 1
}
```

### PUT /api/v1/alertes/{id}
Mettre à jour une alerte

**Body:** Mêmes champs que POST (tous optionnels)

### DELETE /api/v1/alertes/{id}
Supprimer une alerte

**Response (204):** No Content

### POST /api/v1/alertes/{id}/toggle
Activer/désactiver une alerte

**Response:**
```json
{
  "alerte_id": 1,
  "actif": false
}
```

## Prochaines étapes

### Phase 1: Notification Engine ⏳
Créer un background job qui:
1. Interroge toutes les alertes actives
2. Pour chaque alerte, récupère les nouvelles annonces correspondantes
3. Envoie les emails selon la fréquence configurée
4. Met à jour `date_derniere_notification`

### Phase 2: Email Templates
- HTML templates pour les notifications
- Inclusion de photos et détails des annonces
- Lien de redirection vers l'annonce
- Option de désabonnement

### Phase 3: Analytics
- Tracking des alertes créées
- Tracking des conversions (alertes → contacts)
- Dashboard de statistiques pour les vendeurs

### Phase 4: Smart Notifications
- Machine learning pour les recommandations
- Alertes intelligentes basées sur l'historique
- Scores de pertinence des annonces

## Tests

Les endpoints ont été testés avec:
- ✅ Création d'alerte avec tous les critères
- ✅ Récupération des alertes de l'utilisateur
- ✅ Mise à jour d'alerte
- ✅ Suppression d'alerte
- ✅ Activation/désactivation d'alerte
- ✅ Validation des critères
- ✅ Authentification JWT requise
- ✅ Vérification des droits (owner check)

## Notes

- Toutes les routes alertes sont @token_required
- Owner check appliqué sur GET/PUT/DELETE/{id}
- Pagination par défaut: 10 alertes par page
- Timestamps en UTC avec timezone
- Cascade delete sur suppression d'utilisateur
- Indexes optimisés pour les recherches

## Fichiers créés

```
backend/
├── src/
│   ├── models/alertes.py
│   ├── schemas/alertes.py
│   └── routes/alertes.py
└── migrations/
    └── 004_create_alertes_annonces_table.sql

frontend/
└── src/
    ├── pages/AlertesPage.jsx
    ├── components/CreateAlerteQuickModal.jsx
    ├── App.jsx (modifié - ajout route + navigation)
    └── components/RechercheBiens.jsx (modifié - ajout bouton modal)
```

## Status

✅ **Implémentation complète:**
- ✅ Model + Schemas + Routes backend
- ✅ Database migration
- ✅ AlertesPage frontend
- ✅ CreateAlerteQuickModal
- ✅ Routes App.jsx
- ✅ Navigation AppBar

⏳ **À faire:**
- ⏳ Notification engine (background job)
- ⏳ Email templates
- ⏳ Cron job pour matching
- ⏳ Tests end-to-end
