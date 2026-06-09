"""
Utilitaires complets de sécurité pour Immo2000
- Vérification d'identité (Yousign, Veriff)
- 2FA (TOTP)
- Chiffrement
- Protection XSS/CSRF
- Rate limiting
"""

import pyotp
import qrcode
import io
import base64
import hashlib
import secrets
from datetime import datetime, timedelta
import requests
from flask import current_app, request
from functools import wraps
import bleach
import logging

logger = logging.getLogger(__name__)


# ==================== 2FA (TOTP) ====================

class TwoFactorAuth:
    """Gestion de l'authentification 2FA avec TOTP (Google Authenticator, Authy)"""

    @staticmethod
    def generate_secret():
        """Générer un secret aléatoire pour TOTP (base32)"""
        return pyotp.random_base32()

    @staticmethod
    def generate_qr_code(user_email, secret):
        """
        Générer un QR code pour configuration 2FA

        Args:
            user_email: Email de l'utilisateur
            secret: Secret TOTP généré

        Returns:
            String base64 du QR code (image PNG)
        """
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(
            name=user_email,
            issuer_name="Immo2000"
        )

        img = qrcode.make(uri)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode()

    @staticmethod
    def verify_token(secret, token, window=1):
        """
        Vérifier un code TOTP

        Args:
            secret: Secret TOTP
            token: Code 6 chiffres à vérifier
            window: Fenêtre de temps pour la tolérance (±30s)

        Returns:
            bool: True si valide
        """
        totp = pyotp.TOTP(secret)
        # Vérifier avec une fenêtre de tolérance
        return totp.verify(token, valid_window=window)

    @staticmethod
    def get_backup_codes(count=10):
        """
        Générer des codes de secours pour 2FA

        Args:
            count: Nombre de codes à générer

        Returns:
            List[str]: Codes de secours
        """
        return [secrets.token_urlsafe(8) for _ in range(count)]


# ==================== VÉRIFICATION D'IDENTITÉ ====================

