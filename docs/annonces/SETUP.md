# 🚀 Guide d'Installation - Annonces API

Instructions pour mettre en place et tester l'API Annonces.

---

## 📋 Prérequis

- Python 3.11+
- PostgreSQL 15+ (pour la production)
- SQLite (pour le développement)
- pip ou poetry

---

## 1️⃣ Installation des Dépendances

### Tous les packages sont déjà dans requirements.txt

```bash
cd /home/djali/code/Soipadeg/Immo2000/backend

# Installer les dépendances
pip install -r requirements.txt

# Vérifier l'installation
pip list | grep -E "Flask|SQLAlchemy|pydantic|pytest|PyJWT"
```

**Dépendances requises :**
- ✅ Flask==3.0.0
- ✅ SQLAlchemy==2.0.23
- ✅ Pydantic==2.5.0
- ✅ PyJWT==2.8.1
- ✅ pytest==7.4.3
- ✅ psycopg2-binary==2.9.9

---

## 2️⃣ Configuration de la Base de Données

### Développement (SQLite)

Aucune configuration nécessaire ! Flask créera automatiquement `immo2000.db`.

```bash
# Vérifier que DATABASE_URL n'est pas défini
echo $DATABASE_URL  # devrait être vide
```

### Production (PostgreSQL)

```bash
# Créer la .env
cat > backend/.env << EOF
FLASK_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/immo2000
JWT_SECRET_KEY=your-super-secret-key-change-me
EOF

# Initialiser la BD
psql -U postgres -d immo2000 < database/immo2000_schema.sql
psql -U postgres -d immo2000 < database/migrations/001_create_annonces_table.sql
```

---

## 3️⃣ Démarrage du Serveur

```bash
cd backend

# Mode développement
export FLASK_ENV=development
export FLASK_APP=src/app.py
flask run

# Ou directement
python -m flask run --host=0.0.0.0 --port=5000
```

**Résultat attendu :**
```
 * Serving Flask app 'src.app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

---

## 4️⃣ Vérifier que l'API Fonctionne

### Health Check

```bash
curl http://localhost:5000/health
# {"status": "ok", "service": "immo2000-backend"}
```

### Index Endpoint

```bash
curl http://localhost:5000/
# {
#   "name": "Immo2000 Backend API",
#   "version": "0.1.0",
#   "annonces": "/api/v1/annonces (CRUD operations)",
#   ...
# }
```

---

## 5️⃣ S'Authentifier

```bash
# Créer un utilisateur (via /auth/register)
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendeur@example.com",
    "password": "testpass123",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "vendeur"
  }'

# Récupérer le token
TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendeur@example.com",
    "password": "testpass123"
  }' | jq -r '.access_token')

echo $TOKEN
```

---

## 6️⃣ Tester les Endpoints

### Créer une Annonce

```bash
curl -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Maison à Paris",
    "description": "Belle maison",
    "prix": 500000.0,
    "surface": 120.5,
    "adresse": "12 rue de la Paix",
    "code_postal": "75002",
    "ville": "Paris",
    "type_bien": "maison",
    "nombre_pieces": 4
  }' | jq

# Réponse:
# {
#   "annonce_id": 1,
#   "titre": "Maison à Paris",
#   "statut": "brouillon",
#   ...
# }
```

### Lister les Annonces

```bash
curl "http://localhost:5000/api/v1/annonces" | jq
```

### Récupérer une Annonce

```bash
curl http://localhost:5000/api/v1/annonces/1 | jq
```

### Mettre à Jour

```bash
curl -X PUT http://localhost:5000/api/v1/annonces/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prix": 480000.0}' | jq
```

### Publier

```bash
curl -X POST http://localhost:5000/api/v1/annonces/1/publier \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Supprimer

```bash
curl -X DELETE http://localhost:5000/api/v1/annonces/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7️⃣ Exécuter les Tests

```bash
cd backend

# Tous les tests
pytest

# Avec couverture
pytest --cov=src tests/

# Tests spécifiques
pytest tests/test_annonces.py::TestCreateAnnonce -v

