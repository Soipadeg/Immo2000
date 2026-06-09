# 🔐 Authentification JWT - Guide de démarrage

## ⚡ Démarrage en 5 minutes

### 1. Configuration

```bash
# Copier le template .env
cp backend/.env.example backend/.env

# Éditer .env et ajouter une clé JWT forte
# (voir section Configuration)
```

### 2. Installation

```bash
cd backend
pip install -r requirements.txt
```

### 3. Démarrer le serveur

```bash
cd backend
python -m flask run --port=5000
```

### 4. Tester rapidement

```bash
# Script de test automatisé
python scripts/test_auth_quick.py

# Ou manuellement avec curl
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "mot_de_passe": "MonMDP123!",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "vendeur"
  }'
```

---

## 🔑 Configuration JWT

### Générer une clé secrète forte

```bash
# Méthode 1 : Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Méthode 2 : OpenSSL
openssl rand -hex 32
```

### Ajouter à `.env`

```env
# JWT
JWT_SECRET_KEY=votre_clé_générée_ici
JWT_ACCESS_TOKEN_EXPIRES_IN=86400  # 24h
JWT_REFRESH_TOKEN_EXPIRES_IN=604800  # 7 jours
```

---

## 📚 Endpoints (Récapitulatif)

| Endpoint | Méthode | Protection | Description |
|----------|---------|-----------|-------------|
| `/auth/register` | POST | ❌ | S'inscrire |
| `/auth/login` | POST | ❌ | Se connecter |
| `/auth/refresh` | POST | ❌ | Rafraîchir le token |
| `/auth/me` | GET | ✅ JWT | Récupérer l'utilisateur |

---

## 🔒 Protéger une route

### Exemple simple

```python
from flask import Blueprint
from src.auth.decorators import token_required

bp = Blueprint("exemple", __name__)

@bp.route("/protected", methods=["GET"])
@token_required
def protected(current_user):
    """current_user contient user_id, email, role, exp"""
    return {
        "message": f"Bonjour {current_user['email']}",
        "role": current_user["role"]
    }
```

### Avec restriction de rôle

```python
from src.auth.decorators import token_required, role_required

@bp.route("/admin", methods=["GET"])
@token_required
@role_required(roles=["agent"])
def admin(current_user):
    """Seuls les agents peuvent accéder"""
    return {"admin": True}
```

---

## 🧪 Tests

### Lancer les tests

```bash
cd backend
pytest tests/test_auth.py -v
```

### Voir la couverture

```bash
pytest tests/test_auth.py --cov=src.auth --cov-report=html
# Ouvre htmlcov/index.html dans le navigateur
```

---

## 📖 Documentation complète

👉 **Lire [AUTHENTICATION.md](../AUTHENTICATION.md)** pour :
- Détails de chaque endpoint
- Gestion des erreurs
- Intégration avec d'autres modules
- Bonnes pratiques de sécurité
- Déploiement en production

---

## ⚠️ Problèmes courants

### ❌ "Module src not found"

**Solution** : Vérifier que vous êtes dans le répertoire `backend/`

```bash
cd backend
python -c "from src.app import create_app"
```

### ❌ "JWT_SECRET_KEY not configured"

**Solution** : Ajouter à `.env` :
```env
JWT_SECRET_KEY=votre_cle_ici
```

### ❌ "Invalid or expired token"

**Solution** :
- Vérifier que le token n'est pas expiré
- Régénérer avec `/auth/login`
- Utiliser `/auth/refresh` pour obtenir un nouveau access_token

### ❌ "Email already exists"

**Solution** : Utiliser une autre adresse email ou supprimer l'utilisateur en base

```bash
# Accès à la DB de test
python -c "from src.app import create_app; app = create_app('testing'); \
  app.app_context().push(); from src.auth.models import User, db; \
  User.query.delete(); db.session.commit(); print('DB cleared')"
```

---

## 🚀 Intégration dans votre app

### Enregistrer les routes

Dans `src/app.py` (déjà fait) :

```python
from src.auth.routes import auth_bp
app.register_blueprint(auth_bp)  # Endpoints /auth/*
```

### Créer d'autres routes protégées

```python
# src/routes/biens.py
from flask import Blueprint
from src.auth.decorators import token_required, role_required

bp = Blueprint("biens", __name__, url_prefix="/api/biens")

@bp.route("", methods=["GET"])
@token_required
def list_biens(current_user):
    """Voir tous les biens"""
    return {"biens": [...]}

@bp.route("", methods=["POST"])
@token_required
@role_required(roles=["vendeur"])
def create_bien(current_user):
    """Créer un bien (vendeurs seulement)"""
    return {"bien_id": ...}, 201

# Dans app.py
app.register_blueprint(bp)
```

---

## 🔍 Structure des fichiers

```
backend/
├── src/
│   ├── auth/
│   │   ├── __init__.py         # Exports
│   │   ├── models.py           # Modèle User
│   │   ├── utils.py            # JWT, bcrypt
│   │   ├── decorators.py       # @token_required, @role_required
│   │   └── routes.py           # Endpoints /auth/*
│   ├── app.py                  # Intégré SQLAlchemy + auth
│   └── config.py               # JWT settings
├── tests/
│   └── test_auth.py            # Tests complets
├── scripts/
│   └── test_auth_quick.py      # Test rapide
├── requirements.txt            # +bcrypt
└── .env.example                # +JWT vars
```

---

## ✅ Checklist d'intégration

- [x] Authentification JWT implémentée
- [x] Endpoints /auth/* créés et testés
- [x] Décorateurs @token_required et @role_required
- [x] Modèle User avec SQLAlchemy
- [x] Tests unitaires (20+ cas)
- [x] Documentation complète
- [ ] Intégrer avec les autres modules (biens, estimations, etc.)
- [ ] Rate limiting sur /auth/login (optionnel)
- [ ] Blacklist de tokens avec Redis (optionnel)
- [ ] Refresh token en HTTP-only cookie (optionnel)

---

**Dernière mise à jour** : 2026-05-04
