"""
Tests pour les fonctionnalités de sécurité et conformité RGPD
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from src.app import app, db
from src.auth.models import User
from src.models.security import (
    SecurityProfile, AuditLog, RGPDRequest,
    IdentityVerificationLog, SecurityEvent
)
from src.security.auth_advanced import (
    TwoFactorAuth, IdentityVerification,
    XSSProtection, RateLimiter
)
from src.security.audit import (
    log_audit_action, AuditAction, AlertSystem
)


@pytest.fixture
def client():
    """Client Flask pour tests"""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.app_context():
        db.create_all()
        yield app.test_client()


@pytest.fixture
def test_user(client):
    """Créer un utilisateur de test"""
    with app.app_context():
        user = User(
            email='test@immo2000.fr',
            nom='Test',
            prenom='User',
            password_hash='hashed_password',
            role='buyer'
        )
        db.session.add(user)
        db.session.commit()
        return user


class TestTwoFactorAuth:
    """Tests pour la double authentification"""

    def test_generate_secret(self):
        """Test génération d'un secret TOTP"""
        secret = TwoFactorAuth.generate_secret()
        assert secret is not None
        assert len(secret) > 0
        assert isinstance(secret, str)

    def test_generate_qr_code(self):
        """Test génération du QR code"""
        secret = TwoFactorAuth.generate_secret()
        qr_code = TwoFactorAuth.generate_qr_code("test@example.com", secret)

        assert qr_code is not None
        assert isinstance(qr_code, str)
        # Vérifier qu'il s'agit de base64
        assert qr_code.startswith('/') or qr_code.startswith('iV')

    def test_verify_token_valid(self):
        """Test vérification d'un code valide"""
        secret = TwoFactorAuth.generate_secret()
        # Générer un code valide
        import pyotp
        totp = pyotp.TOTP(secret)
        code = totp.now()

        assert TwoFactorAuth.verify_token(secret, code) is True

    def test_verify_token_invalid(self):
        """Test vérification d'un code invalide"""
        secret = TwoFactorAuth.generate_secret()
        assert TwoFactorAuth.verify_token(secret, "000000") is False

    def test_get_backup_codes(self):
        """Test génération des codes de secours"""
        codes = TwoFactorAuth.get_backup_codes(count=10)

        assert len(codes) == 10
        assert all(isinstance(c, str) for c in codes)
        assert all(len(c) >= 6 for c in codes)


class TestIdentityVerification:
    """Tests pour la vérification d'identité"""

    @patch('requests.post')
    def test_start_yousign_verification(self, mock_post):
        """Test démarrage vérification Yousign"""
        mock_post.return_value.json.return_value = {
            'data': {
                'id': 'yousign_123',
                'followupUrl': 'https://yousign.com/verify/123'
            }
        }
        mock_post.return_value.status_code = 201

        result = IdentityVerification.start_yousign_verification(
            user_id=1,
            email='test@example.com',
            first_name='Jean',
            last_name='Dupont'
        )

        assert result.get('verification_id') == 'yousign_123'
        assert 'url' in result

    @patch('requests.post')
    def test_start_veriff_verification(self, mock_post):
        """Test démarrage vérification Veriff"""
        mock_post.return_value.json.return_value = {
            'data': {
                'sessionId': 'veriff_456',
                'sessionUrl': 'https://veriff.com/verify/456'
            }
        }
        mock_post.return_value.status_code = 201

        result = IdentityVerification.start_veriff_verification(
            user_id=1,
            email='test@example.com',
            first_name='Jean',
            last_name='Dupont'
        )

        assert result.get('verification_id') == 'veriff_456'
        assert 'url' in result


