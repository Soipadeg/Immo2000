"""
Configuration du Rate Limiting avec Flask-Limiter.

Ce fichier montre comment intégrer Flask-Limiter au système d'authentification
pour protéger les endpoints contre les attaques par force brute.

Installation :
    pip install Flask-Limiter

Configuration dans src/app.py :
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address

    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"]
    )

Utilisation sur les routes sensibles :
    @app.route("/auth/login", methods=["POST"])
    @limiter.limit("5 per minute")
    def login():
        ...
"""

# ============================================================================
# OPTION 1 : Rate limiting global (dans app.py)
# ============================================================================

EXAMPLE_APP_FACTORY = """
from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from src.auth.models import db
from src.auth.routes import auth_bp

def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    # Initialiser la base de données
    db.init_app(app)

    # Initialiser le rate limiter
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="memory://"  # Ou redis:// pour plusieurs serveurs
    )

    # Enregistrer le blueprint auth avec rate limiting
    app.register_blueprint(auth_bp)

    # Créer les tables
    with app.app_context():
        db.create_all()

    return app, limiter
"""

# ============================================================================
# OPTION 2 : Rate limiting au niveau des routes (dans auth/routes.py)
# ============================================================================

EXAMPLE_AUTH_ROUTES = """
from flask import Blueprint, request, jsonify, current_app
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from src.auth.decorators import token_required
from src.auth.models import User, db
from src.auth.utils import (
    generate_access_token,
    generate_refresh_token,
    verify_token,
    extract_token_from_header
)

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
limiter = Limiter(key_func=get_remote_address)


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("10 per hour")  # Max 10 inscriptions par heure
def register():
    '''
    Créer un nouvel utilisateur.

    Rate limit: 10 par heure (protection contre les abus)
    '''
    try:
        data = request.get_json()

        # Validations
        email = data.get("email", "").strip()
        mot_de_passe = data.get("mot_de_passe")
        nom = data.get("nom", "").strip()
        prenom = data.get("prenom", "").strip()
        role = data.get("role", "acheteur")

        # Validation de l'email
        if not email or not validate_email(email):
            return {"error": "Invalid email format"}, 400

        # Vérifier si l'email existe déjà
        existing_user = User.find_by_email(email)
        if existing_user:
            return {"error": "Email already registered"}, 400

        # Validation du mot de passe
        password_valid, password_error = validate_password(mot_de_passe)
        if not password_valid:
            return {"error": password_error}, 400

        # Validation des champs obligatoires
        if not nom or not prenom:
            return {"error": "nom and prenom are required"}, 400

        # Créer l'utilisateur
        user = User(
            email=email,
            nom=nom,
            prenom=prenom,
            role=role
        )
        user.set_password(mot_de_passe)

        db.session.add(user)
        db.session.commit()

        return {
            "message": "User registered successfully",
            "user_id": user.utilisateur_id,
            "email": user.email
        }, 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {str(e)}")
        return {"error": "Internal server error"}, 500


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")  # Max 5 tentatives par minute
@limiter.limit("50 per hour")   # Max 50 tentatives par heure
def login():
    '''
    Authentifier un utilisateur.

    Rate limits:
    - 5 par minute (pour cette IP)
    - 50 par heure (pour cette IP)

    Si vous dépassez les limites, vous recevrez :
        429 Too Many Requests
        {"message": "5 per 1 minute"}
    '''
    try:
        data = request.get_json()

        email = data.get("email", "").strip()
        mot_de_passe = data.get("mot_de_passe")

        if not email or not mot_de_passe:
            return {"error": "email and mot_de_passe required"}, 400

        # Chercher l'utilisateur
        user = User.find_by_email(email)

        if not user or not user.check_password(mot_de_passe):
            # Ne pas révéler lequel est invalide (sécurité)
            current_app.logger.warning(f"Failed login attempt for {email}")
            return {"error": "Invalid credentials"}, 401

        # Vérifier que le compte est actif
        if not user.actif:
            return {"error": "Account is deactivated"}, 403

        # Générer les tokens
        access_token = generate_access_token(
            user.utilisateur_id,
            user.email,
            user.role
        )
        refresh_token = generate_refresh_token(user.utilisateur_id)

        # Mettre à jour la dernière connexion
        user.date_derniere_connexion = datetime.utcnow()
        db.session.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": current_app.config["JWT_ACCESS_TOKEN_EXPIRES_IN"]
        }, 200

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return {"error": "Internal server error"}, 500


@auth_bp.route("/refresh", methods=["POST"])
@limiter.limit("30 per hour")  # Max 30 refresh par heure
def refresh():
    '''
    Rafraîchir le token d'accès.

    Rate limit: 30 par heure
    '''
    try:
        data = request.get_json()
        refresh_token = data.get("refresh_token")

        if not refresh_token:
            return {"error": "refresh_token required"}, 400

        # Vérifier le token
        payload = verify_token(refresh_token)

        if not payload:
            return {"error": "Invalid or expired refresh token"}, 401

        # Vérifier que c'est bien un refresh_token (pas un access_token)
        if payload.get("type") != "refresh":
            return {"error": "Invalid token type"}, 401

        # Vérifier que l'utilisateur existe
        user = User.find_by_id(payload["user_id"])
        if not user:
            return {"error": "User not found"}, 404

        # Générer un nouveau access_token
        access_token = generate_access_token(
            user.utilisateur_id,
            user.email,
            user.role
        )

        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": current_app.config["JWT_ACCESS_TOKEN_EXPIRES_IN"]
        }, 200

    except Exception as e:
        current_app.logger.error(f"Refresh error: {str(e)}")
        return {"error": "Internal server error"}, 500


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me(current_user):
    '''
    Récupérer les infos de l'utilisateur connecté.

    Pas de rate limiting (déjà protégé par token)
    '''
    try:
        user = User.find_by_id(current_user["user_id"])

        if not user:
            return {"error": "User not found"}, 404

        return user.to_dict(), 200

    except Exception as e:
        current_app.logger.error(f"Get me error: {str(e)}")
        return {"error": "Internal server error"}, 500
"""

