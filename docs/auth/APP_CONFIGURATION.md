"""
Exemple complet : Intégration des routes protégées dans app.py

Ce fichier montre comment enregistrer tous les blueprints (auth, biens, estimations)
et initialiser le rate limiting.
"""

# =============================================================================
# backend/src/app.py - VERSION COMPLÈTE AVEC RATE LIMITING
# =============================================================================

COMPLETE_APP_FACTORY = '''
"""
Application Factory pour Immo2000 Backend.

Initialise Flask, SQLAlchemy, JWT, et Rate Limiting.
"""

from flask import Flask, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_limiter.errors import RateLimitExceeded

from src.config import get_config
from src.auth.models import db
from src.auth.routes import auth_bp
from src.routes.biens import bp as biens_bp
from src.routes.estimations import bp as estimations_bp


def create_app(config_name=None):
    """
    Crée et configure l'application Flask.

    Args:
        config_name: "development", "testing", or "production"

    Returns:
        Flask application configured and ready to run
    """
    app = Flask(__name__)

    # ========================================================================
    # 1. Configuration
    # ========================================================================
    config = get_config(config_name)
    app.config.from_object(config)

    # ========================================================================
    # 2. Initialiser la base de données SQLAlchemy
    # ========================================================================
    db.init_app(app)

    # ========================================================================
    # 3. Initialiser le Rate Limiter
    # ========================================================================
    limiter = Limiter(
        key_func=get_remote_address,
        # En développement : memory://
        # En production : redis://localhost:6379/0 ou redis://redis:6379/0 (Docker)
        storage_uri=app.config.get("RATE_LIMIT_STORAGE", "memory://"),
        default_limits=["200 per day", "50 per hour"]
    )
    limiter.init_app(app)

    # ========================================================================
    # 4. Enregistrer les Blueprints (routes)
    # ========================================================================

    # Routes d'authentification
    app.register_blueprint(auth_bp)  # /auth/* endpoints

    # Routes des biens immobiliers
    app.register_blueprint(biens_bp)  # /api/biens/* endpoints

    # Routes des estimations Melo
    app.register_blueprint(estimations_bp)  # /api/estimations/* endpoints

    # ========================================================================
    # 5. Gestion des erreurs de rate limiting
    # ========================================================================
    @app.errorhandler(RateLimitExceeded)
    def handle_rate_limit_exceeded(e):
        """Retourner une réponse JSON pour les erreurs de rate limiting."""
        return {
            "error": "Rate limit exceeded",
            "message": str(e.description),
            "retry_after": e.retry_after
        }, 429

    # ========================================================================
    # 6. Gestion globale des erreurs
    # ========================================================================
    @app.errorhandler(400)
    def bad_request(error):
        return {"error": "Bad request"}, 400

    @app.errorhandler(401)
    def unauthorized(error):
        return {"error": "Unauthorized"}, 401

    @app.errorhandler(403)
    def forbidden(error):
        return {"error": "Forbidden"}, 403

    @app.errorhandler(404)
    def not_found(error):
        return {"error": "Not found"}, 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"Server error: {error}")
        return {"error": "Internal server error"}, 500

    # ========================================================================
    # 7. Health check endpoint
    # ========================================================================
    @app.route("/health", methods=["GET"])
    def health():
        """Vérifier que l'app est en ligne."""
        return {
            "status": "ok",
            "service": "Immo2000 Backend"
        }, 200

    # ========================================================================
    # 8. Créer les tables de la base de données
    # ========================================================================
    with app.app_context():
        db.create_all()
        app.logger.info("Database tables created/verified")

    # ========================================================================
    # 9. Logging
    # ========================================================================
    app.logger.info(f"App created with config: {config_name or 'default'}")
    app.logger.info(f"Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    app.logger.info("Blueprints registered: auth, biens, estimations")

    return app


# =============================================================================
# RUN - Point d'entrée principal
# =============================================================================

if __name__ == "__main__":
    app = create_app("development")
    app.run(host="0.0.0.0", port=5000, debug=True)
'''

# =============================================================================
# backend/src/config.py - AJOUT POUR RATE LIMITING
# =============================================================================

CONFIG_ADDITION = '''
# Dans la classe Config, ajouter :

class Config:
    # ... configuration existante ...

    # Rate Limiting
    RATE_LIMIT_STORAGE = os.getenv("RATE_LIMIT_STORAGE", "memory://")
    # En production, utiliser :
    # RATE_LIMIT_STORAGE = "redis://redis:6379/0"
'''

# =============================================================================
# backend/.env.example - AJOUT POUR RATE LIMITING
# =============================================================================

ENV_ADDITION = '''
# Rate Limiting (optionnel)
# memory:// pour développement (simple)
# redis://localhost:6379/0 pour production (persistent)
RATE_LIMIT_STORAGE=memory://
'''

