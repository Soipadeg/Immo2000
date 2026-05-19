"""
Application Flask principale pour Immo2000.

Configure :
- Base de données (SQLAlchemy)
- Authentification (JWT)
- CORS
- Gestion des erreurs
- Blueprints
"""

from flask import Flask, send_from_directory
from flask_cors import CORS
import logging
import os
from dotenv import load_dotenv

# Charger variables d'environnement
load_dotenv()

from src.auth.models import db
from src.auth import register_bp, login_bp, password_bp, tokens_bp
from src.auth.oauth import oauth_bp
from src.routes.annonces import annonces_bp
from src.routes.tunnel_annonces import tunnel_bp
from src.routes.contrats import contrats_bp
from src.routes.matching import matching_bp
from src.routes.notifications import notifications_bp
from src.routes.admin import dashboard_bp, users_bp, listings_bp, transactions_bp
from src.routes.alertes import alertes_bp
from src.routes.biens import biens_bp
from src.routes.estimations import estimations_bp
from src.routes.simulateur_pret import simulateur_bp
from src.routes.visites import visites_bp, feedbacks_bp
from src.routes.messages import messages_bp
from src.routes.chatbot import chatbot_bp
from src.routes.faq import faq_bp
from src.routes.images import images_bp
from src.routes.documents import documents_bp
from src.routes.rendez_vous import rdv_bp
from src.routes.creneaux import creneaux_bp
from src.routes.annonce_views import views_bp
from src.routes.search_history import search_bp
from src.routes.favoris import favoris_bp
from src.routes.offres import offres_bp
from src.routes.notaires import notaires_bp
from src.routes.dev_auth import dev_auth_bp
from src.routes.transactions import transactions_vente_bp
from src.routes.paiements import paiements_vente_bp

# Import des nouvelles routes (Priority 3)
from src.routes.pret import pret_bp
from src.routes.fcm import fcm_bp
from src.routes.chat import chat_bp

# Import models pour que SQLAlchemy les reconnaisse
from src.models.historique_rdv import HistoriqueRDV

