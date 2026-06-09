# Authentification JWT - Immo2000

## 🔒 Vue d'ensemble

Le système d'authentification JWT de Immo2000 permet de :

✅ **S'inscrire** (`POST /auth/register`) - Créer un nouvel utilisateur
✅ **Se connecter** (`POST /auth/login`) - Recevoir un JWT (access + refresh)
✅ **Protéger les routes** (`@token_required`) - Vérifier le JWT
✅ **Restreindre par rôle** (`@role_required`) - Limiter l'accès à certains rôles
✅ **Récupérer l'utilisateur** (`GET /auth/me`) - Infos de l'utilisateur connecté
✅ **Rafraîchir le token** (`POST /auth/refresh`) - Générer un nouveau access_token

**Rôles supportés** : `vendeur`, `acheteur`, `agent`

---

## 🚀 Configuration

### 1. Variables d'environnement (`.env`)

```env
# JWT
JWT_SECRET_KEY=your_super_secret_jwt_key_change_this_in_production
JWT_ACCESS_TOKEN_EXPIRES_IN=86400  # 24h en secondes
JWT_REFRESH_TOKEN_EXPIRES_IN=604800  # 7 jours en secondes

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/immo2000
```

⚠️ **Important** : En production, générer une clé secrète forte :
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Installation des dépendances

```bash
cd backend
pip install -r requirements.txt
```

Les packages clés :
- `Flask-SQLAlchemy==3.1.1` - ORM
- `PyJWT==2.8.0` - Tokens JWT
- `bcrypt==4.1.2` - Hachage des mots de passe

### 3. Initialiser la base de données

```bash
cd backend
python -c "from src.app import create_app; app = create_app(); app.app_context().push()"
```

Les tables sont créées automatiquement au démarrage.

---

## 📋 Endpoints

### 1️⃣ Inscription (Register)

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "mot_de_passe": "MonMDP123!",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "vendeur",
    "telephone": "+33612345678",
    "adresse_contact": "123 Rue de Paris, 75000"
  }'
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "user_id": 1,
  "email": "user@example.com"
}
```

**Validation des champs:**

| Champ | Type | Requis | Validation |
|-------|------|--------|-----------|
| `email` | string | ✅ | Format valide, unique en base |
| `mot_de_passe` | string | ✅ | Min 8 chars, 1 MAJ, 1 min, 1 chiffre, 1 spécial |
| `nom` | string | ✅ | Non vide |
| `prenom` | string | ✅ | Non vide |
| `role` | string | ✅ | `vendeur`, `acheteur`, ou `agent` |
| `telephone` | string | ❌ | Format libre |
| `adresse_contact` | string | ❌ | Format libre |

**Erreurs possibles:**

| Code | Erreur | Cause |
|------|--------|-------|
| 400 | Email already exists | Email utilisé |
| 400 | Invalid email format | Format invalide |
| 400 | Password must be at least 8 characters | Trop court |
| 400 | role must be one of [...] | Rôle invalide |

---

### 2️⃣ Connexion (Login)

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "mot_de_passe": "MonMDP123!"
  }'
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

**Format du JWT (access_token):**

Le payload contient :
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "role": "vendeur",
  "exp": 1717500000,
  "iat": 1717413600,
  "type": "access"
}
```

**Erreurs possibles:**

| Code | Erreur | Cause |
|------|--------|-------|
| 400 | Email and password are required | Champs manquants |
| 401 | Invalid email or password | Email/password incorrect |
| 403 | User account is deactivated | Compte désactivé |

---

### 3️⃣ Récupérer l'utilisateur (Me)

Retourne les infos de l'utilisateur connecté.

```bash
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**
```json
{
  "utilisateur_id": 1,
  "email": "user@example.com",
  "nom": "Dupont",
  "prenom": "Jean",
  "role": "vendeur",
  "telephone": "+33612345678",
  "adresse_contact": "123 Rue de Paris, 75000",
  "actif": true,
  "date_inscription": "2026-05-04T10:30:00",
  "date_derniere_connexion": "2026-05-04T12:45:00"
}
```

**Erreurs possibles:**

| Code | Erreur | Cause |
|------|--------|-------|
| 401 | Missing or invalid Authorization header | Pas de header Authorization |
| 401 | Invalid or expired token | Token invalide/expiré |
| 404 | User not found | Utilisateur supprimé |

---

### 4️⃣ Rafraîchir le token (Refresh)

Génère un nouvel `access_token` avec un `refresh_token` valide.

```bash
curl -X POST http://localhost:5000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

