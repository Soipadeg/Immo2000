#!/usr/bin/env bash
# 🔐 Guide d'Intégration - Authentification JWT avec PostgreSQL & Melo API

cat << 'EOF'
╔════════════════════════════════════════════════════════════════════════╗
║   🔐 GUIDE COMPLET D'INTÉGRATION - AUTHENTIFICATION JWT IMMO2000      ║
╚════════════════════════════════════════════════════════════════════════╝

Ce guide détaille :
1. ✅ Compatibilité PostgreSQL
2. 🔗 Intégration avec melo_api.py
3. 👥 Gestion des rôles
4. ⚙️  Configuration .env
5. 🛡️  Rate limiting

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  COMPATIBILITÉ POSTGRESQL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ LE MODÈLE SQLALCHEMY EST 100% COMPATIBLE

Voici ce qui a été vérifié :

TABLE PostgreSQL (immo2000_schema.sql):
├── utilisateur_id    (SERIAL PK)
├── email             (VARCHAR 255 UNIQUE)
├── mot_de_passe_hash (VARCHAR 255)
├── nom               (VARCHAR 100)            ← INCLUS ✓
├── prenom            (VARCHAR 100)            ← INCLUS ✓
├── telephone         (VARCHAR 20)             ← INCLUS ✓
├── adresse_contact   (VARCHAR 255)            ← INCLUS ✓
├── role              (role_utilisateur_enum)
├── actif             (BOOLEAN)                ← INCLUS ✓
├── date_inscription  (TIMESTAMPTZ)            ← INCLUS ✓
├── date_derniere_connexion (TIMESTAMPTZ)      ← INCLUS ✓
└── updated_at        (TIMESTAMPTZ)            ← INCLUS ✓

MODÈLE SQLALCHEMY (backend/src/auth/models.py):
✓ Tous les champs sont mappés
✓ Types correspondent exactement
✓ Contraintes respectées
✓ Relations prêtes pour biens (ON DELETE CASCADE)

ACTION REQUISE : AUCUNE - C'est compatible !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2️⃣  INTÉGRATION AVEC MELO_API.PY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STRATÉGIE : Garder melo_api.py comme module indépendant + wrapper Flask protégé

Créer : backend/src/routes/estimations.py

```python
from flask import Blueprint, request, jsonify
from src.auth.decorators import token_required, role_required
from src.melo_api import get_estimation_melo, compare_biens
from src.auth.models import User, db

bp = Blueprint("estimations", __name__, url_prefix="/api/estimations")

# 1. Endpoint pour estimer un bien
@bp.route("", methods=["POST"])
@token_required
def create_estimation(current_user):
    """
    Créer une estimation avec l'API Melo.

    Requête :
    {
        "adresse": "123 Rue de Paris, 75000",
        "surface": 50,
        "type_bien": "appartement"
    }
    """
    data = request.get_json()

    # Valider les données
    if not data.get("adresse") or not data.get("surface") or not data.get("type_bien"):
        return {"error": "Missing required fields"}, 400

    try:
        # Appeler l'API Melo
        result = get_estimation_melo(
            adresse=data["adresse"],
            surface=int(data["surface"]),
            type_bien=data["type_bien"]
        )

        if result["metadata"]["status"] == "success":
            # TODO: Sauvegarder en base (voir INTEGRATION_MELO.md)
            # estimation_id = save_to_db(result, current_user["user_id"])

            return {
                "message": "Estimation créée",
                "estimation": result,
                "user_id": current_user["user_id"]
            }, 201
        else:
            return {
                "error": result["metadata"]["error"]
            }, 400

    except Exception as e:
        return {"error": str(e)}, 500


# 2. Endpoint pour comparer plusieurs biens
@bp.route("/compare", methods=["POST"])
@token_required
@role_required(roles=["vendeur", "agent"])  # Seuls vendeurs et agents
def compare_estimations(current_user):
    """
    Comparer plusieurs biens.

    Requête :
    {
        "biens": [
            {"adresse": "123 Rue A", "surface": 50, "type_bien": "appartement"},
            {"adresse": "456 Rue B", "surface": 75, "type_bien": "maison"}
        ]
    }
    """
    data = request.get_json()

    if not data.get("biens") or len(data["biens"]) < 2:
        return {"error": "At least 2 properties required"}, 400

    try:
        # Appeler la fonction de comparaison
        result = compare_biens([
            {
                "adresse": bien["adresse"],
                "surface": int(bien["surface"]),
                "type_bien": bien["type_bien"]
            }
            for bien in data["biens"]
        ])

        return {
            "message": "Comparaison effectuée",
            "comparison": result,
            "user_id": current_user["user_id"]
        }, 200

    except Exception as e:
        return {"error": str(e)}, 500
```

