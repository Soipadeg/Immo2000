"""
Tests for password validation and audit logging.
"""

import pytest
from backend.src.validators.password import PasswordValidator
from backend.src.models.audit import AuditLog, SecurityEvent, AuditActionType
from backend.src.database import db


class TestPasswordValidator:
    """Test password validation."""

    def test_valid_password(self):
        """Test a valid strong password."""
        password = "SecurePass123!@"
        is_valid, message = PasswordValidator.validate(password)
        assert is_valid is True
        assert "✅" in message

    def test_password_too_short(self):
        """Test password too short."""
        password = "Short1!"
        is_valid, message = PasswordValidator.validate(password)
        assert is_valid is False
        assert "minimum" in message.lower()

    def test_password_missing_uppercase(self):
        """Test password without uppercase."""
        password = "weakpass123!@#"
        is_valid, message = PasswordValidator.validate(password)
        assert is_valid is False
        assert "majuscule" in message.lower() or "uppercase" in message.lower()

    def test_password_missing_lowercase(self):
        """Test password without lowercase."""
        password = "WEAKPASS123!@#"
        is_valid, message = PasswordValidator.validate(password)
        assert is_valid is False
        assert "minuscule" in message.lower() or "lowercase" in message.lower()

    def test_password_missing_numbers(self):
        """Test password without numbers."""
        password = "WeakPass!@#$%^"
        is_valid, message = PasswordValidator.validate(password)
        assert is_valid is False
        assert "chiffre" in message.lower() or "number" in message.lower()

    def test_password_missing_special(self):
        """Test password without special characters."""
        password = "WeakPass1234567"
        is_valid, message = PasswordValidator.validate(password)
        assert is_valid is False
        assert "spécial" in message.lower() or "special" in message.lower()

    def test_password_with_spaces(self):
        """Test password with spaces."""
        password = "Weak Pass 123!@"
        is_valid, message = PasswordValidator.validate(password)
        assert is_valid is False
        assert "espace" in message.lower() or "space" in message.lower()

    def test_password_with_repeating_chars(self):
        """Test password with repeating characters."""
        password = "WeakPass1111!@"
        is_valid, message = PasswordValidator.validate(password)
        assert is_valid is False
        assert "répétition" in message.lower() or "repeat" in message.lower()

    def test_blocked_password(self):
        """Test common blocked passwords."""
        for pwd in ['password123', 'qwerty', 'letmein']:
            is_valid, message = PasswordValidator.validate(pwd)
            assert is_valid is False
            assert "commun" in message.lower() or "common" in message.lower()

    def test_password_strength_score(self):
        """Test password strength scoring."""
        weak = "WeakPass1!"
        medium = "MediumPass123!@"
        strong = "VeryStrongPassword123!@#$%^&"

        weak_score = PasswordValidator.get_strength_score(weak)
        medium_score = PasswordValidator.get_strength_score(medium)
        strong_score = PasswordValidator.get_strength_score(strong)

        assert weak_score < medium_score < strong_score
        assert 0 <= weak_score <= 100
        assert 0 <= medium_score <= 100
        assert 0 <= strong_score <= 100

    def test_strength_labels(self):
        """Test strength label generation."""
        score_20 = PasswordValidator.get_strength_label(20)
        score_50 = PasswordValidator.get_strength_label(50)
        score_100 = PasswordValidator.get_strength_label(100)

        assert "faible" in score_20.lower() or "weak" in score_20.lower()
        assert "moyen" in score_50.lower() or "medium" in score_50.lower()
        assert "fort" in score_100.lower() or "strong" in score_100.lower()

    def test_validate_with_score(self):
        """Test detailed validation with score."""
        password = "SecurePass123!@"
        result = PasswordValidator.validate_with_score(password)

        assert 'is_valid' in result
        assert 'message' in result
        assert 'score' in result
        assert 'strength' in result
        assert 'requirements' in result

        assert result['is_valid'] is True
        assert result['score'] > 0
        assert result['requirements']['min_length'] is True
        assert result['requirements']['uppercase'] is True
        assert result['requirements']['lowercase'] is True
        assert result['requirements']['numbers'] is True
        assert result['requirements']['special'] is True