**Erreurs possibles:**

| Code | Erreur | Cause |
|------|--------|-------|
| 400 | refresh_token is required | Champ manquant |
| 401 | Invalid or expired refresh token | Refresh token expiré/invalide |
| 401 | Invalid token type | Token n'est pas un refresh_token |
| 404 | User not found | Utilisateur supprimé |

---

## 🔐 Protéger les routes

### Exemple 1 : Route protégée simple

```python
from flask import Blueprint
from src.auth.decorators import token_required

bp = Blueprint("biens", __name__, url_prefix="/api")

@bp.route("/biens", methods=["GET"])
@token_required
def get_biens(current_user):
    """
    Récupère les biens de l'utilisateur connecté.

    current_user = {
        "user_id": 1,
        "email": "user@example.com",
        "role": "vendeur",
        "exp": 1717500000
    }
    """
    user_id = current_user["user_id"]
    return {"biens": [...]}
```

**Appel:**
```bash
curl -X GET http://localhost:5000/api/biens \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Exemple 2 : Route avec restriction de rôle

```python
from src.auth.decorators import token_required, role_required

@bp.route("/admin/stats", methods=["GET"])
@token_required
@role_required(roles=["agent"])
def get_stats(current_user):
    """Seuls les agents peuvent accéder."""
    return {"stats": {...}}

# Ou plusieurs rôles
@bp.route("/dashboard", methods=["GET"])
@token_required
@role_required(roles=["vendeur", "agent"])
def get_dashboard(current_user):
    """Vendeurs et agents peuvent accéder."""
    return {"dashboard": {...}}
```

**Appel:**
```bash
# OK si user.role == "agent"
curl -X GET http://localhost:5000/admin/stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 403 Forbidden si user.role != "agent"
```

---

## 📦 Intégration avec les autres modules

### 1. Avec les estimations Melo

```python
# routes/estimations.py
from src.auth.decorators import token_required
from src.melo_api import get_estimation_melo

@bp.route("/estimations", methods=["POST"])
@token_required
def create_estimation(current_user):
    data = request.get_json()

    # Obtenir l'estimation Melo
    result = get_estimation_melo(
        data["adresse"],
        data["surface"],
        data["type_bien"]
    )

    if result["metadata"]["status"] == "success":
        # Sauvegarder en base (voir INTEGRATION_MELO.md)
        estimation_id = save_estimation(result, current_user["user_id"])
        return {"estimation_id": estimation_id, **result}, 201
    else:
        return {"error": result["metadata"]["error"]}, 400
```

### 2. Avec les biens

```python
# routes/biens.py
from src.auth.decorators import token_required
from src.auth.models import User

@bp.route("/biens", methods=["POST"])
@token_required
def create_bien(current_user):
    """Créer un bien. Seul le propriétaire peut créer."""
    if current_user["role"] != "vendeur":
        return {"error": "Only vendors can create properties"}, 403

    data = request.get_json()
    bien = Bien(
        utilisateur_id=current_user["user_id"],
        adresse=data["adresse"],
        surface=data["surface"],
        type_bien=data["type_bien"]
    )
    db.session.add(bien)
    db.session.commit()

    return {"bien_id": bien.bien_id}, 201


@bp.route("/biens/<int:bien_id>", methods=["GET"])
@token_required
def get_bien(current_user, bien_id):
    """Récupérer un bien. Accessible à tous."""
    bien = Bien.query.get(bien_id)
    if not bien:
        return {"error": "Property not found"}, 404

    return bien.to_dict(), 200
