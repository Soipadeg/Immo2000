# 🏡 Système de Matching Immo2000

## 📚 Documentation de l'Algorithme de Scoring

### Pour Gilbert (Explications simplifiées)

Bonjour Gilbert! 🦆

Ce système aide à **recommander les meilleures annonces** à chaque acheteur.

Voici comment ça marche:

---

## 1️⃣ Les règles de scoring

Quand un acheteur cherche une maison, on **évalue chaque annonce** selon ses critères.

### Critères POSITIFS (ajoutent des points):

| Critère | Points | Explication |
|---------|--------|-------------|
| **Prix <= Budget** | +10 | L'annonce est dans le budget → Excellent! |
| **Même ville** | +5 | C'est là où l'acheteur veut habiter → Bonus! |
| **Surface >= Minimum** | +3 | Assez de place pour l'acheteur → OK! |
| **Même type de bien** | +2 | Appartement/Maison/etc correspond → Good! |
| **Marge de prix** | +1 par 10% | Exemple: Prix=200k, Budget=250k → Marge=20% → +2 bonus |

### Critères NÉGATIFS (retranchent des points):

| Critère | Points | Explication |
|---------|--------|-------------|
| **Ville différente** | -5 | Ce n'est pas la bonne région → Pas bon! |
| **Type différent** | -5 | Maison au lieu d'appartement → Pas bon! |

---

## 2️⃣ Exemples concrets

### ✅ EXEMPLE 1: EXCELLENT MATCH (21 points)

```
Acheteur Gilbert cherche:
  - Budget: 300,000€
  - Ville: Paris
  - Surface minimum: 60m²
  - Type: Appartement

Annonce trouvée:
  - Prix: 250,000€ ✓
  - Ville: Paris ✓
  - Surface: 75m² ✓
  - Type: Appartement ✓

Calcul du score:
  + 10 pts (prix OK: 250k <= 300k)
  +  1 pt (bonus marge: 16.7% de réduction)
  +  5 pts (même ville)
  +  3 pts (surface suffisante)
  +  2 pts (même type)
  = 21 POINTS ✅ TRÈS BON MATCH!
```

### ⚠️ EXEMPLE 2: MATCH PARTIEL (11 points)

```
Acheteur cherche:
  - Budget: 200,000€
  - Ville: Marseille
  - Surface minimum: 100m²
  - Type: Maison

Annonce trouvée:
  - Prix: 180,000€ ✓
  - Ville: Lyon ✗ (mauvaise région!)
  - Surface: 120m² ✓
  - Type: Maison ✓

Calcul du score:
  + 10 pts (prix OK)
  +  1 pt (bonus marge: 10%)
  +  3 pts (surface OK)
  +  2 pts (type OK)
  -  5 pts (ville DIFFÉRENTE! ❌)
  = 11 POINTS ⚠️ MOYEN

→ C'est une option, mais pas idéale (mauvaise région)
```

### ❌ EXEMPLE 3: TRÈS MAUVAIS MATCH (-10 points)

```
Acheteur cherche:
  - Budget: 250,000€
  - Ville: Bordeaux
  - Surface minimum: 70m²
  - Type: Appartement

Annonce trouvée:
  - Prix: 350,000€ ✗ (trop cher!)
  - Ville: Nice ✗ (mauvaise région!)
  - Surface: 40m² ✗ (trop petit!)
  - Type: Maison ✗ (pas le bon type!)

Calcul du score:
  +  0 pts (prix TROP ÉLEVÉ: 350k > 250k)
  -  5 pts (ville DIFFÉRENTE)
  +  0 pts (surface INSUFFISANTE)
  -  5 pts (type DIFFÉRENT)
  = -10 POINTS ❌ À IGNORER COMPLÈTEMENT!

→ Ne pas recommander cette annonce
```

---

## 3️⃣ Comment fonctionne l'API

### Endpoint: `POST /matching`

**Input:**
```json
{
  "acheteur_id": 1
}
```

**Output:**
```json
{
  "annonces": [
    {
      "annonce_id": 101,
      "adresse": "45 rue de la Paix, Paris",
      "ville": "Paris",
      "prix": 250000,
      "surface": 75,
      "type_bien": "appartement",
      "score": 21
    },
    {
      "annonce_id": 102,
      "adresse": "12 rue du Jardin, Lyon",
      "ville": "Lyon",
      "prix": 180000,
      "surface": 120,
      "type_bien": "maison",
      "score": 11
    }
  ],
  "total": 2
}
```

**Note:** Les annonces sont triées par SCORE DESCENDANT (les meilleures en premier!)

---

## 4️⃣ Test avec curl

### Exemple de commande curl:

```bash
curl -X POST http://localhost:5000/matching \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "acheteur_id": 1
  }'
```

### Réponse esperée:

