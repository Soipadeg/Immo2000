"""
Audit logging models for security compliance and monitoring.
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import JSON, Index
from backend.src.database import db


class AuditActionType(str, Enum):
    """Types of audit actions."""
    # Authentication
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"

    # User Management
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    PROFILE_UPDATE = "profile_update"

    # Listings
    LISTING_CREATE = "listing_create"
    LISTING_UPDATE = "listing_update"
    LISTING_DELETE = "listing_delete"
    LISTING_PUBLISHED = "listing_published"
    LISTING_UNPUBLISHED = "listing_unpublished"

    # Transactions
    TRANSACTION_CREATE = "transaction_create"
    TRANSACTION_UPDATE = "transaction_update"
    OFFER_CREATE = "offer_create"
    OFFER_ACCEPT = "offer_accept"
    OFFER_REJECT = "offer_reject"

    # Admin Actions
    ADMIN_CREATE = "admin_create"
    ADMIN_UPDATE = "admin_update"
    ADMIN_DELETE = "admin_delete"
    ADMIN_LOGIN = "admin_login"

    # Data
    EXPORT_DATA = "export_data"
    DELETE_ACCOUNT = "delete_account"

    # Security
    2FA_ENABLED = "2fa_enabled"
    2FA_DISABLED = "2fa_disabled"
    PERMISSION_DENIED = "permission_denied"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"


class AuditLog(db.Model):
    """Immutable audit log for compliance and security."""

    __tablename__ = 'audit_logs'
    __table_args__ = (
        Index('idx_audit_user_id', 'user_id'),
        Index('idx_audit_action', 'action'),
        Index('idx_audit_created_at', 'created_at'),
        Index('idx_audit_user_action', 'user_id', 'action'),
    )

    id = db.Column(db.Integer, primary_key=True)

    # Who did it
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # What they did
    action = db.Column(db.String(50), nullable=False, index=True)
    resource_type = db.Column(db.String(50), nullable=True)  # user, listing, transaction, etc
    resource_id = db.Column(db.Integer, nullable=True)

    # Details
    description = db.Column(db.Text, nullable=True)
    changes = db.Column(JSON, nullable=True)  # Before/After values

    # Where/When
    ip_address = db.Column(db.String(45), nullable=False)  # IPv6 support
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Status
    status = db.Column(db.String(20), default='success')  # success, failure, warning
    error_message = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<AuditLog {self.id}: {self.action} by user {self.user_id} at {self.created_at}>"

    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'description': self.description,
            'changes': self.changes,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat(),
            'status': self.status,
            'error_message': self.error_message,
        }


class SecurityEvent(db.Model):
    """Track security events and alerts."""

    __tablename__ = 'security_events'
    __table_args__ = (
        Index('idx_security_user_id', 'user_id'),
        Index('idx_security_event_type', 'event_type'),
        Index('idx_security_created_at', 'created_at'),
    )

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    event_type = db.Column(db.String(50), nullable=False)  # suspicious_login, brute_force, etc
    severity = db.Column(db.String(20), nullable=False)  # low, medium, high, critical
    description = db.Column(db.Text, nullable=False)

    ip_address = db.Column(db.String(45), nullable=False)
    user_agent = db.Column(db.Text, nullable=True)
    metadata = db.Column(JSON, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolved_by_admin = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    def __repr__(self):
        return f"<SecurityEvent {self.id}: {self.event_type} [{self.severity}]>"

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_type': self.event_type,
            'severity': self.severity,
            'description': self.description,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat(),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolved_by_admin': self.resolved_by_admin,
        }