class IdentityVerification:
    """Gestion de la vérification d'identité via Yousign ou Veriff"""

    @staticmethod
    def start_yousign_verification(user_id, email, first_name, last_name):
        """
        Démarrer une vérification d'identité via Yousign ID

        Args:
            user_id: ID de l'utilisateur
            email: Email de l'utilisateur
            first_name: Prénom
            last_name: Nom

        Returns:
            dict: {'verification_id': str, 'url': str} ou {'error': str}
        """
        try:
            url = "https://api.yousign.com/identity-verifications"
            headers = {
                "Authorization": f"Bearer {current_app.config.get('YOUSIGN_API_KEY')}",
                "Content-Type": "application/json"
            }

            data = {
                "user": {
                    "email": email,
                    "firstname": first_name,
                    "lastname": last_name
                },
                "callback_url": f"{current_app.config.get('APP_URL')}/api/v1/utilisateurs/{user_id}/verification-callback"
            }

            response = requests.post(url, headers=headers, json=data, timeout=10)
            response.raise_for_status()

            result = response.json()
            return {
                "verification_id": result.get("id"),
                "url": result.get("url")
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Yousign verification error (request): {str(e)}", exc_info=True)
            return {"error": str(e)}
        except Exception as e:
            logger.error(f"Yousign verification error: {str(e)}", exc_info=True)
            return {"error": str(e)}

    @staticmethod
    def start_veriff_verification(user_id, email, first_name, last_name):
        """
        Démarrer une vérification d'identité via Veriff

        Args:
            user_id: ID de l'utilisateur
            email: Email de l'utilisateur
            first_name: Prénom
            last_name: Nom

        Returns:
            dict: {'verification_id': str, 'url': str} ou {'error': str}
        """
        try:
            url = "https://api.veriff.com/v1/sessions"
            headers = {
                "Authorization": f"Bearer {current_app.config.get('VERIFF_API_KEY')}",
                "Content-Type": "application/json"
            }

            data = {
                "vendorData": f"user_{user_id}",
                "callback": f"{current_app.config.get('APP_URL')}/api/v1/utilisateurs/{user_id}/verification-callback",
                "person": {
                    "firstName": first_name,
                    "lastName": last_name,
                    "email": email
                }
            }

            response = requests.post(url, headers=headers, json=data, timeout=10)
            response.raise_for_status()

            result = response.json()
            return {
                "verification_id": result.get("session", {}).get("id"),
                "url": result.get("session", {}).get("url")
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Veriff verification error (request): {str(e)}", exc_info=True)
            return {"error": str(e)}
        except Exception as e:
            logger.error(f"Veriff verification error: {str(e)}", exc_info=True)
            return {"error": str(e)}

    @staticmethod
    def verify_yousign_callback(signature, payload, secret):
        """
        Vérifier la signature d'un callback Yousign

        Args:
            signature: Signature fournie dans les headers
            payload: Contenu du callback
            secret: Secret Yousign

        Returns:
            bool: Signature valide?
        """
        expected_signature = hashlib.sha256(
            (payload + secret).encode()
        ).hexdigest()
        return signature == expected_signature

    @staticmethod
    def verify_veriff_callback(signature, payload, secret):
        """
        Vérifier la signature d'un callback Veriff

        Args:
            signature: Signature fournie dans les headers
            payload: Contenu du callback
            secret: Secret Veriff

        Returns:
            bool: Signature valide?
        """
        expected_signature = hashlib.sha256(
            (payload + secret).encode()
        ).hexdigest()
        return signature == expected_signature


# ==================== NETTOYAGE XSS ====================

class XSSProtection:
    """Protection contre les attaques XSS"""

    ALLOWED_TAGS = ['p', 'b', 'i', 'u', 'em', 'strong', 'a', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    ALLOWED_ATTRS = {'a': ['href', 'title', 'target'], 'img': ['src', 'alt']}

    @staticmethod
    def clean_input(text):
        """
        Nettoyer une entrée utilisateur contre les attaques XSS

        Args:
            text: Texte à nettoyer

        Returns:
            str: Texte nettoyé
        """
        if not text:
            return text

        return bleach.clean(
            text,
            tags=XSSProtection.ALLOWED_TAGS,
            attributes=XSSProtection.ALLOWED_ATTRS,
            strip=True
        )

    @staticmethod
    def clean_decorator(func):
        """
        Décorateur pour nettoyer automatiquement les entrées d'un formulaire

        Usage:
            @clean_decorator
            def create_annonce():
                title = request.form.get('title')  # Déjà nettoyé
        """
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Nettoyer tous les champs du formulaire
            if request.method in ['POST', 'PUT']:
                for key in request.form:
                    cleaned = XSSProtection.clean_input(request.form.get(key))
                    # Remplacement dans request.form (hacky mais utile)
                    request.form = {**request.form, key: cleaned}
            return func(*args, **kwargs)
        return wrapper


# ==================== RATE LIMITING ====================

class RateLimiter:
    """Rate limiting simple par IP (complémentaire à Flask-Limiter)"""

    def __init__(self, max_requests=10, window_seconds=60):
        """
        Args:
            max_requests: Nombre maximum de requêtes
            window_seconds: Fenêtre de temps en secondes
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}  # {ip: [(timestamp, count), ...]}

    def is_rate_limited(self, ip):
        """
        Vérifier si l'IP a dépassé la limite

        Args:
            ip: Adresse IP

        Returns:
            bool: True si rate limité
        """
        now = datetime.utcnow()

        if ip not in self.requests:
            self.requests[ip] = []

        # Nettoyer les anciennes requêtes
        self.requests[ip] = [
            req_time for req_time in self.requests[ip]
            if (now - req_time).total_seconds() < self.window_seconds
        ]

        # Vérifier la limite
        if len(self.requests[ip]) >= self.max_requests:
            return True

        # Ajouter la nouvelle requête
        self.requests[ip].append(now)
        return False

    def get_remaining(self, ip):
        """Obtenir le nombre de requêtes restantes"""
        now = datetime.utcnow()
        self.requests[ip] = [
            req_time for req_time in self.requests.get(ip, [])
            if (now - req_time).total_seconds() < self.window_seconds
        ]
        return max(0, self.max_requests - len(self.requests[ip]))


# ==================== HELPERS ====================

def generate_secure_token(length=32):
    """Générer un token sécurisé"""
    return secrets.token_urlsafe(length)


def hash_password(password):
    """Hacher un mot de passe avec SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def compare_password(password, hash_value):
    """Comparer un mot de passe avec son hash"""
    return hash_password(password) == hash_value