class TestXSSProtection:
    """Tests pour la protection XSS"""

    def test_clean_input_removes_script_tags(self):
        """Test suppression des tags script"""
        dirty = '<script>alert("xss")</script>Hello'
        clean = XSSProtection.clean_input(dirty)

        assert '<script>' not in clean
        assert 'alert' not in clean
        assert 'Hello' in clean

    def test_clean_input_allows_safe_html(self):
        """Test conservation du HTML sûr"""
        safe = '<p>Hello <strong>world</strong></p>'
        clean = XSSProtection.clean_input(safe)

        assert '<p>' in clean or '<p ' in clean
        assert '<strong>' in clean
        assert 'world' in clean

    def test_clean_input_removes_event_handlers(self):
        """Test suppression des event handlers"""
        dirty = '<div onclick="alert(1)">Click me</div>'
        clean = XSSProtection.clean_input(dirty)

        assert 'onclick' not in clean
        assert 'alert' not in clean
        assert 'Click me' in clean


class TestRateLimiter:
    """Tests pour le rate limiting"""

    def test_rate_limiter_allows_first_requests(self):
        """Test que les premières requêtes passent"""
        ip = '192.168.1.1'

        # Réinitialiser le limiter
        RateLimiter.requests = {}

        # Première requête
        assert RateLimiter.is_rate_limited(ip) is False

    def test_rate_limiter_blocks_after_limit(self):
        """Test blocage après limite dépassée"""
        ip = '192.168.1.2'

        # Réinitialiser
        RateLimiter.requests = {}
        RateLimiter.max_requests = 3
        RateLimiter.window_seconds = 60

        # Dépasser la limite
        for i in range(4):
            RateLimiter.is_rate_limited(ip)

        # Devrait être bloqué
        assert RateLimiter.is_rate_limited(ip) is True


class TestAuditLogging:
    """Tests pour le logging d'audit"""

    def test_log_audit_action_success(self):
        """Test enregistrement d'une action réussie"""
        with app.app_context():
            log_audit_action(
                user_id=1,
                action=AuditAction.LOGIN,
                status="success",
                risk_level="low"
            )

            # Vérifier que le log a été créé
            log = AuditLog.query.filter_by(
                action=AuditAction.LOGIN
            ).first()

            assert log is not None
            assert log.status == "success"
            assert log.risk_level == "low"

    def test_log_audit_action_with_resource(self):
        """Test enregistrement avec ressource"""
        with app.app_context():
            log_audit_action(
                user_id=1,
                action=AuditAction.DELETE_DATA,
                resource_type="user",
                resource_id=5,
                status="success"
            )

            log = AuditLog.query.filter_by(
                action=AuditAction.DELETE_DATA
            ).first()

            assert log.resource_type == "user"
            assert log.resource_id == 5


class TestSecurityProfileModel:
    """Tests pour le modèle SecurityProfile"""

    def test_create_security_profile(self):
        """Test création d'un profil de sécurité"""
        with app.app_context():
            profile = SecurityProfile(utilisateur_id=1)
            db.session.add(profile)
            db.session.commit()

            assert profile.id is not None
            assert profile.is_2fa_enabled is False
            assert profile.identite_verifiee is False

    def test_update_2fa_settings(self):
        """Test mise à jour des paramètres 2FA"""
        with app.app_context():
            profile = SecurityProfile(utilisateur_id=1)
            profile.secret_2fa = "JBSWY3DPEBLW64TMMQ======"
            profile.is_2fa_enabled = True
            profile.backup_codes = ['code1', 'code2', 'code3']

            db.session.add(profile)
            db.session.commit()

            # Vérifier
            saved = SecurityProfile.query.get(profile.id)
            assert saved.is_2fa_enabled is True
            assert len(saved.backup_codes) == 3


