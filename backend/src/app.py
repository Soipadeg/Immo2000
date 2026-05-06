"""
Application Flask principale pour Immo2000.

Configure :
- Base de données (SQLAlchemy)
- Authentification (JWT)
- CORS
- Gestion des erreurs
- Blueprints
"""

from flask import Flask
from flask_cors import CORS
import logging
import os
from dotenv import load_dotenv

# Charger variables d'environnement
load_dotenv()

from src.auth.models import db
from src.auth.routes import auth_bp
from src.routes.annonces import annonces_bp
from src.routes.matching import matching_bp
from src.routes.notifications import notifications_bp
from src.routes.admin import admin_bp
from src.routes.biens import biens_bp
from src.routes.estimations import estimations_bp
from src.routes.simulateur_pret import simulateur_bp
from src.config import get_config

# Configuration
logger = logging.getLogger(__name__)


def create_app(config_name: str = None) -> Flask:
    """Factory pour créer l'application Flask.

    Args:
        config_name: Type de configuration (development, testing, production)

    Returns:
        Application Flask configurée et prête à tourner
    """
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)

    # Configuration
    config = get_config(config_name)
    app.config.from_object(config)

    # JSON
    app.config["JSON_SORT_KEYS"] = False
    app.config["JSONIFY_PRETTYPRINT_REGULAR"] = os.getenv("FLASK_DEBUG", False)

    # CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}, r"/auth/*": {"origins": "*"}})

    # Database
    db.init_app(app)

    # Logging
    if not app.debug:
        logger.setLevel(logging.INFO)

    # Routes de santé
    @app.route("/health", methods=["GET"])
    def health():
        """Endpoint de health check."""
        return {"status": "ok", "service": "immo2000-backend"}

    @app.route("/", methods=["GET"])
    def index():
        """Endpoint racine."""
        return {
            "name": "Immo2000 Backend API",
            "version": "0.1.0",
            "docs": "/docs",
            "health": "/health",
            "auth": "/auth/register, /auth/login, /auth/refresh, /auth/me",
            "annonces": "/api/v1/annonces (CRUD operations)"
        }

    # Blueprints - Authentification
    app.register_blueprint(auth_bp)

    # Blueprints - Annonces
    app.register_blueprint(annonces_bp)

    # Blueprints - Matching (Recommendation system)
    app.register_blueprint(matching_bp)

    # Blueprints - Notifications
    app.register_blueprint(notifications_bp)

    # Blueprints - Admin
    app.register_blueprint(admin_bp)

    # Blueprints - Biens immobiliers
    app.register_blueprint(biens_bp)

    # Blueprints - Estimations (Melo API)
    app.register_blueprint(estimations_bp)

    # Blueprints - Simulateur de prêt
    app.register_blueprint(simulateur_bp)

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {"error": "Not found"}, 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return {"error": "Internal server error"}, 500

    # Context pour créer les tables
    with app.app_context():
        db.create_all()

    return app


    return app


if __name__ == "__main__":
    app = create_app()
    app.run(
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 5000)),
        debug=os.getenv("FLASK_DEBUG", False)
    )
