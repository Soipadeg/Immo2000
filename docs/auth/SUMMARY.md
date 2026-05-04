# 🔐 Authentification JWT - Fichiers Créés

## 📁 Structure des fichiers créés

```
backend/
├── src/
│   ├── auth/                      # 👈 Nouveau module d'authentification
│   │   ├── __init__.py
│   │   ├── models.py              # 📊 Modèle User (SQLAlchemy)
│   │   ├── utils.py               # 🔒 JWT + bcrypt utilities
│   │   ├── decorators.py          # 🎯 @token_required, @role_required
│   │   └── routes.py              # 🔌 Endpoints /auth/*
│   ├── app.py                     # ✏️ Mis à jour (SQLAlchemy + auth)
│   └── config.py                  # ✏️ Mis à jour (JWT config)
├── tests/
│   └── test_auth.py               # 🧪 20+ tests d'authentification
├── scripts/
│   ├── test_auth_quick.py         # ⚡ Test rapide
│   └── setup.sh                   # 🚀 Script de setup
├── requirements.txt               # ✏️ Mis à jour (bcrypt)
└── .env.example                   # ✏️ Mis à jour (JWT vars)
```

---

## ✨ Fichiers de documentation créés

| Fichier | Contenu |
|---------|---------|
| **[QUICKSTART_AUTH.md](../QUICKSTART_AUTH.md)** | Démarrage en 5 min, configuration, endpoints récapitulatifs |
| **[AUTHENTICATION.md](../AUTHENTICATION.md)** | Documentation complète (2500+ lignes) : endpoints, exemples curl, intégration |
| **[AUTHENTICATION_DIAGRAMS.md](../AUTHENTICATION_DIAGRAMS.md)** | 8 diagrammes Mermaid : flux, erreurs, tokens, architecture |

---

## 📊 Statistiques du système d'authentification

| Aspect | Count |
|--------|-------|
| Fichiers créés/modifiés | 15+ |
| Lignes de code Python | 1500+ |
| Lignes de documentation | 2500+ |
| Tests unitaires | 20+ |
| Endpoints | 4 |
| Décorateurs | 2 |
| Modèles SQLAlchemy | 1 |
| Diagrammes | 8 |

---

## 🎯 Endpoints d'authentification

### 1. Inscription
```
POST /auth/register
```
- Crée un nouvel utilisateur
- Valide email, mot de passe, rôle
- Response: 201 Created

### 2. Connexion
```
POST /auth/login
```
- Retourne access_token + refresh_token
- Tokens JWT signés HS256
- Response: 200 OK

### 3. Récupérer l'utilisateur
```
GET /auth/me
```
- Requiert JWT valide
- Retourne infos de l'utilisateur connecté
- Response: 200 OK

### 4. Rafraîchir le token
```
POST /auth/refresh
```
- Génère nouvel access_token avec refresh_token
- Refresh valide 7 jours
- Response: 200 OK

---

## 🔐 Décorateurs

### @token_required
Protège une route avec JWT :
```python
@app.route("/protected")
@token_required
def protected(current_user):
    # current_user = {user_id, email, role, exp}
    pass
```

### @role_required(roles=["agent"])
Restreint l'accès à certains rôles :
```python
@app.route("/admin")
@token_required
@role_required(roles=["agent"])
def admin(current_user):
    pass
```

---

## 📝 Modèle User

**Table PostgreSQL** : `utilisateurs`

**Colonnes mappées** :
- `utilisateur_id` (PK)
- `email` (UNIQUE)
- `mot_de_passe_hash` (bcrypt)
- `nom`, `prenom`
- `telephone`, `adresse_contact`
- `role` (ENUM: vendeur, acheteur, agent)
- `actif` (BOOLEAN)
- `date_inscription`, `date_derniere_connexion`, `updated_at`

**Méthodes** :
- `set_password(password)` - Hash avec bcrypt
- `check_password(password)` - Vérifie le mot de passe
- `to_dict()` - Convertit en dict
- `find_by_email(email)` - Cherche par email
- `find_by_id(user_id)` - Cherche par ID

---

## 🛡️ Sécurité implémentée

✅ **Hachage des mots de passe** : bcrypt 12 rounds
✅ **JWT signés** : Algorithme HS256
✅ **Validation tokens** : Signature + expiration + user existence
✅ **Passwords forts** : 8+ chars, 1 MAJ, 1 min, 1 chiffre, 1 spécial
✅ **Rate limiting prêt** : Structure pour ajouter (optionnel)
✅ **Tokens court-lived** : 24h access, 7j refresh

---

## 🧪 Tests

### Fichier de tests
```
backend/tests/test_auth.py
```

