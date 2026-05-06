# Matching & Algorithme d'Appariement

## 📋 Vue d'ensemble

Algorithme intelligent de matching entre acheteurs et propriétés immobilières, basé sur les critères de recherche et les caractéristiques du bien.

---

## 🎯 Endpoints

### Matcher un acheteur
```
POST /api/v1/matching/suggest
Authorization: Bearer {ACHETEUR_TOKEN}
Content-Type: application/json

{
  "budget_min": 200000,
  "budget_max": 400000,
  "localisation": "Paris",
  "typeBien": "Appartement",
  "surface_min": 70,
  "surface_max": 150,
  "nbChambres_min": 2,
  "nbChambres_max": 4,
  "ascenseur": true,
  "distance_max_km": 5
}
```

### Récupérer suggestions pour acheteur
```
GET /api/v1/matching/suggestions
Authorization: Bearer {ACHETEUR_TOKEN}

?budget_min=200000&budget_max=400000&localisation=Paris&typeBien=Appartement
```

### Score de compatibilité
```
GET /api/v1/matching/score/{acheteur_id}/{annonce_id}
Authorization: Bearer {TOKEN}
```

---

## 🏗️ Architecture

### Algorithm
```python
def score_matching(acheteur_preferences, annonce_caracteristiques) -> float:
    """
    Calcule score de 0 à 100:
    - 0 = Aucune compatibilité
    - 50 = Moyen
    - 100 = Parfait match
    """

    score = 0

    # Budget matching (poids 30%)
    if annonce.prix >= preferences['budget_min'] and annonce.prix <= preferences['budget_max']:
        score += 30
    elif abs(annonce.prix - (budget_min + budget_max)/2) < 20000:
        score += 20  # Proche budget

    # Location matching (poids 25%)
    distance = calculate_distance(preferences['localisation'], annonce.localisation)
    if distance <= preferences['distance_max_km']:
        score += min(25, 25 - distance)

    # Property type (poids 20%)
    if annonce.typeBien == preferences['typeBien']:
        score += 20

    # Surface (poids 15%)
    if preferences['surface_min'] <= annonce.surface <= preferences['surface_max']:
        score += 15
    elif abs(annonce.surface - preference_surface_moyenne) < 10:
        score += 10  # Proche de la surface voulue

    # Rooms (poids 10%)
    if preferences['nbChambres_min'] <= annonce.nbChambres <= preferences['nbChambres_max']:
        score += 10

    return score
```

### Poids des critères

| Critère | Poids | Impact |
|---------|-------|--------|
| Budget | 30% | Très important |
| Localisation | 25% | Très important |
| Type de bien | 20% | Important |
| Surface | 15% | Important |
| Nombre chambres | 10% | Modéré |

---

## 💡 Cas d'usage

### 1. Acheteur demande suggestions
```bash
curl -X POST http://localhost:5000/api/v1/matching/suggest \
  -H "Authorization: Bearer {ACHETEUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "budget_min": 200000,
    "budget_max": 400000,
    "localisation": "Paris",
    "typeBien": "Appartement",
    "surface_min": 70,
    "surface_max": 150,
    "nbChambres_min": 2
  }'
```

### Response
```json
{
  "acheteur_id": 1,
  "total_matches": 12,
  "suggestions": [
    {
      "annonce_id": 5,
      "titre": "Bel appartement 3 pièces",
      "prix": 350000,
      "localisation": "Paris 1er",
      "surface": 85,
      "score": 92,
      "raison": [
        "Budget: match parfait",
        "Localisation: match",
        "Surface: excellent (85m² dans range 70-150)"
      ]
    },
    {
      "annonce_id": 8,
      "titre": "Cosy T2 Paris Centre",
      "prix": 280000,
      "localisation": "Paris 4e",
      "surface": 55,
      "score": 65,
      "raison": [
        "Budget: match parfait",
        "Surface: légèrement petite (55m² au lieu de 70-150)"
      ]
    }
  ]
}
```

### 2. Calcul score pour annonce spécifique
```bash
curl "http://localhost:5000/api/v1/matching/score/1/5" \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 📊 Métriques

### Pour acheteurs
- Nombre de suggestions pertinentes
- Score moyen des suggestions
- Conversion (visite créée / suggestion reçue)

### Pour vendeurs
- Compatibilité de ses annonces avec marché
- Nombre d'acheteurs potentiels
- Taux de visite (suggérée vs visible)

---

## 🔐 Permissions

| Action | Acheteur | Vendeur | Admin |
|--------|----------|---------|-------|
| Voir suggestions | ✅ | ❌ | ✅ |
| Scoring matching | ✅ | ❌ | ✅ |
| Analyser matching | ❌ | ✅* | ✅ |

*Vendeur voit matching de ses propres annonces

---

## 🚀 Améliorations futures

- [ ] Machine Learning pour poids des critères
- [ ] Matching par style (moderne, classique, etc)
- [ ] Critères additionnels (exposition, calme, etc)
- [ ] Notification auto quand nouveau match
- [ ] Historique matching (tracking)
- [ ] Analyse trending (quels biens sont chauds)
- [ ] Matching vendeur → acheteurs potentiels
