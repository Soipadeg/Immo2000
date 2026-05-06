# Biens & Estimations

## 📋 Vue d'ensemble

Module de gestion des biens immobiliers avec estimation de prix via intégration MELO API.

---

## 🎯 Endpoints

### Lister les biens
```
GET /api/v1/biens
GET /api/v1/biens?utilisateur_id=1
GET /api/v1/biens?type=maison&surface_min=100
```

### Créer un bien
```
POST /api/v1/biens
Authorization: Bearer {VENDEUR_TOKEN}
Content-Type: application/json

{
  "adresse": "123 Rue de Paris, 75001",
  "codePostal": "75001",
  "localisation": "Paris 1er",
  "typeBien": "Appartement",
  "surface": 85,
  "nbChambres": 3,
  "salleDeBain": 1,
  "etage": 3,
  "ascenseur": true,
  "description": "Bel appartement haussmannien"
}
```

### Estimer un bien (MELO)
```
GET /api/v1/estimations/{bien_id}
GET /api/v1/estimations?adresse=123%20Rue%20Paris&codePostal=75001&surface=85&nbChambres=3
```

### Obtenir les détails d'un bien
```
GET /api/v1/biens/{id}
```

### Modifier un bien
```
PUT /api/v1/biens/{id}
Authorization: Bearer {VENDEUR_TOKEN}
```

### Supprimer un bien
```
DELETE /api/v1/biens/{id}
Authorization: Bearer {VENDEUR_TOKEN}
```

---

## 🏗️ Architecture

### Model (`backend/src/models/biens.py`)
```python
class Bien(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    adresse = db.Column(db.String(300), nullable=False)
    codePostal = db.Column(db.String(5), nullable=False)
    localisation = db.Column(db.String(100))
    typeBien = db.Column(db.String(50))  # Maison, Appartement, Studio...
    surface = db.Column(db.Float)
    nbChambres = db.Column(db.Integer)
    salleDeBain = db.Column(db.Integer)
    etage = db.Column(db.Integer)
    ascenseur = db.Column(db.Boolean, default=False)
    description = db.Column(db.Text)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateur.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### Service (`backend/src/services/biens.py`)
```python
class BiensService:
    @staticmethod
    def creer_bien(utilisateur_id, data)

    @staticmethod
    def modifier_bien(bien_id, utilisateur_id, data)

    @staticmethod
    def lister_biens(utilisateur_id=None, type_bien=None, surface_min=None)

    @staticmethod
    def recuperer_bien(bien_id)

    @staticmethod
    def supprimer_bien(bien_id, utilisateur_id)

    @staticmethod
    def estimer_bien(bien_id) -> Dict
```

---

## 💰 Estimations (MELO API)

### Intégration MELO
```python
# backend/src/melo_api.py

class MeloAPI:
    @staticmethod
    def estimer_bien(adresse: str, codePostal: str, surface: float,
                     nbChambres: int, typeBien: str) -> Dict
```

### Endpoint d'estimation
```
GET /api/v1/estimations/{bien_id}

Response:
{
  "bien_id": 1,
  "estimation_basse": 245000,
  "estimation_haute": 265000,
  "estimation_moyenne": 255000,
  "prix_au_m2": 3000,
  "confiance": "haute",
  "source": "MELO API",
  "date": "2026-05-06T10:30:00"
}
```

### Estimation en batch
```
GET /api/v1/estimations?adresse=123%20Rue&codePostal=75001&surface=85&nbChambres=3

Response:
{
  "adresse": "123 Rue de Paris",
  "surface": 85,
  "estimation_moyenne": 255000,
  "prix_au_m2": 3000
}
```

### Accuracy MELO
- ✅ Haute précision (±5%) pour zones urbaines
- ⚠️ Moyenne précision (±10%) pour zones périurbaines
- ❌ Basse précision (±15%+) pour zones rurales

---

## 📊 Types de biens

```
Maison
├─ Maison d'habitation
├─ Maison mitoyenne
└─ Maison jumelée

