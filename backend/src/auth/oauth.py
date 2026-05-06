"""
OAuth routes for Google and Facebook authentication.

Handles OAuth flows for Google and Facebook login/signup.
"""

from flask import Blueprint, request, jsonify, url_for, current_app
from datetime import datetime
import requests
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from .models import db, User
from .utils import generate_access_token, generate_refresh_token, hash_password

# Create OAuth blueprint
oauth_bp = Blueprint('oauth', __name__, url_prefix='/auth/oauth')


# ===== GOOGLE OAUTH =====

@oauth_bp.route('/google/callback', methods=['POST'])
def google_callback():
    """
    Handle Google OAuth callback.

    Expected JSON body:
    {
        "id_token": "..."  // Google ID token from frontend
    }

    Returns:
    {
        "access_token": "...",
        "refresh_token": "...",
        "user": {...}
    }
    """
    try:
        data = request.get_json()
        id_token = data.get('id_token')

        if not id_token:
            return jsonify({'error': 'Missing id_token'}), 400

        # Verify Google ID token
        google_user = verify_google_token(id_token)
        if not google_user:
            return jsonify({'error': 'Invalid Google token'}), 401

        # Get or create user
        user = User.query.filter_by(google_id=google_user['sub']).first()

        if not user:
            # Check if email already exists
            user = User.query.filter_by(email=google_user['email']).first()

            if user:
                # Link Google account to existing user
                user.google_id = google_user['sub']
            else:
                # Create new user
                user = User(
                    email=google_user['email'],
                    nom=google_user.get('family_name', 'N/A'),
                    prenom=google_user.get('given_name', 'N/A'),
                    photo_url=google_user.get('picture'),
                    auth_method='google',
                    google_id=google_user['sub'],
                    role='acheteur'  # Default role
                )
                db.session.add(user)
        else:
            # Update last login
            user.auth_method = 'google'

        user.date_derniere_connexion = datetime.utcnow()
        db.session.commit()

        # Generate JWT tokens
        access_token = generate_access_token(user.id, user.email, user.role)
        refresh_token = generate_refresh_token(user.id)

        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Google OAuth error: {str(e)}')
        return jsonify({'error': 'Authentication failed'}), 500


def verify_google_token(id_token: str) -> dict:
    """
    Verify Google ID token and extract user info.

    Args:
        id_token: Google ID token from frontend

    Returns:
        dict: User info from token, or None if invalid
    """
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        # Verify token
        idinfo = id_token.verify_oauth2_token(
            id_token,
            google_requests.Request(),
            current_app.config['GOOGLE_CLIENT_ID']
        )

        # Token is valid
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            return None

        return idinfo
    except Exception as e:
        current_app.logger.error(f'Google token verification error: {str(e)}')
        return None


# ===== FACEBOOK OAUTH =====

@oauth_bp.route('/facebook/callback', methods=['POST'])
def facebook_callback():
    """
    Handle Facebook OAuth callback.

    Expected JSON body:
    {
        "access_token": "..."  // Facebook access token from frontend
    }

    Returns:
    {
        "access_token": "...",
        "refresh_token": "...",
        "user": {...}
    }
    """
    try:
        data = request.get_json()
        fb_token = data.get('access_token')

        if not fb_token:
            return jsonify({'error': 'Missing access_token'}), 400

        # Get Facebook user info
        facebook_user = get_facebook_user_info(fb_token)
        if not facebook_user:
            return jsonify({'error': 'Invalid Facebook token'}), 401

        # Get or create user
        user = User.query.filter_by(facebook_id=facebook_user['id']).first()

        if not user:
            # Check if email already exists
            user = User.query.filter_by(email=facebook_user['email']).first()

            if user:
                # Link Facebook account to existing user
                user.facebook_id = facebook_user['id']
            else:
                # Create new user
                user = User(
                    email=facebook_user['email'],
                    nom=facebook_user.get('last_name', 'N/A'),
                    prenom=facebook_user.get('first_name', 'N/A'),
                    photo_url=facebook_user.get('picture', {}).get('data', {}).get('url'),
                    auth_method='facebook',
                    facebook_id=facebook_user['id'],
                    role='acheteur'  # Default role
                )
                db.session.add(user)
        else:
            # Update last login
            user.auth_method = 'facebook'

        user.date_derniere_connexion = datetime.utcnow()
        db.session.commit()

        # Generate JWT tokens
        access_token = generate_access_token(user.id, user.email, user.role)
        refresh_token = generate_refresh_token(user.id)

        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Facebook OAuth error: {str(e)}')
        return jsonify({'error': 'Authentication failed'}), 500