class TestRGPDRequests:
    """Tests pour les demandes RGPD"""

    def test_create_rgpd_export_request(self):
        """Test création d'une demande d'export"""
        with app.app_context():
            request = RGPDRequest(
                utilisateur_id=1,
                request_type='data_export',
                status='pending',
                reason='Export personnel'
            )
            db.session.add(request)
            db.session.commit()

            assert request.id is not None
            assert request.request_type == 'data_export'
            assert request.status == 'pending'

    def test_create_rgpd_delete_request(self):
        """Test création d'une demande de suppression"""
        with app.app_context():
            token = 'confirm_token_123'
            request = RGPDRequest(
                utilisateur_id=1,
                request_type='delete_account',
                status='pending',
                confirmation_token=token,
                confirmation_expires=datetime.utcnow() + timedelta(days=30)
            )
            db.session.add(request)
            db.session.commit()

            # Vérifier qu'on peut retrouver par token
            found = RGPDRequest.query.filter_by(
                confirmation_token=token
            ).first()

            assert found is not None
            assert found.request_type == 'delete_account'


class TestSecurityRoutes:
    """Tests pour les routes de sécurité"""

    def test_2fa_setup_get(self, client, test_user):
        """Test GET /api/v1/security/2fa/setup"""
        with client:
            response = client.get(
                '/api/v1/security/2fa/setup',
                headers={'Authorization': f'Bearer {test_user.id}'}
            )

            # Devrait retourner 401 sans authentification
            assert response.status_code in [401, 307]

    def test_rgpd_status_get(self, client, test_user):
        """Test GET /api/v1/security/rgpd/status"""
        with client:
            response = client.get(
                '/api/v1/security/rgpd/status',
                headers={'Authorization': f'Bearer {test_user.id}'}
            )

            assert response.status_code in [200, 401, 307]

    def test_security_profile_view(self, client, test_user):
        """Test GET /api/v1/security/profile"""
        with client:
            response = client.get(
                '/api/v1/security/profile',
                headers={'Authorization': f'Bearer {test_user.id}'}
            )

            assert response.status_code in [200, 401, 307]


class TestIdentityVerificationLog:
    """Tests pour les logs de vérification d'identité"""

    def test_create_verification_log(self):
        """Test création d'un log de vérification"""
        with app.app_context():
            log = IdentityVerificationLog(
                utilisateur_id=1,
                provider='yousign',
                verification_id='yousign_123',
                document_type='passport',
                status='pending'
            )
            db.session.add(log)
            db.session.commit()

            assert log.id is not None
            assert log.provider == 'yousign'
            assert log.status == 'pending'

    def test_update_verification_status(self):
        """Test mise à jour du statut de vérification"""
        with app.app_context():
            log = IdentityVerificationLog(
                utilisateur_id=1,
                provider='veriff',
                verification_id='veriff_456',
                status='pending'
            )
            db.session.add(log)
            db.session.commit()

            # Mettre à jour
            log.status = 'approved'
            log.completed_at = datetime.utcnow()
            db.session.commit()

            # Vérifier
            saved = IdentityVerificationLog.query.get(log.id)
            assert saved.status == 'approved'
            assert saved.completed_at is not None


class TestSecurityEvents:
    """Tests pour la détection d'événements de sécurité"""

    def test_create_security_event(self):
        """Test création d'un événement de sécurité"""
        with app.app_context():
            event = SecurityEvent(
                utilisateur_id=1,
                event_type='failed_login',
                severity='high',
                ip_address='192.168.1.100'
            )
            db.session.add(event)
            db.session.commit()

            assert event.id is not None
            assert event.event_type == 'failed_login'
            assert event.severity == 'high'

    def test_detect_multiple_failed_logins(self):
        """Test détection de tentatives multiples échouées"""
        with app.app_context():
            user_id = 1

            # Créer plusieurs événements d'échec
            for i in range(6):
                event = SecurityEvent(
                    utilisateur_id=user_id,
                    event_type='failed_login',
                    severity='medium'
                )
                db.session.add(event)
            db.session.commit()

            # Vérifier la détection
            failed_count = SecurityEvent.query.filter_by(
                utilisateur_id=user_id,
                event_type='failed_login'
            ).count()

            assert failed_count >= 6


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
