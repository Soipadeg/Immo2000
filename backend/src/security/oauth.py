"""
OAuth2 Integration for Google Sign-In
Handles authentication flow, token verification, and user profile management
"""

import os
import json
import logging
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
import requests
from functools import wraps
from flask import request, jsonify, session, redirect, url_for

logger = logging.getLogger(__name__)


class GoogleOAuthConfig:
    """Google OAuth2 Configuration"""

    CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/v1/auth/google/callback')
    AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
    TOKEN_URL = 'https://oauth2.googleapis.com/token'
    USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

    # OAuth scopes
    SCOPES = [
        'openid',
        'email',
        'profile'
    ]

    @classmethod
    def validate_config(cls) -> bool:
        """Validate OAuth configuration"""
        if not cls.CLIENT_ID or not cls.CLIENT_SECRET:
            logger.warning('⚠️  Google OAuth not configured (missing credentials)')
            return False
        return True


class GoogleOAuthHandler:
    """Handles Google OAuth2 flow"""

    def __init__(self):
        self.config = GoogleOAuthConfig()
        self.session_timeout = 3600  # 1 hour

    def get_auth_url(self, state: str) -> str:
        """
        Generate Google OAuth authorization URL

        Args:
            state: CSRF protection token

        Returns:
            Authorization URL
        """
        params = {
            'client_id': self.config.CLIENT_ID,
            'redirect_uri': self.config.REDIRECT_URI,
            'response_type': 'code',
            'scope': ' '.join(self.config.SCOPES),
            'state': state,
            'access_type': 'offline',
            'prompt': 'consent'
        }

        query_string = '&'.join([f'{k}={v}' for k, v in params.items()])
        return f'{self.config.AUTH_URL}?{query_string}'

    def exchange_code_for_token(self, code: str) -> Optional[Dict]:
        """
        Exchange authorization code for access token

        Args:
            code: Authorization code from Google

        Returns:
            Token response dict or None
        """
        try:
            payload = {
                'code': code,
                'client_id': self.config.CLIENT_ID,
                'client_secret': self.config.CLIENT_SECRET,
                'redirect_uri': self.config.REDIRECT_URI,
                'grant_type': 'authorization_code'
            }

            response = requests.post(self.config.TOKEN_URL, data=payload, timeout=10)
            response.raise_for_status()

            logger.info('✓ Successfully exchanged code for token')
            return response.json()

        except requests.RequestException as e:
            logger.error(f'✗ Failed to exchange code for token: {str(e)}')
            return None

    def get_user_info(self, access_token: str) -> Optional[Dict]:
        """
        Get user information from Google

        Args:
            access_token: Google access token

        Returns:
            User info dict or None
        """
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            response = requests.get(
                self.config.USERINFO_URL,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()

            user_info = response.json()
            logger.info(f'✓ Retrieved user info for {user_info.get("email")}')
            return user_info

        except requests.RequestException as e:
            logger.error(f'✗ Failed to get user info: {str(e)}')
            return None

    def validate_id_token(self, id_token: str) -> Optional[Dict]:
        """
        Validate and decode ID token (basic validation)

        Args:
            id_token: Google ID token

        Returns:
            Decoded token claims or None
        """
        try:
            # In production, use google-auth library for proper validation
            # This is a basic implementation
            import base64

            # ID tokens have 3 parts separated by dots
            parts = id_token.split('.')
            if len(parts) != 3:
                logger.warning('Invalid ID token format')
                return None

            # Decode the payload (second part)
            # Add padding if needed
            payload = parts[1]
            padding = 4 - len(payload) % 4
            if padding != 4:
                payload += '=' * padding

            decoded = base64.urlsafe_b64decode(payload)
            claims = json.loads(decoded)

            logger.info(f'✓ Validated ID token for {claims.get("email")}')
            return claims

        except Exception as e:
            logger.error(f'✗ Failed to validate ID token: {str(e)}')
            return None


class OAuthUserManager:
    """Manages user creation/updates from OAuth data"""

    @staticmethod
    def parse_user_data(google_user_info: Dict) -> Dict:
        """
        Parse Google user info into app user format

        Args:
            google_user_info: User data from Google

        Returns:
            Formatted user data
        """
        return {
            'email': google_user_info.get('email'),
            'username': google_user_info.get('email', '').split('@')[0],
            'first_name': google_user_info.get('given_name', ''),
            'last_name': google_user_info.get('family_name', ''),
            'profile_picture': google_user_info.get('picture'),
            'oauth_provider': 'google',
            'oauth_id': google_user_info.get('sub'),  # Subject ID from Google
            'email_verified': google_user_info.get('email_verified', False),
            'locale': google_user_info.get('locale', 'en')
        }

    @staticmethod
    def sanitize_email(email: str) -> str:
        """
        Sanitize email address

        Args:
            email: Email to sanitize

        Returns:
            Sanitized email
        """
        return email.lower().strip() if email else ''

    @staticmethod
    def sanitize_username(username: str) -> str:
        """
        Sanitize username

        Args:
            username: Username to sanitize

        Returns:
            Sanitized username (alphanumeric + underscore)
        """
        import re
        # Remove special characters, keep only alphanumeric and underscore
        sanitized = re.sub(r'[^\w.]', '', username)
        # Limit length
        return sanitized[:30] if sanitized else 'user'


def oauth_required(f):
    """
    Decorator to require valid OAuth session
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        oauth_token = session.get('oauth_access_token')
        if not oauth_token:
            return jsonify({'error': 'OAuth session required'}), 401

        return f(*args, **kwargs)

    return decorated_function


class OAuthStateManager:
    """Manages OAuth state tokens for CSRF protection"""

    _states = {}  # In production, use Redis or database

    @classmethod
    def generate_state(cls, duration_seconds: int = 600) -> str:
        """
        Generate and store state token

        Args:
            duration_seconds: Token validity duration

        Returns:
            State token
        """
        import secrets
        state = secrets.token_urlsafe(32)
        expiry = datetime.now() + timedelta(seconds=duration_seconds)
        cls._states[state] = expiry
        return state

    @classmethod
    def validate_state(cls, state: str) -> bool:
        """
        Validate state token

        Args:
            state: State token to validate

        Returns:
            True if valid, False otherwise
        """
        if state not in cls._states:
            logger.warning('Invalid state token')
            return False

        expiry = cls._states[state]
        if datetime.now() > expiry:
            logger.warning('State token expired')
            del cls._states[state]
            return False

        # Remove used state
        del cls._states[state]
        return True


# Initialize handlers
oauth_handler = GoogleOAuthHandler()
user_manager = OAuthUserManager()
state_manager = OAuthStateManager()