def get_facebook_user_info(access_token: str) -> dict:
    """
    Get user info from Facebook using access token.

    Args:
        access_token: Facebook access token from frontend

    Returns:
        dict: User info from Facebook, or None if invalid
    """
    try:
        url = 'https://graph.facebook.com/me'
        params = {
            'access_token': access_token,
            'fields': 'id,email,first_name,last_name,picture'
        }

        response = requests.get(url, params=params)

        if response.status_code != 200:
            current_app.logger.error(f'Facebook API error: {response.text}')
            return None

        return response.json()
    except Exception as e:
        current_app.logger.error(f'Facebook user info error: {str(e)}')
        return None


# ===== APPLE OAUTH =====

@oauth_bp.route('/apple/callback', methods=['POST'])
def apple_callback():
    """
    Handle Apple OAuth callback.

    Expected JSON body:
    {
        "id_token": "..."  // Apple ID token from frontend
    }

    Returns:
    {
        "access_token": "...",
        "refresh_token": "...",
        "user": {...}
    }
    """
    try:
        data = request.get_json()
        id_token_str = data.get('id_token')

        if not id_token_str:
            return jsonify({'error': 'Missing id_token'}), 400

        # Verify Apple ID token
        apple_user = verify_apple_token(id_token_str)
        if not apple_user:
            return jsonify({'error': 'Invalid Apple token'}), 401

        # Get or create user
        user = User.query.filter_by(apple_id=apple_user['sub']).first()

        if not user:
            # Check if email already exists
            user = User.query.filter_by(email=apple_user.get('email')).first()

            if user:
                # Link Apple account to existing user
                user.apple_id = apple_user['sub']
            else:
                # Create new user
                user = User(
                    email=apple_user.get('email', f"user{apple_user['sub']}@apple.local"),
                    nom=apple_user.get('family_name', 'N/A'),
                    prenom=apple_user.get('given_name', 'N/A'),
                    photo_url=None,  # Apple doesn't provide photo in token
                    auth_method='apple',
                    apple_id=apple_user['sub'],
                    role='acheteur'  # Default role
                )
                db.session.add(user)
        else:
            # Update last login
            user.auth_method = 'apple'

        user.date_derniere_connexion = datetime.utcnow()
        db.session.commit()

        # Generate JWT tokens
        access_token = generate_access_token(user.id, user.email, user.role)
        refresh_token = generate_refresh_token(user.id)

        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Apple OAuth error: {str(e)}')
        return jsonify({'error': 'Authentication failed'}), 500


def verify_apple_token(id_token_str: str) -> dict:
    """
    Verify Apple ID token and extract user info.

    Args:
        id_token_str: Apple ID token from frontend

    Returns:
        dict: User info from token, or None if invalid
    """
    try:
        import jwt
        from urllib.request import urlopen
        import json

        # Decode without verification first to get the header
        unverified_header = jwt.get_unverified_header(id_token_str)
        kid = unverified_header.get('kid')

        # Get Apple's public keys
        keys_url = 'https://appleid.apple.com/auth/keys'
        response = requests.get(keys_url)
        keys = response.json()['keys']

        # Find the matching key
        key = None
        for k in keys:
            if k.get('kid') == kid:
                key = k
                break

        if not key:
            current_app.logger.error('Apple key not found')
            return None

        # Convert JWK to RSA public key
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.backends import default_backend
        from jwt.algorithms import RSAAlgorithm

        public_key = RSAAlgorithm.from_jwk(json.dumps(key))

        # Verify and decode the token
        payload = jwt.decode(
            id_token_str,
            public_key,
            algorithms=['RS256'],
            audience=current_app.config.get('APPLE_CLIENT_ID')
        )

        return payload

    except Exception as e:
        current_app.logger.error(f'Apple token verification error: {str(e)}')
        return None