Enregistrer dans backend/src/app.py :

```python
from src.routes.estimations import bp as estimations_bp
app.register_blueprint(estimations_bp)  # /api/estimations/* endpoints
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3️⃣  GESTION DES RÔLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

tes 3 rôles : vendeur, acheteur, agent

VENDEUR     : Crée des biens, les met en vente
ACHETEUR    : Consulte les biens, compare les estimations
AGENT       : Accès admin (statistiques, tous les biens)

Créer : backend/src/routes/biens.py

```python
from flask import Blueprint
from src.auth.decorators import token_required, role_required
from src.auth.models import User

bp = Blueprint("biens", __name__, url_prefix="/api/biens")

# Accessible à tous (lecture seule)
@bp.route("", methods=["GET"])
@token_required
def list_biens(current_user):
    """Voir tous les biens"""
    # Les acheteurs voient tous, les vendeurs voient uniquement leurs biens
    if current_user["role"] == "vendeur":
        biens = Bien.query.filter_by(utilisateur_id=current_user["user_id"]).all()
    elif current_user["role"] == "agent":
        # Les agents voient tout + stats
        biens = Bien.query.all()
    else:
        # Les acheteurs voient tout
        biens = Bien.query.all()

    return {"biens": [bien.to_dict() for bien in biens]}, 200


# Seul les vendeurs peuvent créer des biens
@bp.route("", methods=["POST"])
@token_required
@role_required(roles=["vendeur"])
def create_bien(current_user):
    """Créer un bien (vendeurs seulement)"""
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


# Seuls les agents peuvent voir les statistiques
@bp.route("/stats", methods=["GET"])
@token_required
@role_required(roles=["agent"])
def get_stats(current_user):
    """Statistiques sur les biens (agents seulement)"""
    stats = {
        "total_biens": Bien.query.count(),
        "total_utilisateurs": User.query.count(),
        "estimations_moyennes": {...}
    }
    return stats, 200


# Chaque utilisateur peut voir ses propres biens
@bp.route("/me", methods=["GET"])
@token_required
def my_biens(current_user):
    """Mes biens personnels"""
    biens = Bien.query.filter_by(utilisateur_id=current_user["user_id"]).all()
    return {"biens": [bien.to_dict() for bien in biens]}, 200
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4️⃣  CONFIGURATION .ENV
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fichier : backend/.env

✅ TEMPLATE (déjà dans .env.example) :

# DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/immo2000
DATABASE_ECHO=false

# JWT
JWT_SECRET_KEY=your_super_secret_jwt_key_change_this_in_production
JWT_ACCESS_TOKEN_EXPIRES_IN=86400    # 24 heures
JWT_REFRESH_TOKEN_EXPIRES_IN=604800  # 7 jours

# MELO API
MELO_API_KEY=your_melo_api_key_here
MELO_API_BASE_URL=https://api.melo.io/v1/estimations
MELO_API_TIMEOUT=10
MELO_API_CACHE_TTL=3600

# FLASK
FLASK_ENV=development
FLASK_DEBUG=true
API_PORT=5000

⚠️  À GÉNÉRER : JWT_SECRET_KEY