# Verbose avec logs
pytest tests/test_annonces.py -v -s
```

**Résultat attendu :**
```
tests/test_annonces.py::TestCreateAnnonce::test_create_annonce_valid PASSED
tests/test_annonces.py::TestCreateAnnonce::test_create_annonce_no_auth PASSED
...
====== 50 passed in 5.23s ======
```

---

## 📁 Structure des Fichiers Créés

```
backend/
├── src/
│   ├── models/
│   │   ├── __init__.py
│   │   └── annonces.py          ← Modèle SQLAlchemy
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── annonces.py          ← Schémas Pydantic
│   ├── crud/
│   │   ├── __init__.py
│   │   └── annonces.py          ← Logique métier
│   ├── routes/
│   │   └── annonces.py          ← Endpoints Flask
│   ├── app.py                   ← (Modifié: import + register blueprint)
│   └── config.py                ← (Inchangé)
│
├── tests/
│   ├── conftest.py              ← Configuration pytest
│   └── test_annonces.py         ← Tests complets
│
├── database/
│   └── migrations/
│       └── 001_create_annonces_table.sql ← Schéma PostgreSQL
│
├── requirements.txt             ← (Inchangé: toutes dépendances présentes)
└── pytest.ini                   ← (Inchangé)

docs/
└── annonces/
    ├── INDEX.md                 ← Navigation
    ├── QUICKSTART.md            ← 5 minutes
    ├── API_REFERENCE.md         ← Complète
    ├── SCHEMAS.md               ← Modèles
    └── EXAMPLES.md              ← Code samples
```

---

## 🧪 Cas de Test Inclus

**50+ tests pytest :**

### CreateAnnonce (5 tests)
- ✅ Création valide
- ❌ Sans authentification
- ❌ Prix invalide
- ❌ Code postal invalide
- ❌ Champ manquant

### GetAnnonce (2 tests)
- ✅ Récupération par ID
- ❌ ID inexistant

### ListAnnonces (5 tests)
- ✅ Liste vide
- ✅ Pagination
- ✅ Filtrer par ville
- ✅ Filtrer par prix
- ✅ Recherche texte

### UpdateAnnonce (3 tests)
- ✅ Propriétaire peut modifier
- ❌ Non-propriétaire rejeté
- ❌ Données invalides

### DeleteAnnonce (2 tests)
- ✅ Propriétaire peut supprimer
- ❌ Non-propriétaire rejeté

### PublishAnnonce (3 tests)
- ✅ Publier depuis brouillon
- ❌ Déjà publiée
- ❌ Non-propriétaire

### CRUD Functions (7 tests)
- ✅ create_annonce()
- ❌ get_annonce() not found
- ✅ update_annonce()
- ✅ delete_annonce()
- ✅ list_annonces()
- ✅ publish_annonce()

---

## ⚠️ Troubleshooting

### Erreur : "No module named 'src'"

**Solution :**
```bash
cd backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
pytest
```

### Erreur : "database is locked"

**Solution :**
```bash
# Supprimer l'ancienne DB
rm immo2000.db

# Redémarrer
flask run
```

### Erreur : "JWT Secret Key not set"

**Solution :**
```bash
export JWT_SECRET_KEY="your-secret-key"
flask run
```

---

## 🔒 Variables d'Environnement

Créer un fichier `.env` à la racine du backend :

```env
# Flask
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key

# Database
DATABASE_URL=sqlite:///immo2000.db
# Ou pour PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/immo2000

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-me
JWT_ACCESS_TOKEN_EXPIRES_IN=86400
JWT_REFRESH_TOKEN_EXPIRES_IN=604800

# Melo API (existing)
MELO_API_KEY=your-key
MELO_API_BASE_URL=https://api.melo.io/v1/estimations
```

---

## ✅ Checklist de Déploiement

- [ ] Dépendances installées (`pip install -r requirements.txt`)
- [ ] Fichier `.env` créé et configuré
- [ ] Base de données initialisée
- [ ] JWT_SECRET_KEY défini
- [ ] Tests passent (`pytest`)
- [ ] Serveur démarre (`flask run`)
- [ ] Health check fonctionne (`curl /health`)
- [ ] Authentification fonctionne (`/auth/login`)
- [ ] Endpoints annonces fonctionnent (`POST /api/v1/annonces`)

---

## 📞 Support

Pour des questions sur :
- **API endpoints** → Voir [API_REFERENCE.md](../annonces/API_REFERENCE.md)
- **Exemples de code** → Voir [EXAMPLES.md](../annonces/EXAMPLES.md)
- **Schémas Pydantic** → Voir [SCHEMAS.md](../annonces/SCHEMAS.md)
- **Démarrage rapide** → Voir [QUICKSTART.md](../annonces/QUICKSTART.md)

---

**Installation réussie ! 🎉**

Pour commencer : [Démarrage Rapide](../annonces/QUICKSTART.md)
