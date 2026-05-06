# 📋 Guide d'Utilisation du Endpoint /matching

## 🚀 Démarrage rapide

### 1. Prérequis

- Flask en cours d'exécution (`python -m flask run`)
- JWT token valide (obtenu via `/auth/login`)
- Un profil acheteur créé dans la BD (table `acheteurs`)

### 2. Endpoint URL

```
POST /api/v1/matching
```

**Base:** `http://localhost:5000`

### 3. Headers requis

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 📨 Exemples d'Appels

### Exemple 1: Matching avec acheteur_id spécifié

```bash
curl -X POST http://localhost:5000/api/v1/matching \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "acheteur_id": 1
  }'
```

**Response (200 OK):**
```json
{
  "status": "success",
  "annonces": [
    {
      "annonce_id": 101,
      "adresse": "45 rue de la Paix, Paris 75001",
      "titre": "Charmant appartement proche Opéra",
      "ville": "Paris",
      "prix": 250000,
      "surface": 75,
      "type_bien": "appartement",
      "score": 21,
      "date_creation": "2026-05-01T10:30:00"
    },
    {
      "annonce_id": 102,
      "adresse": "12 rue du Jardin, Lyon 69003",
      "titre": "Belle maison avec jardin",
      "ville": "Lyon",
      "prix": 180000,
      "surface": 120,
      "type_bien": "maison",
      "score": 11,
      "date_creation": "2026-04-28T15:45:00"
    }
  ],
  "total": 2,
  "message": "2 annonce(s) trouvée(s) (sur 2 avec score >= 5)",
  "acheteur": {
    "acheteur_id": 1,
    "budget_max": 300000,
    "ville": "Paris",
    "surface_min": 60,
    "type_bien": "appartement"
  }
}
```

### Exemple 2: Matching sans acheteur_id (utilise le profil de l'utilisateur courant)

```bash
curl -X POST http://localhost:5000/api/v1/matching \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Exemple 3: Aucune annonce ne correspond (score < 0 filtré)

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/matching \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{"acheteur_id": 4}'
```

**Response (200 OK):**
```json
{
  "status": "success",
  "annonces": [],
  "total": 0,
  "message": "0 annonce(s) trouvée(s) (sur 0 avec score >= 5)",
  "acheteur": {
    "acheteur_id": 4,
    "budget_max": 150000,
    "ville": "Bordeaux",
    "surface_min": 200,
    "type_bien": "villa"
  }
}
```

---

## ❌ Cas d'Erreur

### 401 - Non authentifié

```bash
curl -X POST http://localhost:5000/api/v1/matching \
  -H "Content-Type: application/json" \
  -d '{"acheteur_id": 1}'
```

**Response (401 Unauthorized):**
```json
{
  "error": "Token missing or invalid",
  "code": "UNAUTHORIZED"
}
```

### 404 - Acheteur non trouvé

```bash
curl -X POST http://localhost:5000/api/v1/matching \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{"acheteur_id": 99999}'
```

**Response (404 Not Found):**
```json
{
  "status": "error",
  "message": "Acheteur 99999 non trouvé",
  "code": "ACHETEUR_NOT_FOUND"
}
```

### 500 - Erreur serveur

```json
{
  "status": "error",
  "message": "Erreur serveur: [détail de l'erreur]",
  "code": "SERVER_ERROR"
}
```

---

## 📊 Endpoint statistiques

### Récupérer les stats (nombre d'annonces, d'acheteurs, etc.)

```bash
curl -X GET http://localhost:5000/api/v1/matching/stats \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "status": "success",
  "total_annonces": 150,
  "annonces_publiees": 120,
  "total_acheteurs": 45,
  "acheteurs_actifs": 40
}
```

---

## 🔧 Configuration

### Fichier: `backend/src/routes/matching.py`

```python
MAX_RESULTS = 10                # Limiter à 10 annonces max (les meilleures)
MIN_SCORE_THRESHOLD = 5         # Score minimum pour recommander une annonce
```

**Ajustements possibles:**

| Paramètre | Valeur actuelle | Effet si augmenté |
|-----------|-----------------|-------------------|
| `MAX_RESULTS` | 10 | Retourner plus d'annonces (exemple: 20) |
| `MIN_SCORE_THRESHOLD` | 5 | Filtrer les matchs faibles |

**Exemple: Seuil plus strict (score >= 10)**
```python
MIN_SCORE_THRESHOLD = 10  # Plus sévère, uniquement les excellents matchs
```

---

## 🧪 Tests Unitaires

### Lancer les tests de la fonction calculate_score()

```bash
cd backend
python -m pytest tests/test_matching.py -v
```

### Lancer tout avec le script bash

```bash
chmod +x scripts/test_matching.sh
./scripts/test_matching.sh
```

---

## 📐 Algorithme de Scoring

Voir [MATCHING_ALGORITHM.md](../MATCHING_ALGORITHM.md) pour l'explication détaillée.

**Résumé rapide:**
- **+10 pts:** Prix acceptable
- **+5 pts:** Même ville
- **+3 pts:** Surface suffisante
- **+2 pts:** Même type de bien
- **+1 pt:** Pour chaque 10% de marge de prix
- **-5 pts:** Ville/type différents (pénalité)

---

## 🐛 Déboguer

### Voir les détails du scoring pour une annonce

Utilisez la méthode `calculate_score_with_details()`:

```python
from src.services.matching import MatchingCalculator

score, details = MatchingCalculator.calculate_score_with_details(annonce, acheteur)
print(f"Score: {score}")
print(f"Détails: {details}")
# Affiche: Détails: {'prix_ok': True, 'ville_ok': False, 'surface_ok': True, 'type_ok': True}
```

### Activer les logs de debug

```bash
export FLASK_DEBUG=1
python -m flask run
```

Cherchez les prints dans `matching.py`:
```python
# DEBUG: Pour Gilbert
# print(f"  💰 BONUS MARGE: {marge_percentage*100:.1f}% → +{bonus_points} pts")
```

---

## 📚 Ressources supplémentaires

- [MATCHING_ALGORITHM.md](../MATCHING_ALGORITHM.md) - Explication de l'algorithme
- [src/services/matching.py](../backend/src/services/matching.py) - Code du scoring
- [src/routes/matching.py](../backend/src/routes/matching.py) - Code du endpoint
- [tests/test_matching.py](../backend/tests/test_matching.py) - Tests unitaires
- [database/create_acheteurs_and_indexes.sql](../database/create_acheteurs_and_indexes.sql) - Tables SQL

---

**Auteur:** Claude
**Date:** Mai 2026
**Version:** 1.0
**Status:** ✅ Validé et documenté
