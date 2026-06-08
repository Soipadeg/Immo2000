"""
CSRF Protection Middleware - Phase 4 (Security S6)

Protège contre les attaques Cross-Site Request Forgery:
- Valide les tokens CSRF sur POST/PUT/DELETE/PATCH
- Génère des tokens uniques par session
- Stocke tokens en Redis/session
- Double-submit pattern avec SameSite cookie
"""

import os
import logging
from functools import wraps
from typing import Callable, Optional
from secrets import token_urlsafe
from datetime import datetime, timedelta
from flask import request, session, g, jsonify, render_template_string

logger = logging.getLogger(__name__)


class CSRFConfig:
    """Configuration CSRF"""

    # Activer/désactiver CSRF protection
    CSRF_ENABLED = os.getenv('CSRF_ENABLED', 'true').lower() == 'true'

    # Token expiration (1 hour)
    CSRF_TOKEN_TTL = int(os.getenv('CSRF_TOKEN_TTL', 3600))

    # Header name où chercher le token
    CSRF_HEADER_NAME = 'X-CSRF-Token'

    # Param name pour les formulaires
    CSRF_PARAM_NAME = 'csrf_token'

    # Endpoints exempts (health, health check, etc.)
    CSRF_EXEMPT_ENDPOINTS = [
        'health',
        '/health',
        '/api/health',
        'api.health',
        'auth.login',  # Login peut être POST depuis externe
    ]

    # Methods à protéger
    PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

    # Debug mode
    CSRF_DEBUG = os.getenv('CSRF_DEBUG', 'false').lower() == 'true'


class CSRFProtection:
    """Service de protection CSRF"""

    def __init__(self, app=None):
        self.app = app
        self.config = CSRFConfig()
        if app:
            self.init_app(app)

    def init_app(self, app):
        """Initialiser CSRF protection sur l'app"""
        self.app = app

        # Enregistrer les hooks
        app.before_request(self._load_csrf_token)
        app.before_request(self._validate_csrf_token)
        app.after_request(self._set_csrf_cookie)

        logger.info(f"✅ CSRF Protection initialized (enabled={self.config.CSRF_ENABLED})")

    def _is_exempt(self) -> bool:
        """Vérifier si l'endpoint est exempt de CSRF"""
        endpoint = request.endpoint or ''
        path = request.path or ''

        # Méthode GET/HEAD/OPTIONS ne sont jamais protégées
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True

        # Exemptions spéciales
        for exempt in self.config.CSRF_EXEMPT_ENDPOINTS:
            if exempt in endpoint or exempt in path:
                return True

        return False

    def _get_session_id(self) -> str:
        """Récupérer l'ID session (ou créer un temporaire)"""
        if 'session_id' not in session:
            session['session_id'] = token_urlsafe(32)
        return session['session_id']

    def _generate_token(self) -> str:
        """Générer un nouveau token CSRF"""
        return token_urlsafe(32)

    def _load_csrf_token(self):
        """Charger ou créer le token CSRF en session"""
        if not self.config.CSRF_ENABLED:
            return

        # Charger/créer token
        if 'csrf_token' not in session:
            session['csrf_token'] = self._generate_token()
            session['csrf_token_time'] = datetime.utcnow().isoformat()

        # Mettre dans g pour accès facile
        g.csrf_token = session.get('csrf_token')

        if self.config.CSRF_DEBUG:
            logger.debug(f"🔐 CSRF token loaded: {g.csrf_token[:10]}...")

    def _validate_csrf_token(self):
        """Valider le token CSRF sur les requêtes protégées"""
        if not self.config.CSRF_ENABLED:
            return

        # Skip si exempt
        if self._is_exempt():
            return

        # Récupérer le token envoyé par le client
        token_from_client = None

        # 1. D'abord chercher dans le header (API)
        token_from_client = request.headers.get(self.config.CSRF_HEADER_NAME)

        # 2. Sinon dans les données POST (formulaire)
        if not token_from_client:
            if request.is_json:
                token_from_client = request.json.get(self.config.CSRF_PARAM_NAME)
            else:
                token_from_client = request.form.get(self.config.CSRF_PARAM_NAME)

        # Récupérer le token de la session
        token_from_session = session.get('csrf_token')

        # Valider
        if not token_from_client or not token_from_session:
            logger.warning(f"❌ CSRF token missing: method={request.method}, endpoint={request.endpoint}")
            return jsonify({
                'error': 'CSRF token missing',
                'message': 'CSRF token required for this operation'
            }), 403

        if token_from_client != token_from_session:
            logger.warning(
                f"❌ CSRF token mismatch: "
                f"method={request.method}, endpoint={request.endpoint}, "
                f"client={token_from_client[:10]}..., session={token_from_session[:10]}..."
            )
            return jsonify({
                'error': 'CSRF token invalid',
                'message': 'CSRF validation failed. Please reload the page.'
            }), 403

        # Vérifier expiration
        token_time_str = session.get('csrf_token_time')
        if token_time_str:
            try:
                token_time = datetime.fromisoformat(token_time_str)
                age = (datetime.utcnow() - token_time).total_seconds()

                if age > self.config.CSRF_TOKEN_TTL:
                    logger.warning(f"⚠️  CSRF token expired: age={age}s, ttl={self.config.CSRF_TOKEN_TTL}s")
                    session['csrf_token'] = self._generate_token()
                    session['csrf_token_time'] = datetime.utcnow().isoformat()
                    return jsonify({
                        'error': 'CSRF token expired',
                        'message': 'CSRF token expired. Please reload the page.'
                    }), 403
            except Exception as e:
                logger.warning(f"⚠️  CSRF token time parse error: {e}")

        if self.config.CSRF_DEBUG:
            logger.debug(f"✅ CSRF token valid: {request.method} {request.endpoint}")

        # Mettre dans g
        g.csrf_valid = True

    def _set_csrf_cookie(self, response):
        """Ajouter le token CSRF en cookie (pour le JS)"""
        if self.config.CSRF_ENABLED and hasattr(g, 'csrf_token'):
            response.set_cookie(
                'X-CSRF-Token',
                g.csrf_token,
                httponly=False,  # JS doit pouvoir accéder
                samesite='Strict',
                secure=os.getenv('FLASK_ENV') == 'production'
            )

        return response

    def exempt(self, func: Callable) -> Callable:
        """Décorateur pour exempter un endpoint du CSRF check"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Marquer comme exempt
            g.csrf_exempt = True
            return func(*args, **kwargs)
        return wrapper

    @staticmethod
    def get_token() -> str:
        """Récupérer le token CSRF courant"""
        return getattr(g, 'csrf_token', session.get('csrf_token', ''))


# ===== Helper global =====

# Instance unique
csrf = CSRFProtection()


def init_csrf_protection(app):
    """Initialiser la protection CSRF pour une app Flask"""
    csrf.init_app(app)

    # Ajouter une route pour générer/refresher le token
    @app.route('/api/v1/csrf-token', methods=['GET'])
    def get_csrf_token_endpoint():
        """Endpoint pour récupérer le token CSRF"""
        return jsonify({
            'csrf_token': csrf.get_token(),
            'expires_in': CSRFConfig.CSRF_TOKEN_TTL
        })

    return csrf


def csrf_exempt(func: Callable) -> Callable:
    """Décorateur pour exempter un endpoint"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        g.csrf_exempt = True
        return func(*args, **kwargs)
    return wrapper