```

---

## 🧪 Tests

### Exécuter les tests d'authentification

```bash
cd backend
pytest tests/test_auth.py -v
```

### Exemple de test

```python
def test_register_user(client):
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "mot_de_passe": "MonMDP123!",
        "nom": "Dupont",
        "prenom": "Jean",
        "role": "vendeur"
    })
    assert response.status_code == 201
    assert response.json["message"] == "User created successfully"


def test_login_user(client):
    # Enregistrer
    client.post("/auth/register", json={
        "email": "test@example.com",
        "mot_de_passe": "MonMDP123!",
        "nom": "Dupont",
        "prenom": "Jean",
        "role": "vendeur"
    })

    # Connexion
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "mot_de_passe": "MonMDP123!"
    })
    assert response.status_code == 200
    assert "access_token" in response.json
```

---

## 🔑 Structure du code

```
backend/src/auth/
├── __init__.py           # Exports publics
├── models.py             # Modèle User (SQLAlchemy)
├── utils.py              # JWT, bcrypt utilities
├── decorators.py         # @token_required, @role_required
└── routes.py             # Endpoints /auth/*
```

### Fichiers modifiés

- `src/app.py` - Intégré SQLAlchemy + auth blueprint
- `src/config.py` - Ajouté JWT_SECRET_KEY, expires_in
- `requirements.txt` - Ajouté bcrypt
- `.env.example` - Ajouté variables JWT
- `tests/test_auth.py` - Suite de tests complète

---

## 🎯 Bonnes pratiques

### ✅ À faire

```python
# ✅ Protéger les routes sensibles
@app.route("/admin", methods=["GET"])
@token_required
@role_required(roles=["agent"])
def admin(current_user):
    pass

# ✅ Vérifier le rôle dans la logique
@app.route("/biens", methods=["POST"])
@token_required
def create_bien(current_user):
    if current_user["role"] != "vendeur":
        return {"error": "Only vendors can create"}, 403

# ✅ Utiliser le user_id depuis le token
bien = Bien.query.filter_by(utilisateur_id=current_user["user_id"]).first()

# ✅ Gérer les erreurs d'auth
try:
    response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
except Exception as e:
    logger.error(f"Auth error: {e}")
```

### ❌ À éviter

```python
# ❌ Ne pas faire confiance au user_id du client
user_id = request.json.get("user_id")  # ❌ Dangereux!

# ❌ Ne pas stocker le mot de passe en clair
user.password = request.json.get("password")  # ❌

# ❌ Ne pas exposer le hash du mot de passe
return {"password_hash": user.password_hash}  # ❌

# ❌ Ne pas stocker la clé JWT en dur
JWT_SECRET_KEY = "hardcoded_secret"  # ❌

# ❌ Ne pas accepter n'importe quel rôle
user.role = request.json.get("role")  # ❌ À valider!
```

---

## 🚀 Déploiement en production

### Checklist

- [ ] `JWT_SECRET_KEY` définie (clé forte de 32+ chars)
- [ ] `FLASK_ENV=production` dans .env
- [ ] Base de données PostgreSQL externe (pas SQLite)
- [ ] HTTPS/TLS activé
- [ ] Logging configuré
- [ ] Rate limiting implémenté (optionnel)
- [ ] Tokens expiration courts (24h max pour access_token)
- [ ] Refresh token en HTTP-only cookie (optionnel, plus sûr)

### Exemple de production

```env
FLASK_ENV=production
JWT_SECRET_KEY=your_strong_secret_key_32_chars_min
JWT_ACCESS_TOKEN_EXPIRES_IN=3600  # 1h au lieu de 24h
JWT_REFRESH_TOKEN_EXPIRES_IN=604800  # 7 jours
DATABASE_URL=postgresql://prod_user:prod_pass@prod_db:5432/immo2000
```

---

## 📚 Ressources

- **JWT Standard** : https://jwt.io/
- **bcrypt** : https://github.com/pyca/bcrypt
- **Flask-SQLAlchemy** : https://flask-sqlalchemy.palletsprojects.com/
- **Security Best Practices** : https://owasp.org/www-project-web-security-testing-guide/

---

**Version** : 1.0
**Dernière mise à jour** : 2026-05-04