Appartement
├─ Studio
├─ T2, T3, T4...
├─ Penthouse
└─ Loft

Terrain
├─ Terrain à bâtir
├─ Terrain agricole
└─ Terrain commercial

Locaux commerciaux
├─ Bureau
├─ Magasin
├─ Entrepôt
└─ Restaurant
```

---

## 🔐 Permissions

| Action | Vendeur | Admin |
|--------|---------|-------|
| Créer bien | ✅ | ✅ |
| Modifier sa propre | ✅ | ✅ |
| Modifier autres | ❌ | ✅ |
| Lister ses biens | ✅ | ✅ |
| Lister tous les biens | ❌ | ✅ |
| Estimer | ✅ | ✅ |
| Supprimer son bien | ✅ | ✅ |

---

## 💡 Cas d'usage

### 1. Créer un bien
```bash
curl -X POST http://localhost:5000/api/v1/biens \
  -H "Authorization: Bearer {VENDEUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "adresse": "123 Rue de Paris",
    "codePostal": "75001",
    "localisation": "Paris 1er",
    "typeBien": "Appartement",
    "surface": 85,
    "nbChambres": 3,
    "salleDeBain": 1,
    "etage": 3,
    "ascenseur": true,
    "description": "Bel appartement haussmannien"
  }'
```

### 2. Obtenir estimation MELO
```bash
curl http://localhost:5000/api/v1/estimations/1 \
  -H "Authorization: Bearer {VENDEUR_TOKEN}"
```

### 3. Lister ses biens
```bash
curl "http://localhost:5000/api/v1/biens?utilisateur_id=1" \
  -H "Authorization: Bearer {VENDEUR_TOKEN}"
```

### 4. Filtrer par type et surface
```bash
curl "http://localhost:5000/api/v1/biens?type=Appartement&surface_min=80&surface_max=150"
```

---

## 🔧 Intégration MELO

### Configuration (.env)
```env
MELO_API_KEY=your_api_key
MELO_API_URL=https://api.melo.com/v1
MELO_TIMEOUT=5  # secondes
```

### Appel API MELO
```python
from src.melo_api import MeloAPI

estimation = MeloAPI.estimer_bien(
    adresse="123 Rue de Paris",
    codePostal="75001",
    surface=85,
    nbChambres=3,
    typeBien="Appartement"
)

# Retour:
# {
#   "estimation_basse": 245000,
#   "estimation_haute": 265000,
#   "estimation_moyenne": 255000,
#   "prix_au_m2": 3000,
#   "confiance": "haute"
# }
```

### Gestion erreurs
```python
try:
    estimation = MeloAPI.estimer_bien(...)
except MeloAPIError as e:
    # Timeout, 404, rate limit, etc.
    logger.error(f"Erreur MELO: {e}")
    return jsonify({"error": "Estimation impossible"}), 503
```

---

## 📈 Performance

- Index sur `utilisateur_id` pour requêtes par vendeur
- Index sur `typeBien` pour filtres
- Index sur `localisation` pour recherche géographique
- Cache estimations MELO: 7 jours
- Batch estimation optimisé pour multi-biens

---

## ⚠️ Validations

- **Adresse**: Non vide, >= 10 caractères
- **Code postal**: Format français (5 chiffres)
- **Localisation**: Dérivée du code postal
- **Type bien**: Liste prédéfinie
- **Surface**: > 0, <= 10000 m²
- **Nombre chambres**: >= 0, <= 10

---

## 🚀 Améliorations futures

- [ ] Photo du bien (upload + stockage)
- [ ] Visite virtuelle 360°
- [ ] Documents: DPE, Diagnostic, etc.
- [ ] Comparables (biens similaires vendus)
- [ ] Tendance marché locale
- [ ] Alerte prix MELO (bien surévalué?)
- [ ] Historique estimations (tracking)
- [ ] Simulation crédit (avec intégration simulateur)