# ============================================================================
# TESTER LE RATE LIMITING
# ============================================================================

TEST_RATE_LIMITING = """
#!/bin/bash
# Script de test du rate limiting

echo "Test du rate limiting sur /auth/login"
echo "==============================================="
echo ""
echo "Faire 6 requêtes rapides (dépassera la limite de 5)"
echo ""

for i in {1..6}; do
    echo "Requête $i :"
    curl -X POST http://localhost:5000/auth/login \\
        -H "Content-Type: application/json" \\
        -d '{
            "email": "test@example.com",
            "mot_de_passe": "TestPassword123!"
        }' \\
        -w "\\nHTTP Status: %{http_code}\\n"
    echo ""
    sleep 0.5
done

echo ""
echo "==============================================="
echo "La 6ème requête devrait retourner 429 (Too Many Requests)"
echo "Message: {'message': '5 per 1 minute'}"
echo ""
echo "Attendre 60 secondes pour réinitialiser le compteur..."
"""

# ============================================================================
# STOCKAGE : Memory vs Redis
# ============================================================================

MEMORY_VS_REDIS = """
╔════════════════════════════════════════════════════════════════════════╗
║                    STOCKAGE DU RATE LIMITING                          ║
╚════════════════════════════════════════════════════════════════════════╝

1️⃣  EN MÉMOIRE (par défaut) : storage_uri="memory://"
    ├─ Avantages :
    │  ✓ Simple, pas de dépendance externe
    │  ✓ Performant
    └─ Inconvénients :
       ✗ Réinitialisé quand l'app redémarre
       ✗ Ne fonctionne pas avec plusieurs instances (containers)

2️⃣  AVEC REDIS : storage_uri="redis://localhost:6379/0"
    ├─ Avantages :
    │  ✓ Persistent
    │  ✓ Fonctionne avec plusieurs instances
    │  ✓ Production-ready
    └─ Inconvénients :
       ✗ Dépendance externe (Redis)
       ✗ Légèrement plus lent

POUR LE DÉVELOPPEMENT : Utiliser memory://
POUR LA PRODUCTION     : Utiliser redis://

Configuration :

    # En développement (app.py)
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        storage_uri="memory://"
    )

    # En production (config.py)
    RATE_LIMIT_STORAGE = os.getenv("RATE_LIMIT_STORAGE", "redis://localhost:6379/0")

    # Dans app.py
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        storage_uri=current_app.config["RATE_LIMIT_STORAGE"]
    )
"""

# ============================================================================
# ERREURS COURANTES
# ============================================================================

COMMON_ERRORS = """
❌ Erreur 1 : "429 Too Many Requests"
   └─ Cause : Vous avez dépassé la limite
   └─ Solution : Attendre quelques secondes et réessayer

❌ Erreur 2 : "No module named 'flask_limiter'"
   └─ Cause : Flask-Limiter n'est pas installé
   └─ Solution : pip install Flask-Limiter

❌ Erreur 3 : Le rate limiting ne fonctionne pas en développement
   └─ Cause : Peut-être que FLASK_ENV=test ou autre
   └─ Solution : Vérifier que FLASK_ENV=development

❌ Erreur 4 : Erreur Redis lors du démarrage
   └─ Cause : Redis n'est pas disponible
   └─ Solution :
       - Installer Redis : brew install redis (macOS) ou apt install redis (Linux)
       - Lancer Redis : redis-server
       - Ou utiliser memory:// à la place
"""

# ============================================================================
# RÉSUMÉ
# ============================================================================

SUMMARY = """
┌────────────────────────────────────────────────────────────────────────┐
│                    RÉSUMÉ DU RATE LIMITING                            │
└────────────────────────────────────────────────────────────────────────┘

✅ Installation :
   pip install Flask-Limiter

✅ Endpoints protégés :
   - POST /auth/register      : 10 par heure
   - POST /auth/login         : 5 par minute / 50 par heure
   - POST /auth/refresh       : 30 par heure
   - GET  /auth/me            : Pas de limite (protégé par token)

✅ Codes de réponse :
   - 200 OK                   : Succès
   - 400 Bad Request          : Erreur de validation
   - 401 Unauthorized         : Token invalide
   - 429 Too Many Requests    : Rate limit dépassée ⚠️

✅ Configuration :
   - En dev : memory:// (simple)
   - En prod : redis:// (scalable)

✅ Test :
   bash RATE_LIMITING_TEST.sh
"""

if __name__ == "__main__":
    print(SUMMARY)