```json
{
  "status": "success",
  "annonces": [
    {
      "annonce_id": 101,
      "adresse": "45 rue de la Paix, Paris",
      "ville": "Paris",
      "prix": 250000,
      "surface": 75,
      "type_bien": "appartement",
      "score": 21
    }
  ],
  "total": 1
}
```

---

## 5️⃣ Comment utiliser la fonction Python

### Code simple:

```python
from src.services.matching import MatchingCalculator

# Définir l'annonce
annonce = {
    'prix': 250000,
    'ville': 'Paris',
    'surface': 75,
    'type_bien': 'appartement',
}

# Définir l'acheteur
acheteur = {
    'budget_max': 300000,
    'ville_recherchee': 'Paris',
    'surface_min': 60,
    'type_bien_recherche': 'appartement',
}

# Calculer le score
score = MatchingCalculator.calculate_score(annonce, acheteur)
print(f"Score: {score}")  # Affiche: Score: 21

# Obtenir aussi le détail (utile pour déboguer)
score, details = MatchingCalculator.calculate_score_with_details(annonce, acheteur)
print(details)
# Affiche: {'prix_ok': True, 'ville_ok': True, 'surface_ok': True, 'type_ok': True}
```

---

## 6️⃣ Tuning et ajustements

Si vous voulez **changer les points attribués**, modifiez ces constantes dans `matching.py`:

```python
class MatchingCalculator:
    PRIX_OK_POINTS = 10           # Changer si prix trop/trop peu important
    LOCALISATION_OK_POINTS = 5    # Changer la valeur de localisation
    SURFACE_OK_POINTS = 3         # Changer l'importance de la surface
    TYPE_OK_POINTS = 2            # Changer l'importance du type
    MARGIN_BONUS_STEP = 0.10      # Changer: 0.05 = +1 par 5%, 0.20 = +1 par 20%
    MISMATCH_PENALTY = 5          # Changer la pénalité pour non-match
```

**Exemples d'ajustements:**

| Changement | Effet |
|-----------|--------|
| `LOCALISATION_OK_POINTS = 10` | Rend la localisation 2x plus importante |
| `MISMATCH_PENALTY = 10` | Pénalité plus sévère pour non-match |
| `MARGIN_BONUS_STEP = 0.05` | Bonus plus agressif (10% vs 5%) |

---

## 7️⃣ Questions fréquentes

### Q: Quel score minimum recommander?

**A:** C'est à vous de décider!
- **Score >= 10:** Bonne recommendation
- **Score >= 5:** Moyen (si peu de choix)
- **Score < 0:** À ignorer complètement

Actuellement, on retourne **les 10 meilleures** annonces avec `score >= 5` (seuil minimum pour recommander).

### Q: Et si aucune annonce ne correspond?

**A:** L'API retourne un **tableau vide** avec `"total": 0`.

```json
{
  "status": "success",
  "annonces": [],
  "total": 0,
  "message": "Aucune annonce ne correspond à vos critères"
}
```

### Q: Comment les annonces sont triées?

**A:** Par **SCORE DESCENDANT** (meilleures en premier), puis par DATE (plus récentes en premier).

### Q: Pouvez-vous ajouter d'autres critères?

**A:** OUI! Ajoutez simplement dans la fonction `calculate_score()`:

```python
# Exemple: Ajouter la DPE (classe énergétique)
dpe_ideal = acheteur.get('dpe_ideale', 'D')  # D par défaut
dpe_annonce = annonce.get('dpe', 'G')
if dpe_annonce <= dpe_ideal:
    score += 4  # Maison écologique = bonus!
```

---

## 8️⃣ Optimisation PostgreSQL

Voici les **index SQL** à ajouter pour accélérer les requêtes:

```sql
-- Index pour les colonnes clés du matching
CREATE INDEX idx_annonces_ville ON annonces(ville);
CREATE INDEX idx_annonces_prix ON annonces(prix);
CREATE INDEX idx_annonces_surface ON annonces(surface);
CREATE INDEX idx_annonces_type_bien ON annonces(type_bien);

-- Index combiné (compound index) pour les requêtes complexes
CREATE INDEX idx_annonces_search ON annonces(ville, prix, surface, type_bien);

-- Index pour filtrer par statut publié
CREATE INDEX idx_annonces_statut ON annonces(statut);
```

---

## 9️⃣ Résumé pour Gilbert

✅ **C'est simple!**

1. On prend chaque annonce
2. On compare avec les critères de l'acheteur
3. On donne des points (+) pour ce qui correspond, des pénalités (-) pour ce qui ne va pas
4. **Score élevé = Bonne recommendation** ✨
5. On affiche les meilleures au premier (score décroissant)

**C'est tout!** 🎉

---

**Auteur:** Claude (Expert Backend)
**Date:** Mai 2026
**Version:** 1.0
**Test:** ✅ VALIDÉ
