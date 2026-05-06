# Estimation & Pricing (MELO API)

## 📋 Vue d'ensemble

Service d'estimation automatique de prix des bien immobiliers intégré avec l'API MELO, permettant aux vendeurs d'évaluer la valeur marchande de leur propriété.

---

## 🎯 Endpoints

### Estimer un bien
```
GET /api/v1/estimations/{bien_id}
Authorization: Bearer {TOKEN}
```

### Estimer avec paramètres
```
GET /api/v1/estimations?adresse=123%20Rue%20Paris&codePostal=75001&surface=85&nbChambres=3&typeBien=Appartement
```

### Historique estimations
```
GET /api/v1/estimations/{bien_id}/historique
```

### Comparables du marché
```
GET /api/v1/estimations/{bien_id}/comparables
Authorization: Bearer {TOKEN}
```

---

## 🏗️ Architecture

### Integration MELO

**Location**: `backend/src/melo_api.py`

```python
class MeloAPI:
    @staticmethod
    def estimer_bien(adresse: str, codePostal: str, surface: float,
                     nbChambres: int, typeBien: str) -> Dict
        """Appelle API MELO pour estimation"""

    @staticmethod
    def get_comparables(adresse: str, rayon_km: int = 1) -> List[Dict]
        """Récupère biens similaires vendus"""
```

### Service Estimation

**Location**: `backend/src/services/estimations.py`

```python
class EstimationService:
    @staticmethod
    def estimer_bien_id(bien_id: int) -> Dict
        """Estime bien depuis DB"""

    @staticmethod
    def estimer_parametres(adresse, codePostal, surface, nbChambres, typeBien) -> Dict
        """Estime sans bien en DB"""

    @staticmethod
    def lister_estimations_vendeur(utilisateur_id) -> List[Dict]
        """Toutes estimations du vendeur"""
```

---

## 📊 Structure d'estimation

### Response format
```json
{
  "bien_id": 1,
  "adresse": "123 Rue de Paris, 75001 Paris",
  "estimation_basse": 245000,
  "estimation_moyenne": 255000,
  "estimation_haute": 265000,
  "intervalle_confiance": {
    "min": 240000,
    "max": 270000,
    "pourcentage": "95%"
  },
  "prix_au_m2": 3000,
  "prix_au_m2_quartier": 2950,
  "prix_au_m2_ville": 3100,
  "tendance": "stable",  // "hausse", "baisse", "stable"
  "confiance": "haute",   // "haute", "moyenne", "basse"
  "source": "MELO API",
  "date_estimation": "2026-05-06T10:30:00",
  "donnees_base": {
    "surface": 85,
    "nbChambres": 3,
    "typeBien": "Appartement",
    "etage": 3,
    "ascenseur": true
  },
  "comparables": {
    "nombre_vendus": 12,
    "prix_moyen_recent": 252000,
    "prix_min_recent": 240000,
    "prix_max_recent": 270000
  },
  "facteurs_ajustement": {
    "localisation": "+5%",
    "etat": "-2%",
    "exposition": "+3%"
  }
}
```

### Niveaux de confiance

| Confiance | Critères | Fiabilité |
|-----------|----------|-----------|
| ✅ Haute | > 10 comparables, zone urbaine, données récentes | ±5% |
| ⚠️ Moyenne | 3-10 comparables, zone périurbaine | ±10% |
| ❌ Basse | < 3 comparables, zone rurale | ±15%+ |

---

## 💡 Cas d'usage

### 1. Vendeur estime son bien
```bash
curl "http://localhost:5000/api/v1/estimations/5" \
  -H "Authorization: Bearer {VENDEUR_TOKEN}"
```

### 2. Nouveau vendeur estime avant créer annonce
```bash
curl "http://localhost:5000/api/v1/estimations?adresse=123%20Rue%20Paris&codePostal=75001&surface=85&nbChambres=3&typeBien=Appartement"
```

### 3. Voir historique estimations
```bash
curl "http://localhost:5000/api/v1/estimations/5/historique" \
  -H "Authorization: Bearer {VENDEUR_TOKEN}"

# Response:
# [
#   {
#     "date": "2026-05-06",
#     "estimation_moyenne": 255000,
#     "tendance": "stable"
#   },
#   {
#     "date": "2026-04-06",
#     "estimation_moyenne": 253000,
#     "tendance": "hausse"
#   }
# ]
```