En Python :
```python
import secrets
print(secrets.token_urlsafe(32))
# Résultat : AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

En Bash :
```bash
openssl rand -hex 32
# Résultat : a1b2c3d4e5f6g7h8i9j0...
```

⚠️  À CONFIGURER : DATABASE_URL

Pour PostgreSQL local :
DATABASE_URL=postgresql://postgres:password@localhost:5432/immo2000

Pour Docker :
DATABASE_URL=postgresql://immo2000:immo2000_dev_password@postgres:5432/immo2000

✅ VÉRIFICATION :

```bash
# Vérifier que les variables sont chargées
cd backend
python -c "from src.config import get_config; c = get_config(); print(f'JWT_SECRET_KEY: {bool(c.JWT_SECRET_KEY)}'); print(f'DATABASE_URL: {c.SQLALCHEMY_DATABASE_URI}')"
# Doit afficher :
# JWT_SECRET_KEY: True
# DATABASE_URL: postgresql://...
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5️⃣  RATE LIMITING (OPTIONNEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POURQUOI : Éviter les attaques par force brute sur /auth/login

SOLUTION : Flask-Limiter

1️⃣  Ajouter à requirements.txt :
```
Flask-Limiter==3.5.0
```

2️⃣  Installer :
```bash
pip install Flask-Limiter
```

3️⃣  Implémenter dans backend/src/auth/routes.py :

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Dans create_app()
limiter.init_app(app)

# Sur l'endpoint login
@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")  # 5 tentatives max par minute
def login():
    # ...
    pass

@auth_bp.route("/register", methods=["POST"])
@limiter.limit("10 per hour")  # 10 inscriptions max par heure
def register():
    # ...
    pass
```

4️⃣  Comportement :

- Après 5 tentatives de login en 1 minute → 429 Too Many Requests
- L'adresse IP est bloquée temporairement
- Relâche automatiquement après 1 minute

5️⃣  Tester :

```bash
# Test rapide : faire 6 requêtes de login
for i in {1..6}; do
  curl -X POST http://localhost:5000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@ex.com","mot_de_passe":"test"}'
  echo "Request $i"
done

# Réponse sur la 6ème requête :
# 429 Too Many Requests
# {
#   "message": "5 per 1 minute"
# }
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CHECKLIST D'INTÉGRATION COMPLÈTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 : VÉRIFICATION
━━━━━━━━━━
[✓] Compatibilité PostgreSQL vérifiée
[✓] Modèle SQLAlchemy aligné
[✓] Configuration .env correcte

PHASE 2 : CONFIGURATION
━━━━━━━━━━━
[ ] Copier .env.example → .env
[ ] Générer JWT_SECRET_KEY
[ ] Configurer DATABASE_URL
[ ] Tester les variables : python -c "from src.config import..."

PHASE 3 : INTÉGRATION MELO
━━━━━━━━━━━
[ ] Créer backend/src/routes/estimations.py
[ ] Protéger endpoints avec @token_required
[ ] Restreindre par rôle avec @role_required
[ ] Enregistrer blueprint dans app.py

PHASE 4 : ROUTES BIENS
━━━━━━━━━━━
[ ] Créer backend/src/routes/biens.py
[ ] GET /api/biens - Voir tous les biens
[ ] POST /api/biens - Créer un bien (vendeurs)
[ ] GET /api/biens/me - Mes biens (users)
[ ] GET /api/biens/stats - Stats (agents)

PHASE 5 : RATE LIMITING (optionnel)
━━━━━━━━━━━
[ ] Ajouter Flask-Limiter à requirements.txt
[ ] Implémenter sur /auth/login et /auth/register
[ ] Tester avec 6+ requêtes rapides

PHASE 6 : TESTS
━━━━━━━━━━━
[ ] Tests d'auth passent : pytest tests/test_auth.py -v
[ ] Tests d'intégration : pytest tests/test_integration.py -v
[ ] Tester manuellement : curl /auth/login → get token → call /api/biens

PHASE 7 : SÉCURITÉ (PRODUCTION)
━━━━━━━━━━━
[ ] JWT_SECRET_KEY forte (32+ chars)
[ ] FLASK_ENV=production
[ ] DATABASE_URL pointant vers PostgreSQL distante
[ ] HTTPS activé (production)
[ ] Rate limiting activé

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 RESSOURCES COMPLÉMENTAIRES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Authentification JWT :
  → AUTHENTICATION.md (documentation)
  → AUTHENTICATION_DIAGRAMS.md (visuels)
  → QUICKSTART_AUTH.md (5 min)

Intégration Melo :
  → database/INTEGRATION_MELO.md

Models SQLAlchemy :
  → À créer pour : Bien, Estimation, Comparaison, Erreur

Tests :
  → backend/tests/test_auth.py (existe)
  → À créer : test_integration.py, test_biens.py, test_estimations.py

EOF
