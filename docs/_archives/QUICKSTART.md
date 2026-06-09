# 🚀 Annonces API - Démarrage Rapide

Intégrez l'API Annonces en 5 minutes. Pour la documentation complète, voir [INDEX.md](INDEX.md).

---

## 1️⃣ Authentification

Toutes les opérations de création/modification requièrent un JWT token.

```bash
# Récupérez votre token via /auth/login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendeur@example.com",
    "password": "yourpassword"
  }'

# Réponse :
# {
#   "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "user_id": 123,
#   "role": "vendeur"
# }

TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."
```

---

## 2️⃣ Créer une Annonce

```bash
curl -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Maison 4 pièces à Paris",
    "description": "Belle maison lumineuse avec jardin",
    "prix": 500000.0,
    "surface": 120.5,
    "adresse": "12 rue de la Paix",
    "code_postal": "75002",
    "ville": "Paris",
    "type_bien": "maison",
    "nombre_pieces": 4,
    "photos": ["url1", "url2"],
    "jardin": true,
    "dpe": "C",
    "annee_construction": 2010
  }'

# Réponse (201 Created) :
# {
#   "annonce_id": 1,
#   "titre": "Maison 4 pièces à Paris",
#   "prix": 500000.0,
#   "statut": "brouillon",
#   "date_creation": "2026-05-04T10:00:00",
#   ...
# }
```

**Note :** L'annonce est créée en statut `"brouillon"` par défaut.

---

## 3️⃣ Lister les Annonces

```bash
# Lister toutes les annonces (public, pas d'auth)
curl http://localhost:5000/api/v1/annonces?limit=10&skip=0

# Avec filtres
curl "http://localhost:5000/api/v1/annonces?ville=Paris&type_bien=maison&prix_max=600000"

# Recherche texte
curl "http://localhost:5000/api/v1/annonces?search=jardin"

# Réponse (200 OK) :
# {
#   "items": [
#     {
#       "annonce_id": 1,
#       "titre": "Maison 4 pièces à Paris",
#       ...
#     }
#   ],
#   "total": 1,
#   "skip": 0,
#   "limit": 10
# }
```

---

## 4️⃣ Récupérer une Annonce (Public)

```bash
curl http://localhost:5000/api/v1/annonces/1

# Réponse (200 OK) :
# {
#   "annonce_id": 1,
#   "titre": "Maison 4 pièces à Paris",
#   "prix": 500000.0,
#   "statut": "brouillon",
#   ...
# }
```

---

## 5️⃣ Mettre à Jour une Annonce

```bash
curl -X PUT http://localhost:5000/api/v1/annonces/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prix": 480000.0,
    "description": "Belle maison rénovée avec jardin et piscine"
  }'

# Réponse (200 OK) avec les données mises à jour
```

**Note :** Seul le propriétaire peut mettre à jour. Erreur 403 sinon.

---

## 6️⃣ Publier une Annonce (BONUS)

```bash
curl -X POST http://localhost:5000/api/v1/annonces/1/publier \
  -H "Authorization: Bearer $TOKEN"

# Réponse (200 OK) :
# {
#   "annonce_id": 1,
#   "statut": "publiée",  # ← Changé de "brouillon"
#   ...
# }
```

---

## 7️⃣ Supprimer une Annonce

```bash
curl -X DELETE http://localhost:5000/api/v1/annonces/1 \
  -H "Authorization: Bearer $TOKEN"

# Réponse (204 No Content) - pas de body
```

**Note :** Seul le propriétaire peut supprimer.

---

## 🎯 Résumé des Endpoints

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/v1/annonces` | ✅ JWT | Créer annonce |
| GET | `/api/v1/annonces` | ❌ Public | Lister & filtrer |
| GET | `/api/v1/annonces/{id}` | ❌ Public | Récupérer annonce |
| PUT | `/api/v1/annonces/{id}` | ✅ JWT + Owner | Mettre à jour |
| DELETE | `/api/v1/annonces/{id}` | ✅ JWT + Owner | Supprimer |
| POST | `/api/v1/annonces/{id}/publier` | ✅ JWT + Owner | Publier [BONUS] |

---

## ⚠️ Codes Erreur Courants

| Code | Raison | Solution |
|------|--------|----------|
| **400** | Validation échouée (prix, code postal, etc.) | Vérifier les données |
| **401** | Token manquant ou expiré | Récupérer un nouveau token |
| **403** | Non-propriétaire | Utilisez votre propre annonce |
| **404** | Annonce non trouvée | Vérifier l'annonce_id |
| **422** | Opération invalide (ex: publier déjà publiée) | Vérifier l'état |

---

## 📚 Prochaines Étapes

- 📖 Voir [Référence API](API_REFERENCE.md) pour tous les détails
- 💻 Voir [Exemples](EXAMPLES.md) pour des patterns courants
- 🔍 Voir [Schémas](SCHEMAS.md) pour les énumérations & validations
- 🏗️ Voir [Architecture](ARCHITECTURE.md) pour la conception

---

**Besoin d'aide ?** → Consultez [INDEX.md](INDEX.md) 🎯