class TestAuditLogging:
    """Test audit logging functionality."""

    def test_create_audit_log(self):
        """Test creating an audit log."""
        log = AuditLog(
            user_id=1,
            action=AuditActionType.LOGIN_SUCCESS,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0",
            status="success"
        )

        db.session.add(log)
        db.session.commit()

        retrieved = AuditLog.query.filter_by(id=log.id).first()
        assert retrieved is not None
        assert retrieved.action == AuditActionType.LOGIN_SUCCESS
        assert retrieved.ip_address == "192.168.1.1"

    def test_audit_log_to_dict(self):
        """Test audit log serialization."""
        log = AuditLog(
            user_id=1,
            action=AuditActionType.USER_UPDATE,
            resource_type="user",
            resource_id=10,
            ip_address="192.168.1.1",
            status="success"
        )

        db.session.add(log)
        db.session.commit()

        log_dict = log.to_dict()

        assert log_dict['user_id'] == 1
        assert log_dict['action'] == AuditActionType.USER_UPDATE
        assert log_dict['resource_type'] == "user"
        assert log_dict['resource_id'] == 10
        assert 'created_at' in log_dict

    def test_audit_log_with_changes(self):
        """Test audit log with change tracking."""
        changes = {
            'before': {'email': 'old@test.com'},
            'after': {'email': 'new@test.com'}
        }

        log = AuditLog(
            user_id=1,
            action=AuditActionType.USER_UPDATE,
            resource_type="user",
            resource_id=10,
            ip_address="192.168.1.1",
            changes=changes,
            status="success"
        )

        db.session.add(log)
        db.session.commit()

        retrieved = AuditLog.query.filter_by(id=log.id).first()
        assert retrieved.changes == changes
        assert retrieved.changes['before']['email'] == 'old@test.com'
        assert retrieved.changes['after']['email'] == 'new@test.com'

    def test_security_event_creation(self):
        """Test creating a security event."""
        event = SecurityEvent(
            user_id=1,
            event_type="suspicious_login",
            severity="high",
            description="Login from unusual location",
            ip_address="123.45.67.89"
        )

        db.session.add(event)
        db.session.commit()

        retrieved = SecurityEvent.query.filter_by(id=event.id).first()
        assert retrieved is not None
        assert retrieved.event_type == "suspicious_login"
        assert retrieved.severity == "high"

    def test_security_event_to_dict(self):
        """Test security event serialization."""
        event = SecurityEvent(
            user_id=1,
            event_type="brute_force",
            severity="critical",
            description="Multiple failed login attempts",
            ip_address="192.168.1.100"
        )

        db.session.add(event)
        db.session.commit()

        event_dict = event.to_dict()

        assert event_dict['event_type'] == "brute_force"
        assert event_dict['severity'] == "critical"
        assert 'created_at' in event_dict
        assert event_dict['resolved_at'] is None

    def test_audit_log_indexing(self):
        """Test that indexes are created."""
        # This just ensures the models have the indexes defined
        assert hasattr(AuditLog, '__table_args__')

        # Create multiple logs and test queries
        for i in range(10):
            log = AuditLog(
                user_id=i % 3,
                action=AuditActionType.LOGIN_SUCCESS,
                ip_address=f"192.168.1.{i}",
                status="success"
            )
            db.session.add(log)

        db.session.commit()

        # Query by user_id (should use index)
        logs = AuditLog.query.filter_by(user_id=1).all()
        assert len(logs) > 0

        # Query by action (should use index)
        logs = AuditLog.query.filter_by(action=AuditActionType.LOGIN_SUCCESS).all()
        assert len(logs) > 0


class TestAuditActions:
    """Test different audit action types."""

    def test_all_action_types_valid(self):
        """Test that all action types are valid enums."""
        actions = [
            AuditActionType.LOGIN_SUCCESS,
            AuditActionType.LOGIN_FAILED,
            AuditActionType.LOGOUT,
            AuditActionType.USER_CREATE,
            AuditActionType.USER_UPDATE,
            AuditActionType.LISTING_CREATE,
            AuditActionType.LISTING_UPDATE,
            AuditActionType.TRANSACTION_CREATE,
            AuditActionType.ADMIN_LOGIN,
            AuditActionType.EXPORT_DATA,
        ]

        for action in actions:
            assert isinstance(action.value, str)
            assert len(action.value) > 0