from src.services.scheduler import SchedulerService
from src.services.chatbot import init_chatbot
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

    # Déterminer le chemin du dossier statique (au niveau du projet, pas du backend)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    static_dir = os.path.join(base_dir, "static")

    app = Flask(__name__, static_folder=static_dir, static_url_path="/static")

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

    # Phase 3: Celery async tasks
    try:
        from src.tasks import celery_app
        celery_app.conf.update(app.config)

        class ContextTask(celery_app.Task):
            def __call__(self, *args, **kwargs):
                with app.app_context():
                    return self.run(*args, **kwargs)

        celery_app.Task = ContextTask
        logger.info("✅ Celery initialized")
    except Exception as e:
        logger.warning(f"⚠️  Failed to initialize Celery: {e}")

    # Phase 3: SocketIO for real-time chat
    try:
        from flask_socketio import SocketIO
        socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

        # Initialiser les événements WebSocket
        from src.routes.chat import init_socketio
        init_socketio(socketio, app)

        app.socketio = socketio
        logger.info("✅ SocketIO initialized")
    except Exception as e:
        logger.warning(f"⚠️  Failed to initialize SocketIO: {e}")
        app.socketio = None

    # Phase 3: Elasticsearch for advanced search
    try:
        from src.utils.search import init_search_engine
        es_url = os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200')
        search_engine = init_search_engine(es_url)
        app.search_engine = search_engine
        logger.info(f"✅ Elasticsearch initialized at {es_url}")
    except Exception as e:
        logger.warning(f"⚠️  Failed to initialize Elasticsearch: {e}")
        app.search_engine = None

    # Phase 3.2: Redis Cache Service
    try:
        from src.services.cache_service import RedisCache
        cache = RedisCache()
        if cache.is_available():
            logger.info("✅ Redis cache initialized")
            app.redis = cache
        else:
            logger.warning("⚠️  Redis cache not available - using app without caching")
            app.redis = None
    except Exception as e:
        logger.warning(f"⚠️  Failed to initialize Redis: {e}")
        app.redis = None

    # Phase 3.3: Rate Limiting
    try:
        from src.services.rate_limiter import init_rate_limiting
        init_rate_limiting(app)
        logger.info("✅ Rate limiting initialized")
    except Exception as e:
        logger.warning(f"⚠️  Failed to initialize rate limiting: {e}")

    # Logging
    if not app.debug:
        logger.setLevel(logging.INFO)

    # Routes de santé
    @app.route("/health", methods=["GET"])
    def health():
        """Endpoint de health check avec dépendances."""
        health_status = {
            "status": "ok",
            "service": "immo2000-backend",
            "database": "unknown",
            "cache": "unknown"
        }

        # Vérifier BD
        try:
            from sqlalchemy import text
            db.session.execute(text("SELECT 1"))
            health_status["database"] = "connected"
        except Exception as e:
            health_status["database"] = f"error: {str(e)[:50]}"
            health_status["status"] = "degraded"

        # Vérifier cache
        if hasattr(app, 'redis') and app.redis:
            try:
                if app.redis.is_available():
                    health_status["cache"] = "connected"
                else:
                    health_status["cache"] = "unavailable"
            except:
                health_status["cache"] = "error"
        else:
            health_status["cache"] = "disabled"

        return health_status

    @app.route("/", methods=["GET"])
    def index():
        """Sert la page d'accueil statique."""
        return send_from_directory(app.static_folder, "index.html")

    # Routes pour les pages statiques
    @app.route("/login", methods=["GET"])
    def login_page():
        """Sert la page de connexion."""
        return send_from_directory(app.static_folder, "login.html")

    @app.route("/register", methods=["GET"])
    def register_page():
        """Sert la page d'inscription."""
        return send_from_directory(app.static_folder, "register.html")

    @app.route("/dashboard", methods=["GET"])
    def dashboard_page():
        """Sert la page du tableau de bord."""
        return send_from_directory(app.static_folder, "dashboard.html")

    @app.route("/matching", methods=["GET"])
    def matching_page():
        """Sert la page de matching."""
        return send_from_directory(app.static_folder, "matching.html")

    @app.route("/simulateur-pret", methods=["GET"])
    def simulateur_pret_page():
        """Sert la page du simulateur de prêt."""
        return send_from_directory(app.static_folder, "simulateur_pret.html")

    @app.route("/error", methods=["GET"])
    def error_page():
        """Sert la page d'erreur."""
        return send_from_directory(app.static_folder, "error.html")

    @app.route("/faq", methods=["GET"])
    def faq_page():
        """Sert la page FAQ."""
        return send_from_directory(app.static_folder, "faq.html")

    # Fallback pour les routes inconnues - serve index.html pour Single Page App
    @app.route("/<path:path>")
    def fallback(path):
        """Fallback pour les routes statiques."""
        # Vérifier si c'est un fichier statique
        file_path = os.path.join(app.static_folder, path)
        if os.path.isfile(file_path):
            return send_from_directory(app.static_folder, path)
        # Sinon, servir la page d'accueil
        return send_from_directory(app.static_folder, "index.html")

    # Ancien endpoint pour compatibilité
    @app.route("/api", methods=["GET"])
    def api_info():
        """Endpoint API racine."""
        return {
            "name": "Immo2000 Backend API",
            "version": "0.1.0",
            "docs": "/docs",
            "health": "/health",
            "auth": "/auth/register, /auth/login, /auth/refresh, /auth/me",
            "annonces": "/api/v1/annonces (CRUD operations)"
        }
    app.register_blueprint(register_bp)
    app.register_blueprint(login_bp)
    app.register_blueprint(password_bp)
    app.register_blueprint(tokens_bp)
    app.register_blueprint(oauth_bp)

    # Blueprints - Annonces
    app.register_blueprint(annonces_bp)

    # Blueprints - Tunnel de création d'annonce (4 étapes + contrat)
    app.register_blueprint(tunnel_bp)
    app.register_blueprint(contrats_bp)

    # Blueprints - Matching (Recommendation system)
    app.register_blueprint(matching_bp)

    # Blueprints - Notifications
    app.register_blueprint(notifications_bp)

    # Blueprints - Admin (Dashboard, Users, Listings, Transactions)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(listings_bp)
    app.register_blueprint(transactions_bp)

    # Blueprints - Alertes
    app.register_blueprint(alertes_bp)

    # Blueprints - Biens immobiliers
    app.register_blueprint(biens_bp)

    # Blueprints - Estimations (Melo API)
    app.register_blueprint(estimations_bp)

    # Blueprints - Simulateur de prêt
    app.register_blueprint(simulateur_bp)

    # Blueprints - Visites (Réservations de visites)
    app.register_blueprint(visites_bp)

    # Blueprints - Feedbacks (Avis post-visite)
    app.register_blueprint(feedbacks_bp)

    # Blueprints - Messages (Messagerie P2P)
    app.register_blueprint(messages_bp)

    # Blueprints - Rendez-vous (Tunnel achat)
    app.register_blueprint(rdv_bp)

    # Blueprints - Créneaux (Planification visite)
    app.register_blueprint(creneaux_bp)

    # Blueprints - Chatbot
    app.register_blueprint(chatbot_bp)

    # Blueprints - FAQ
    app.register_blueprint(faq_bp)

    # Blueprints - Images
    app.register_blueprint(images_bp)

    # Blueprints - Documents (Phase 2)
    app.register_blueprint(documents_bp)

    # Blueprints - Annonce Views Analytics (Phase 2)
    app.register_blueprint(views_bp)

    # Blueprints - Search History (Phase 2)
    app.register_blueprint(search_bp)

    # Blueprints - Favoris (Phase 2)
    app.register_blueprint(favoris_bp)

    # Blueprints - Offres (Phase 2)
    app.register_blueprint(offres_bp)

    # Blueprints - Notaires Partenaires (Phase 3)
    app.register_blueprint(notaires_bp)

    # Blueprints - Transactions de Vente (Phase 3 - Parcours de Vente)
    app.register_blueprint(transactions_vente_bp)

    # Blueprints - Paiements (Phase 3 - Parcours de Vente)
    app.register_blueprint(paiements_vente_bp)

    # Blueprints - Dev Auth (Development mode - bypass authentication)
    app.register_blueprint(dev_auth_bp)

    # Blueprints - Priority 3: Advanced Features
    app.register_blueprint(pret_bp)  # Simulateur de prêt
    app.register_blueprint(fcm_bp)   # Notifications push Firebase
    app.register_blueprint(chat_bp)  # Chat temps réel avec WebSocket

    @app.errorhandler(404)
    def not_found(error):
        return {"error": "Not found"}, 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return {"error": "Internal server error"}, 500

    # Context pour créer les tables
    with app.app_context():
        # db.create_all()  # Commented: tables already created via migrations
        # Avoids "relation already exists" errors with PostgreSQL

        # Initialiser le chatbot avec le dataset JSON
        init_chatbot()

        # Initialiser le scheduler pour les tâches planifiées (feedback reminders)
        if os.getenv("FLASK_ENV") != "testing":
            SchedulerService.init_scheduler()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 5000)),
        debug=os.getenv("FLASK_DEBUG", False)
    )