# =============================================================================
# STRUCTURE DES FICHIERS FINAUX
# =============================================================================

FINAL_STRUCTURE = """
backend/
├── src/
│   ├── __init__.py
│   ├── app.py                    ← MODIFIÉ (+ rate limiting)
│   ├── config.py                 ← MODIFIÉ (+ RATE_LIMIT_STORAGE)
│   │
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── models.py            ✅ User model
│   │   ├── utils.py             ✅ JWT utilities
│   │   ├── decorators.py        ✅ @token_required, @role_required
│   │   └── routes.py            ✅ /auth/* endpoints
│   │
│   └── routes/                  ✨ NOUVEAU
│       ├── __init__.py
│       ├── biens.py             ✨ NOUVEAU - /api/biens/* endpoints
│       └── estimations.py       ✨ NOUVEAU - /api/estimations/* endpoints
│
├── tests/
│   ├── test_auth.py            ✅ Tests d'authentification
│   ├── test_biens.py           ⏳ À créer
│   └── test_estimations.py      ⏳ À créer
│
├── requirements.txt             ✅ Dépendances
├── .env.example                 ✅ Variables d'environnement
└── .env                         ⏳ À créer (à partir de .env.example)

Documentation/
├── INTEGRATION_CHECKLIST_AUTH.md        ✨ NOUVEAU
├── RATE_LIMITING_GUIDE.md               ✨ NOUVEAU
├── AUTHENTICATION.md                    ✅ Référence complète
├── AUTHENTICATION_DIAGRAMS.md           ✅ Diagrammes
└── QUICKSTART_AUTH.md                   ✅ Quick start

Scripts/
├── setup.sh                     ✅ Configuration automatique
├── test_auth_quick.py          ✅ Tests rapides
└── example_complete_auth.sh    ✅ Exemples d'utilisation
"""

# =============================================================================
# PROCHAINES ÉTAPES
# =============================================================================

NEXT_STEPS = """
┌────────────────────────────────────────────────────────────────────────┐
│                    PROCHAINES ÉTAPES D'INTÉGRATION                    │
└────────────────────────────────────────────────────────────────────────┘

1️⃣  MODIFIER backend/src/app.py
    Ajouter les imports :
    - from src.routes.biens import bp as biens_bp
    - from src.routes.estimations import bp as estimations_bp
    - from flask_limiter import Limiter

    Enregistrer les blueprints :
    - app.register_blueprint(biens_bp)
    - app.register_blueprint(estimations_bp)

    Initialiser le limiter :
    - limiter = Limiter(key_func=get_remote_address)
    - limiter.init_app(app)

2️⃣  MODIFIER backend/src/config.py
    Ajouter :
    - RATE_LIMIT_STORAGE = os.getenv("RATE_LIMIT_STORAGE", "memory://")

3️⃣  CRÉER backend/.env
    Copier depuis .env.example :
    - cp backend/.env.example backend/.env

    Générer JWT_SECRET_KEY :
    - python -c "import secrets; print(secrets.token_urlsafe(32))"

    Configurer DATABASE_URL :
    - DATABASE_URL=postgresql://user:pass@localhost:5432/immo2000

4️⃣  CRÉER LE MODÈLE Bien (SQLAlchemy)
    Créer : backend/src/models/bien.py
    Inclure :
    - bien_id (PK)
    - utilisateur_id (FK → User)
    - adresse, surface, type_bien
    - date_creation, updated_at

5️⃣  CRÉER LE MODÈLE Estimation (SQLAlchemy)
    Créer : backend/src/models/estimation.py
    Inclure :
    - estimation_id (PK)
    - utilisateur_id (FK)
    - bien_id (FK)
    - prix_estime, reponse_melo (JSON)
    - date_creation

6️⃣  TESTER
    Tests unitaires :
    - pytest tests/test_auth.py -v
    - pytest tests/test_biens.py -v

    Test manuel :
    - curl -X POST localhost:5000/auth/register ...
    - curl -X POST localhost:5000/auth/login ...
    - curl -H "Authorization: Bearer ..." localhost:5000/api/biens

7️⃣  INSTALLER DÉPENDANCES (optionnel)
    Si vous activez rate limiting :
    - pip install Flask-Limiter
    - Ajouter à requirements.txt

⚠️  IMPORTANT :
    - Chaque endpoint de API doit avoir @token_required
    - Les endpoints sensibles (login, register) doivent avoir @limiter.limit()
    - Les endpoints sensibles (admin) doivent avoir @role_required
"""

if __name__ == "__main__":
    print(FINAL_STRUCTURE)
    print("\n")
    print(NEXT_STEPS)
