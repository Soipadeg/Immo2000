# Annonces - Gestion et API

## 📋 Vue d'ensemble

Module responsable de la gestion complète des annonces immobilières: création, modification, recherche et filtrage.

---

## 🎯 Endpoints principaux

### Créer une annonce
```
POST /api/v1/annonces
Authorization: Bearer {VENDEUR_TOKEN}
Content-Type: application/json

{
  "titre": "Bel appartement 3 pièces",
  "description": "...",
  "prix": 250000,
  "adresse": "123 Rue de Paris, 75001 Paris",
  "localisation": "Paris 1er",
  "typeBien": "Appartement",
  "surface": 85,
  "nbChambresTotal": 3,
  "nbChambresActuelles": 2,
  "salle_de_bain": 1,
  "etage": 3,
  "ascenseur": true,
  "statut": "disponible"
}
```

### Récupérer les annonces
```
GET /api/v1/annonces
GET /api/v1/annonces/{id}
GET /api/v1/annonces?titre=...&localisation=...&prix_min=...&prix_max=...
```

### Modifier une annonce
```
PUT /api/v1/annonces/{id}
Authorization: Bearer {VENDEUR_TOKEN}
```

### Supprimer une annonce
```
DELETE /api/v1/annonces/{id}
Authorization: Bearer {VENDEUR_TOKEN}
```

---

## 🏗️ Architecture

### Model (`backend/src/models/annonces.py`)
```python
class Annonce(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    prix = db.Column(db.Float, nullable=False)
    adresse = db.Column(db.String(300), nullable=False)
    localisation = db.Column(db.String(100))
    typeBien = db.Column(db.String(50))
    surface = db.Column(db.Float)
    nbChambresTotal = db.Column(db.Integer)
    nbChambresActuelles = db.Column(db.Integer)
    salle_de_bain = db.Column(db.Integer)
    etage = db.Column(db.Integer)
    ascenseur = db.Column(db.Boolean, default=False)
    statut = db.Column(db.String(50), default="disponible")
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateur.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### Service (`backend/src/services/annonces.py`)
- `creer_annonce(vendeur_id, data)` - Création
- `modifier_annonce(annonce_id, data)` - Modification
- `lister_annonces(filtres)` - Recherche avec filtres
- `recuperer_annonce(annonce_id)` - Détails
- `supprimer_annonce(annonce_id)` - Suppression

### Routes (`backend/src/routes/annonces.py`)
- Tous les endpoints REST standards
- Validation des données avec Pydantic
- Contrôle d'accès (vendeur peut modifier que ses annonces)

---

## 🔍 Filtres disponibles

```
GET /api/v1/annonces?
  titre=keyword&
  localisation=Paris&
  prix_min=100000&
  prix_max=500000&
  typeBien=Appartement&
  surface_min=50&
  surface_max=200&
  nbChambresTotal_min=2&
  nbChambresTotal_max=5&
  ascenseur=true&
  statut=disponible
```

---

## 📊 Statuts possibles

| Statut | Description |
|--------|------------|
| `disponible` | Annonce active, bien à vendre |
| `réservé` | Bien réservé/en attente |
| `vendu` | Transaction conclue |
| `archivé` | Annonce archivée |

---

## 🔐 Permissions

| Action | Acheteur | Vendeur | Admin |
|--------|----------|---------|-------|
| Lire annonces | ✅ | ✅ | ✅ |
| Créer annonce | ❌ | ✅ | ✅ |
| Modifier sa propre | ❌ | ✅ | ✅ |
| Modifier autres | ❌ | ❌ | ✅ |
| Supprimer | ❌ | ✅ | ✅ |

---

## 📝 Schémas Pydantic

### AnnoncePOST
```python
class AnnoncePOST(BaseModel):
    titre: str
    prix: float
    adresse: str
    localisation: Optional[str] = None
    description: Optional[str] = None
    typeBien: Optional[str] = None
    surface: Optional[float] = None
    # ... autres champs
```

---

## 💡 Cas d'usage courants

### 1. Lister toutes les annonces
```bash
curl http://localhost:5000/api/v1/annonces
```

### 2. Filtrer par localisation et prix
```bash
curl "http://localhost:5000/api/v1/annonces?localisation=Paris&prix_min=200000&prix_max=400000"
```

### 3. Créer une nouvelle annonce (vendeur)
```bash
curl -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"titre": "...", "prix": 250000, ...}'
```

### 4. Modifier une annonce
```bash
curl -X PUT http://localhost:5000/api/v1/annonces/5 \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"prix": 240000, ...}'
```

---

## 🚀 Performance

- Index sur `utilisateur_id` pour les requêtes par vendeur
- Index sur `localisation` pour les filtres géographiques
- Index sur `statut` pour les filtres de disponibilité
- Pagination automatique sur les listes (limit 50 par défaut)

---

## 📌 Notes

- Les annonces sont associées au vendeur via `utilisateur_id`
- Impossible de supprimer une annonce ayant des visites confirmées
- Les modifications sont suivies via `updated_at`
