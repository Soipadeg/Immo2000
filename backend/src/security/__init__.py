"""
Module de sécurité pour l'API Admin
"""

from .audit import AdminAuditLog, audit_logger, log_admin_action, get_audit_logs
from .encryption import encryptor, encrypt_reason, decrypt_reason, encrypt_conditions, decrypt_conditions
from .rate_limit import RateLimitLog, rate_limiter, apply_rate_limit
from .validation import (
    sanitize_input,
    validate_email,
    validate_phone,
    validate_url,
    ValidationError,
    validate_request_data
)

__all__ = [
    # Audit
    'AdminAuditLog',
    'audit_logger',
    'log_admin_action',
    'get_audit_logs',

    # Encryption
    'encryptor',
    'encrypt_reason',
    'decrypt_reason',
    'encrypt_conditions',
    'decrypt_conditions',

    # Rate Limiting
    'RateLimitLog',
    'rate_limiter',
    'apply_rate_limit',

    # Validation
    'sanitize_input',
    'validate_email',
    'validate_phone',
    'validate_url',
    'ValidationError',
    'validate_request_data'
]