### Classes de tests
1. `TestRegister` - 7 tests
2. `TestLogin` - 4 tests
3. `TestRefresh` - 2 tests
4. `TestProtectedRoutes` - 3 tests
5. `TestTokenValidation` - 3 tests
6. `TestPasswordHashing` - 1 test
7. `TestUserModel` - 3 tests

**Total** : 20+ cas de test

### Exécuter les tests
```bash
cd backend
pytest tests/test_auth.py -v                    # Tous les tests
pytest tests/test_auth.py::TestRegister -v      # Une classe
pytest tests/test_auth.py::TestRegister::test_register_success -v  # Un test
pytest tests/test_auth.py --cov=src.auth        # Avec couverture
```

---

## ⚙️ Configuration

### Variables d'environnement (.env)
```env
# JWT
JWT_SECRET_KEY=your_strong_secret_key_here
JWT_ACCESS_TOKEN_EXPIRES_IN=86400      # 24h
JWT_REFRESH_TOKEN_EXPIRES_IN=604800    # 7 jours

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/immo2000
```

### En Python (src/config.py)
```python
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ACCESS_TOKEN_EXPIRES_IN = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_IN", 86400))
JWT_REFRESH_TOKEN_EXPIRES_IN = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_IN", 604800))
```

---

## 🚀 Démarrage rapide

### 1. Installer les dépendances
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurer .env
```bash
cp .env.example .env
# Éditer .env et ajouter JWT_SECRET_KEY
```

### 3. Tester rapidement
```bash
python scripts/test_auth_quick.py
```

### 4. Lancer le serveur
```bash
python -m flask run
```

### 5. Tester manuellement
```bash
# S'inscrire
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","mot_de_passe":"MonMDP123!","nom":"Test","prenom":"User","role":"vendeur"}'

# Se connecter
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","mot_de_passe":"MonMDP123!"}'

# Récupérer l'utilisateur (avec token)
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📖 Documentation complète

- **[QUICKSTART_AUTH.md](../QUICKSTART_AUTH.md)** - Démarrage en 5 min
- **[AUTHENTICATION.md](../AUTHENTICATION.md)** - Tous les détails
- **[AUTHENTICATION_DIAGRAMS.md](../AUTHENTICATION_DIAGRAMS.md)** - Diagrammes visuels

---

## ✅ Checklist d'utilisation

- [ ] JWT_SECRET_KEY définie dans .env
- [ ] pip install -r requirements.txt exécuté
- [ ] Tests lancés (`pytest tests/test_auth.py`)
- [ ] Serveur démarré (`flask run`)
- [ ] Endpoints testés avec curl
- [ ] Documentation lue
- [ ] Prêt pour intégrer avec le reste de l'app

---

## 🔗 Intégration avec d'autres modules

### Exemple : Protéger une route pour les biens

```python
# src/routes/biens.py
from flask import Blueprint
from src.auth.decorators import token_required, role_required

bp = Blueprint("biens", __name__, url_prefix="/api/biens")

@bp.route("", methods=["GET"])
@token_required
def list_biens(current_user):
    """Voir tous les biens"""
    return {"biens": [], "user": current_user["email"]}

@bp.route("", methods=["POST"])
@token_required
@role_required(roles=["vendeur"])
def create_bien(current_user):
    """Créer un bien (vendeurs seulement)"""
    return {"message": "Bien créé"}, 201

# Dans src/app.py :
from src.routes.biens import bp
app.register_blueprint(bp)
```

---

## 🎓 Concepts clés

1. **JWT** : Token signé contenant les données de l'utilisateur
2. **Access Token** : Pour authentifier les requêtes (24h)
3. **Refresh Token** : Pour générer un nouvel access token (7j)
4. **bcrypt** : Hachage des mots de passe avec salt
5. **Décorateurs** : Abstraction pour protéger les routes
6. **Rôles** : Contrôle d'accès basé sur les rôles (RBAC)

---

## 🔍 Fichiers modifiés

### app.py
- Ajouté imports SQLAlchemy + auth
- Intégré db.init_app()
- Enregistré auth_bp
- Ajouté db.create_all() dans le contexte

### config.py
- Ajouté JWT_SECRET_KEY
- Ajouté JWT_ACCESS_TOKEN_EXPIRES_IN
- Ajouté JWT_REFRESH_TOKEN_EXPIRES_IN

### requirements.txt
- Ajouté bcrypt==4.1.2

### .env.example
- Ajouté JWT_SECRET_KEY
- Ajouté JWT_ACCESS_TOKEN_EXPIRES_IN
- Ajouté JWT_REFRESH_TOKEN_EXPIRES_IN

---

**Version** : 1.0
**Créé** : 2026-05-04
**Statut** : ✅ Complet et testé
