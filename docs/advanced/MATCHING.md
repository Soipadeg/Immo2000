# Matching & Algorithme d'Appariement

## 📋 Vue d'ensemble

Algorithme intelligent de matching entre acheteurs et propriétés immobilières, basé sur les critères de recherche (stockés directement dans le modèle `User`) et les caractéristiques du bien.

### Architecture Unifiée ✨

Les critères d'achat sont maintenant intégrés au modèle `User` (6 champs optionnels) :
- `budget_max` - Budget maximum en euros
- `ville_recherchee` - Ville ou localisation préférée
- `surface_min` - Surface minimale souhaitée
- `type_bien_recherche` - Type de bien recherché (appartement, maison, etc.)
- `nombre_pieces_min` - Nombre minimum de pièces
- `dpe_ideale` - Classification DPE idéale

---

## 🎯 Endpoints

### Obtenir suggestions de matching
```
GET /api/v1/matching?budget_max=400000&ville_recherchee=Paris&type_bien_recherche=appartement
Authorization: Bearer {USER_TOKEN}
Content-Type: application/json
```

Response:
```json
{
  "matching_score": 85,
  "annonces": [
    {
      "annonce_id": 1,
      "titre": "Bel appartement 3 pièces",
      "prix": 350000,
      "ville": "Paris",
      "surface": 80,
      "nombre_pieces": 3,
      "dpe": "C",
      "score": 92
    }
  ]
}
```

### Récupérer statistiques de matching
```
GET /api/v1/matching/stats?budget_max=400000&ville_recherchee=Paris
Authorization: Bearer {USER_TOKEN}
```

### Score de compatibilité détaillé
```
GET /api/v1/matching/score/{user_id}/{annonce_id}
Authorization: Bearer {TOKEN}
```

---

## 🏗️ Architecture

### Critères de l'Utilisateur (User Model)

```python
class User(db.Model):
    # ... Base fields ...

    # Buyer Criteria (tous optionnels, nullable=True)
    budget_max = db.Column(db.Integer, nullable=True)  # €
    ville_recherchee = db.Column(db.String(100), nullable=True)
    surface_min = db.Column(db.Integer, nullable=True)  # m²
    type_bien_recherche = db.Column(db.String(50), nullable=True)
    nombre_pieces_min = db.Column(db.Integer, nullable=True)
    dpe_ideale = db.Column(db.String(10), nullable=True)  # A, B, C, D, E, F, G
```

### Algorithme de Scoring

```python
def calculate_matching_score(user: User, annonce: Annonce) -> float:
    """
    Calcule score de 0 à 100:
    - 0 = Aucune compatibilité
    - 50 = Moyen
    - 100 = Parfait match
    """
    score = 0

    # Budget matching (poids 30%) - REQUIS
    if user.budget_max and annonce.prix <= user.budget_max:
        # Perfect match si prix ≤ budget
        score += 30
    elif user.budget_max:
        # Bonus si proche du budget (±20%)
        tolerance = user.budget_max * 0.20
        if annonce.prix <= user.budget_max + tolerance:
            score += 20

    # Location matching (poids 25%)
    if user.ville_recherchee and annonce.ville:
        if user.ville_recherchee.lower() == annonce.ville.lower():
            score += 25
        elif is_nearby(user.ville_recherchee, annonce.ville, km=10):
            score += 15  # Proximité acceptable

    # Property type (poids 20%)
    if user.type_bien_recherche and annonce.type_bien:
        if user.type_bien_recherche.lower() == annonce.type_bien.lower():
            score += 20

    # Surface (poids 15%)
    if user.surface_min and annonce.surface:
        if annonce.surface >= user.surface_min:
            score += 15
        elif annonce.surface >= user.surface_min * 0.9:
            score += 10  # Close enough

    # Rooms (poids 10%)
    if user.nombre_pieces_min and annonce.nombre_pieces:
        if annonce.nombre_pieces >= user.nombre_pieces_min:
            score += 10

    return min(score, 100)
```

### Poids des Critères

| Critère | Poids | Champ | Impact |
|---------|-------|-------|--------|
| Budget | 30% | `budget_max` | Très important |
| Localisation | 25% | `ville_recherchee` | Très important |
| Type de bien | 20% | `type_bien_recherche` | Important |
| Surface | 15% | `surface_min` | Important |
| Nombre pièces | 10% | `nombre_pieces_min` | Modéré |

---

## 📊 Exemple de Réponse

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
