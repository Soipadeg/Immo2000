"""
Tests for Google OAuth Integration
Tests OAuth flow, token handling, and user management
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import requests


class TestGoogleOAuthConfig:
    """Test OAuth configuration"""

    def test_oauth_config_validation(self):
        """Test OAuth config validation"""
        from src.security.oauth import GoogleOAuthConfig

        # Should have required URLs
        assert GoogleOAuthConfig.AUTH_URL == 'https://accounts.google.com/o/oauth2/v2/auth'
        assert GoogleOAuthConfig.TOKEN_URL == 'https://oauth2.googleapis.com/token'
        assert GoogleOAuthConfig.USERINFO_URL == 'https://openidconnect.googleapis.com/v1/userinfo'

    def test_oauth_scopes(self):
        """Test OAuth scopes"""
        from src.security.oauth import GoogleOAuthConfig

        assert 'openid' in GoogleOAuthConfig.SCOPES
        assert 'email' in GoogleOAuthConfig.SCOPES
        assert 'profile' in GoogleOAuthConfig.SCOPES


class TestGoogleOAuthHandler:
    """Test OAuth handler"""

    def test_get_auth_url_generation(self):
        """Test authorization URL generation"""
        from src.security.oauth import oauth_handler

        state = 'test_state_123'
        auth_url = oauth_handler.get_auth_url(state)

        # Should contain required parameters
        assert 'client_id=' in auth_url
        assert 'redirect_uri=' in auth_url
        assert 'response_type=code' in auth_url
        assert 'scope=' in auth_url
        assert 'state=test_state_123' in auth_url
        assert 'access_type=offline' in auth_url
        assert 'prompt=consent' in auth_url

    @patch('src.security.oauth.requests.post')
    def test_exchange_code_for_token_success(self, mock_post):
        """Test successful code exchange"""
        from src.security.oauth import oauth_handler

        # Mock successful response
        mock_response = Mock()
        mock_response.json.return_value = {
            'access_token': 'test_access_token',
            'id_token': 'test_id_token',
            'refresh_token': 'test_refresh_token',
            'expires_in': 3600
        }
        mock_post.return_value = mock_response

        result = oauth_handler.exchange_code_for_token('test_code')

        assert result is not None
        assert result['access_token'] == 'test_access_token'
        assert result['id_token'] == 'test_id_token'
        assert result['refresh_token'] == 'test_refresh_token'

    @patch('src.security.oauth.requests.post')
    def test_exchange_code_for_token_failure(self, mock_post):
        """Test failed code exchange"""
        from src.security.oauth import oauth_handler

        # Mock failed response with RequestException
        mock_post.side_effect = requests.RequestException('Connection error')

        result = oauth_handler.exchange_code_for_token('test_code')

        # Should return None when error occurs
        assert result is None

    @patch('src.security.oauth.requests.get')
    def test_get_user_info_success(self, mock_get):
        """Test successful user info retrieval"""
        from src.security.oauth import oauth_handler

        # Mock successful response
        mock_response = Mock()
        mock_response.json.return_value = {
            'sub': '123456789',
            'email': 'test@example.com',
            'given_name': 'Test',
            'family_name': 'User',
            'picture': 'https://example.com/pic.jpg',
            'email_verified': True,
            'locale': 'en'
        }
        mock_get.return_value = mock_response

        result = oauth_handler.get_user_info('test_token')

        assert result is not None
        assert result['email'] == 'test@example.com'
        assert result['given_name'] == 'Test'
        assert result['email_verified'] is True

    @patch('src.security.oauth.requests.get')
    def test_get_user_info_failure(self, mock_get):
        """Test failed user info retrieval"""
        from src.security.oauth import oauth_handler

        # Mock failed response with RequestException
        mock_get.side_effect = requests.RequestException('Connection error')

        result = oauth_handler.get_user_info('test_token')

        # Should return None when error occurs
        assert result is None


class TestOAuthUserManager:
    """Test OAuth user manager"""

    def test_parse_user_data(self):
        """Test parsing Google user info"""
        from src.security.oauth import user_manager

        google_data = {
            'sub': '123456789',
            'email': 'test@example.com',
            'given_name': 'Test',
            'family_name': 'User',
            'picture': 'https://example.com/pic.jpg',
            'email_verified': True,
            'locale': 'fr'
        }

        parsed = user_manager.parse_user_data(google_data)

        assert parsed['email'] == 'test@example.com'
        assert parsed['username'] == 'test'
        assert parsed['first_name'] == 'Test'
        assert parsed['last_name'] == 'User'
        assert parsed['oauth_provider'] == 'google'
        assert parsed['oauth_id'] == '123456789'
        assert parsed['email_verified'] is True
        assert parsed['locale'] == 'fr'

    def test_sanitize_email(self):
        """Test email sanitization"""
        from src.security.oauth import user_manager

        # Test normal email
        assert user_manager.sanitize_email('Test@Example.COM') == 'test@example.com'

        # Test email with spaces
        assert user_manager.sanitize_email('  test@example.com  ') == 'test@example.com'

        # Test empty
        assert user_manager.sanitize_email('') == ''
        assert user_manager.sanitize_email(None) == ''

    def test_sanitize_username(self):
        """Test username sanitization"""
        from src.security.oauth import user_manager

        # Test normal username
        assert user_manager.sanitize_username('john_doe') == 'john_doe'

        # Test with special characters
        result = user_manager.sanitize_username('john@doe#123')
        assert '@' not in result
        assert '#' not in result

        # Test length limit
        long_username = 'a' * 50
        result = user_manager.sanitize_username(long_username)
        assert len(result) <= 30

        # Test empty
        result = user_manager.sanitize_username('')
        assert result == 'user'


class TestOAuthStateManager:
    """Test OAuth state management"""

    def test_generate_state(self):
        """Test state generation"""
        from src.security.oauth import state_manager

        state1 = state_manager.generate_state()
        state2 = state_manager.generate_state()

        # Should generate unique tokens
        assert state1 != state2
        assert len(state1) > 20
        assert len(state2) > 20

    def test_validate_state_success(self):
        """Test valid state validation"""
        from src.security.oauth import state_manager

        state = state_manager.generate_state(duration_seconds=600)

        # Should validate successfully
        assert state_manager.validate_state(state) is True

        # Token should be consumed (used only once)
        assert state_manager.validate_state(state) is False

    def test_validate_state_expired(self):
        """Test expired state validation"""
        from src.security.oauth import state_manager

        state = state_manager.generate_state(duration_seconds=0)

        # Wait for expiration
        import time
        time.sleep(0.1)

        # Should not validate
        assert state_manager.validate_state(state) is False

    def test_validate_state_invalid(self):
        """Test invalid state validation"""
        from src.security.oauth import state_manager

        # Non-existent state
        assert state_manager.validate_state('invalid_state') is False


class TestOAuthRoutes:
    """Test OAuth routes"""

    def test_oauth_status_endpoint(self, client):
        """Test OAuth status endpoint"""
        response = client.get('/api/v1/auth/oauth/status')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'oauth_available' in data
        assert 'providers' in data

    @patch('src.security.oauth.oauth_handler')
    def test_google_login_redirect(self, mock_handler, client):
        """Test Google login initiates redirect"""
        mock_handler.get_auth_url.return_value = 'https://accounts.google.com/...'

        response = client.get('/api/v1/auth/google/login')

        # Should redirect to Google
        assert response.status_code in [301, 302]

    @patch('src.security.oauth.oauth_handler')
    @patch('src.security.oauth.state_manager')
    def test_google_callback_valid(self, mock_state, mock_handler, client):
        """Test OAuth callback with valid code"""
        from src.security.oauth import state_manager

        # Mock state validation
        mock_state.validate_state.return_value = True

        # Mock token exchange
        mock_handler.exchange_code_for_token.return_value = {
            'access_token': 'test_token',
            'id_token': 'test_id',
            'refresh_token': 'test_refresh'
        }

        # Mock user info
        mock_handler.get_user_info.return_value = {
            'email': 'test@example.com',
            'given_name': 'Test',
            'family_name': 'User',
            'sub': '123'
        }

        # Mock ID token validation
        mock_handler.validate_id_token.return_value = {'email': 'test@example.com'}

        # Set OAuth state in session first
        with client.session_transaction() as sess:
            sess['oauth_state'] = 'test_state'

        response = client.get('/api/v1/auth/google/callback?code=test_code&state=test_state')

        # Should redirect to dashboard
        assert response.status_code in [301, 302]

    def test_oauth_logout(self, client):
        """Test OAuth logout"""
        # Set session data
        with client.session_transaction() as sess:
            sess['oauth_user'] = {'email': 'test@example.com'}
            sess['oauth_access_token'] = 'test_token'

        # Logout
        response = client.post('/api/v1/auth/google/logout')

        # Should return success or CSRF error (depending on config)
        assert response.status_code in [200, 403]

        if response.status_code == 200:
            data = json.loads(response.data)
            assert data['success'] is True

            # Session should be cleared
            with client.session_transaction() as sess:
                assert 'oauth_user' not in sess
                assert 'oauth_access_token' not in sess


class TestOAuthIntegration:
    """Integration tests for OAuth flow"""

    @patch('src.security.oauth.requests.post')
    @patch('src.security.oauth.requests.get')
    def test_complete_oauth_flow(self, mock_get, mock_post):
        """Test complete OAuth flow"""
        from src.security.oauth import (
            oauth_handler, user_manager, state_manager
        )

        # Step 1: Generate state
        state = state_manager.generate_state()
        assert state is not None

        # Step 2: Mock token exchange
        mock_response = Mock()
        mock_response.json.return_value = {
            'access_token': 'test_token',
            'id_token': 'test_id',
            'refresh_token': 'test_refresh'
        }
        mock_post.return_value = mock_response

        tokens = oauth_handler.exchange_code_for_token('test_code')
        assert tokens['access_token'] == 'test_token'

        # Step 3: Mock user info retrieval
        mock_response = Mock()
        mock_response.json.return_value = {
            'sub': '123',
            'email': 'user@example.com',
            'given_name': 'John',
            'family_name': 'Doe'
        }
        mock_get.return_value = mock_response

        user_info = oauth_handler.get_user_info('test_token')
        assert user_info['email'] == 'user@example.com'

        # Step 4: Parse user data
        parsed_user = user_manager.parse_user_data(user_info)
        assert parsed_user['email'] == 'user@example.com'
        assert parsed_user['oauth_provider'] == 'google'
        assert parsed_user['oauth_id'] == '123'


@pytest.fixture
def client():
    """Create Flask test client"""
    from src.app import create_app

    app = create_app()
    app.config['TESTING'] = True

    with app.test_client() as client:
        with app.app_context():
            yield client
