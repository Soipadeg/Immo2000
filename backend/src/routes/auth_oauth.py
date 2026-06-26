"""
OAuth Routes - Google Sign-In Integration
Handles OAuth authentication flow and user creation
"""

import logging
from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template_string
from datetime import datetime

logger = logging.getLogger(__name__)

# Import OAuth handlers
try:
    from src.security.oauth import (
        GoogleOAuthConfig, oauth_handler, user_manager,
        state_manager, oauth_required
    )
    OAUTH_AVAILABLE = GoogleOAuthConfig.validate_config()
except ImportError:
    OAUTH_AVAILABLE = False
    logger.warning('OAuth module not available')


# Create blueprint
auth_oauth_bp = Blueprint('auth_oauth', __name__, url_prefix='/api/v1/auth')


@auth_oauth_bp.route('/google/login', methods=['GET'])
def google_login():
    """
    Initiate Google OAuth login flow

    Returns:
        Redirect to Google authorization
    """
    if not OAUTH_AVAILABLE:
        return jsonify({'error': 'OAuth not configured'}), 503

    try:
        # Generate CSRF protection state
        state = state_manager.generate_state()

        # Store state in session for validation later
        session['oauth_state'] = state

        # Get authorization URL
        auth_url = oauth_handler.get_auth_url(state)

        logger.info('✓ Initiated Google OAuth login')
        return redirect(auth_url)

    except Exception as e:
        logger.error(f'✗ Error initiating Google OAuth: {str(e)}')
        return jsonify({'error': 'Failed to initiate login'}), 500


@auth_oauth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """
    Handle Google OAuth callback

    Returns:
        Redirect to frontend or error
    """
    if not OAUTH_AVAILABLE:
        return jsonify({'error': 'OAuth not configured'}), 503

    try:
        # Get authorization code and state
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')

        # Check for OAuth errors
        if error:
            logger.warning(f'OAuth error: {error}')
            return redirect(f'/login?error={error}')

        if not code or not state:
            logger.warning('Missing code or state in callback')
            return redirect('/login?error=invalid_callback')

        # Validate state (CSRF protection)
        if not state_manager.validate_state(state):
            logger.warning('Invalid state token')
            return redirect('/login?error=invalid_state')

        # Exchange code for token
        token_response = oauth_handler.exchange_code_for_token(code)
        if not token_response:
            logger.error('Failed to exchange code for token')
            return redirect('/login?error=token_exchange_failed')

        # Get access token
        access_token = token_response.get('access_token')
        id_token = token_response.get('id_token')
        refresh_token = token_response.get('refresh_token')

        # Get user information
        user_info = oauth_handler.get_user_info(access_token)
        if not user_info:
            logger.error('Failed to get user info')
            return redirect('/login?error=user_info_failed')

        # Validate ID token
        id_claims = oauth_handler.validate_id_token(id_token) if id_token else None

        # Parse user data
        user_data = user_manager.parse_user_data(user_info)

        # Store in session for now (normally would create/update user in DB)
        session['oauth_user'] = user_data
        session['oauth_access_token'] = access_token
        session['oauth_id_token'] = id_token
        session['oauth_refresh_token'] = refresh_token
        session['oauth_login_time'] = datetime.now().isoformat()

        logger.info(f'✓ OAuth callback successful for {user_data.get("email")}')

        # Redirect to frontend with success
        # In production, would create JWT token and redirect with token in URL
        return redirect(f'/dashboard?oauth_login=success&email={user_data.get("email")}')

    except Exception as e:
        logger.error(f'✗ Error in OAuth callback: {str(e)}')
        return redirect('/login?error=callback_failed')


@auth_oauth_bp.route('/google/user-info', methods=['GET'])
@oauth_required
def get_oauth_user_info():
    """
    Get current OAuth user information

    Returns:
        JSON with user data
    """
    try:
        user_data = session.get('oauth_user', {})
        return jsonify({
            'success': True,
            'user': user_data
        }), 200

    except Exception as e:
        logger.error(f'✗ Error getting user info: {str(e)}')
        return jsonify({'error': 'Failed to get user info'}), 500


@auth_oauth_bp.route('/google/logout', methods=['POST'])
def google_logout():
    """
    Logout from OAuth session

    Returns:
        JSON response
    """
    try:
        # Clear session data
        session.pop('oauth_user', None)
        session.pop('oauth_access_token', None)
        session.pop('oauth_id_token', None)
        session.pop('oauth_refresh_token', None)
        session.pop('oauth_login_time', None)
        session.pop('oauth_state', None)

        logger.info('✓ OAuth logout successful')
        return jsonify({'success': True, 'message': 'Logged out'}), 200

    except Exception as e:
        logger.error(f'✗ Error logging out: {str(e)}')
        return jsonify({'error': 'Failed to logout'}), 500


@auth_oauth_bp.route('/oauth/status', methods=['GET'])
def oauth_status():
    """
    Check OAuth configuration status

    Returns:
        JSON with OAuth status
    """
    return jsonify({
        'oauth_available': OAUTH_AVAILABLE,
        'providers': ['google'] if OAUTH_AVAILABLE else [],
        'oauth_configured': GoogleOAuthConfig.validate_config() if OAUTH_AVAILABLE else False
    }), 200


@auth_oauth_bp.route('/oauth/config', methods=['GET'])
def get_oauth_config():
    """
    Get OAuth client configuration for frontend

    Returns:
        JSON with client config
    """
    if not OAUTH_AVAILABLE:
        return jsonify({'error': 'OAuth not configured'}), 503

    return jsonify({
        'client_id': GoogleOAuthConfig.CLIENT_ID,
        'redirect_uri': GoogleOAuthConfig.REDIRECT_URI,
        'scopes': GoogleOAuthConfig.SCOPES
    }), 200


@auth_oauth_bp.route('/oauth/test-token', methods=['POST'])
def test_oauth_token():
    """
    Test OAuth token validity

    Returns:
        JSON with token validation result
    """
    try:
        data = request.get_json() or {}
        access_token = data.get('access_token')

        if not access_token:
            return jsonify({'error': 'No token provided'}), 400

        # Test token by getting user info
        user_info = oauth_handler.get_user_info(access_token)

        if user_info:
            return jsonify({
                'valid': True,
                'user': user_info.get('email'),
                'message': 'Token is valid'
            }), 200
        else:
            return jsonify({
                'valid': False,
                'message': 'Token is invalid or expired'
            }), 401

    except Exception as e:
        logger.error(f'✗ Error testing token: {str(e)}')
        return jsonify({'error': 'Failed to test token'}), 500


# Registration function
def register_oauth_routes(app):
    """
    Register OAuth routes with Flask app

    Args:
        app: Flask application
    """
    app.register_blueprint(auth_oauth_bp)
    logger.info(f'✓ OAuth routes registered (available: {OAUTH_AVAILABLE})')
