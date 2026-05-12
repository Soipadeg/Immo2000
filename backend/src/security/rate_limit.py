"""
Rate Limiting pour l'API Admin
"""

import time
from datetime import datetime, timedelta
from flask import request, jsonify, g
from functools import wraps
from src.models import db
import json

class RateLimitStore:
    """Stockage en base de données pour rate limiting"""

    def __init__(self):
        self.cleanup_interval = 3600  # Nettoyer chaque heure

    def _cleanup_old_records(self):
        """Supprimer les enregistrements expirés"""
        # À exécuter périodiquement
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=2)
            db.session.execute(
                db.text("DELETE FROM rate_limit_log WHERE timestamp < :cutoff"),
                {"cutoff": cutoff_time}
            )
            db.session.commit()
        except:
            db.session.rollback()

    def is_rate_limited(self, identifier: str, max_requests: int,
                       window_seconds: int = 3600) -> bool:
        """
        Vérifier si une identité a dépassé la limite de requêtes

        Args:
            identifier: IP ou user_id
            max_requests: Nombre max de requêtes
            window_seconds: Fenêtre de temps (défaut: 1 heure)

        Returns:
            True si rate-limited, False sinon
        """
        now = datetime.utcnow()
        start_window = now - timedelta(seconds=window_seconds)

        try:
            # Compter les requêtes dans la fenêtre
            count = db.session.query(RateLimitLog).filter(
                RateLimitLog.identifier == identifier,
                RateLimitLog.timestamp >= start_window
            ).count()

            # Ajouter la requête actuelle
            log = RateLimitLog(
                identifier=identifier,
                endpoint=request.endpoint or 'unknown',
                timestamp=now
            )
            db.session.add(log)
            db.session.commit()

            return count >= max_requests
        except:
            db.session.rollback()
            return False

    def get_remaining_requests(self, identifier: str, max_requests: int,
                              window_seconds: int = 3600) -> int:
        """Récupérer le nombre de requêtes restantes"""
        now = datetime.utcnow()
        start_window = now - timedelta(seconds=window_seconds)

        try:
            count = db.session.query(RateLimitLog).filter(
                RateLimitLog.identifier == identifier,
                RateLimitLog.timestamp >= start_window
            ).count()

            return max(0, max_requests - count)
        except:
            return max_requests


# Instance globale
rate_limiter = RateLimitStore()


class RateLimitLog(db.Model):
    """Table pour logger les requêtes (rate limiting)"""
    __tablename__ = 'rate_limit_log'

    log_id = db.Column(db.Integer, primary_key=True)
    identifier = db.Column(db.String(100), index=True)  # IP ou user_id
    endpoint = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f'<RateLimitLog {self.identifier} {self.endpoint}>'


def apply_rate_limit(max_requests: int = 100, window_seconds: int = 3600,
                     by_ip: bool = True, by_user: bool = True):
    """
    Décorateur pour appliquer rate limiting

    Usage:
        @apply_rate_limit(max_requests=50, window_seconds=3600)
        @admin_required
        def expensive_operation():
            ...

    Args:
        max_requests: Nombre maximum de requêtes
        window_seconds: Fenêtre de temps (secondes)
        by_ip: Limiter par IP
        by_user: Limiter par user_id
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Déterminer les identifiants
            identifiers = []

            if by_ip:
                ip = request.remote_addr
                identifiers.append(f"ip:{ip}")

            if by_user and hasattr(g, 'user_id'):
                user_id = g.user_id
                identifiers.append(f"user:{user_id}")

            # Vérifier rate limiting pour chaque identifiant
            for identifier in identifiers:
                if rate_limiter.is_rate_limited(identifier, max_requests, window_seconds):
                    remaining = rate_limiter.get_remaining_requests(identifier, max_requests, window_seconds)

                    return {
                        'code': 429,
                        'error': 'Trop de requêtes. Veuillez réessayer plus tard.',
                        'success': False,
                        'remaining_requests': remaining
                    }, 429

            # Exécuter la fonction
            response = f(*args, **kwargs)

            # Ajouter headers de rate limit
            if isinstance(response, tuple):
                resp_data, status = response[0], response[1] if len(response) > 1 else 200
                # Note: Flask ne permet pas de modifier les headers facilement ici
                # À implémenter via after_request hook si nécessaire

            return response

        return decorated_function
    return decorator


def get_rate_limit_status(identifier: str) -> dict:
    """Obtenir le statut de rate limiting pour une identité"""
    remaining = rate_limiter.get_remaining_requests(identifier, 100, 3600)

    return {
        'identifier': identifier,
        'remaining_requests': remaining,
        'max_requests': 100,
        'window_seconds': 3600,
        'reset_time': (datetime.utcnow() + timedelta(hours=1)).isoformat()
    }