### 4. Voir biens comparables
```bash
curl "http://localhost:5000/api/v1/estimations/5/comparables" \
  -H "Authorization: Bearer {VENDEUR_TOKEN}"

# Response:
# {
#   "adresse_bien": "123 Rue de Paris",
#   "rayon": "1km",
#   "comparables": [
#     {
#       "adresse": "125 Rue de Paris",
#       "prix_vente": 260000,
#       "date_vente": "2026-04-15",
#       "surface": 87,
#       "similarite": 0.95
#     }
#   ]
# }
```

---

## 🔧 Configuration MELO

### Variables d'environnement (`.env`)
```env
MELO_API_KEY=your_api_key_here
MELO_API_URL=https://api.melo.com/v1/estimate
MELO_TIMEOUT=10  # secondes
MELO_CACHE_DAYS=7  # Garder estimation X jours
```

### Configuration appel API
```python
# backend/config.py
MELO_CONFIG = {
    'timeout': 10,
    'retries': 3,
    'cache_ttl': 7 * 24 * 3600,  # 7 jours
    'min_surface': 15,
    'max_surface': 10000,
    'min_prix': 10000,
    'max_prix': 100000000
}
```

---

## 🚨 Gestion erreurs

| Erreur | Cause | Handling |
|--------|-------|----------|
| MELO_NOT_FOUND | Adresse invalide | Suggérer correction adresse |
| MELO_TIMEOUT | Connexion lente | Retry x3 avec backoff |
| MELO_INVALID_PARAMS | Paramètres manquants | Valider avant appel |
| MELO_RATE_LIMIT | Trop d'appels | Cache + attendre |

### Fallback strategy
```python
try:
    estimation = MeloAPI.estimer_bien(...)
except MeloAPIError:
    # Retourner estimation en cache si existe
    cached = get_cached_estimation(bien_id)
    if cached and not expired(cached):
        return cached

    # Sinon erreur utilisateur
    return {"error": "Estimation impossible, réessayer"}, 503
```

---

## 📈 Tendances marché

### Analyse tendance
```
Stable:     Variation -2% à +2%
Hausse:     Variation > +2%
Baisse:     Variation < -2%
Explosive:  Variation > +10%
Crash:      Variation < -10%
```

### Timeline
```
Estimation T0: 255000 €
Estimation T+1m: 258000 € (hausse +1.2%)
Estimation T+2m: 262000 € (hausse +1.5%)

Tendance: Hausse stable, +2.7% en 2 mois
```

---

## 🔐 Permissions

| Action | Vendeur | Admin |
|--------|---------|-------|
| Estimer son bien | ✅ | ✅ |
| Estimer bien autre | ❌ | ✅ |
| Voir historique | ✅* | ✅ |
| Voir tendances marché | ✅ | ✅ |

*Vendeur voit seulement ses propres

---

## 💾 Caching

### Cache estimations
```python
# Redis key: estimation:{bien_id}:{timestamp}
# TTL: 7 jours

# Invalidate quand:
# - Bien modifié (surface, chambres, etc)
# - Nouveau comparable trouvé
# - Nouvelle donnée marché
```

---

## 📊 Pricing strategy

### Pour vendeurs
```
Estimation MELO:    255000 €

Pricing strategies:
├─ Prix marché:     255000 € (selon MELO)
├─ Pricing agressif: 249000 € (-2% pour vendre rapide)
├─ Pricing optimal:  259000 € (+1.5% test marché)
└─ Prix plancher:    245000 € (MELO basse)
```

---

## 🚀 Améliorations futures

- [ ] Machine Learning pour affiner estimations
- [ ] Prédiction prix futur (6-12 mois)
- [ ] Analyse sentiment (bien surévalué?)
- [ ] Alertes tendance ("hausse à Paris 1er")
- [ ] Benchmarking vendeur ("au-dessus du marché?")
- [ ] Export rapports PDF
- [ ] Intégration avec simulateur crédit
