"""
Routes d'authentification pour Immo2000 (BACKWARD COMPATIBILITY SHIM).

⚠️ DEPRECATED: This module is kept for backward compatibility only.
New code should import directly from the submodules:
- register_bp from .register
- login_bp from .login
- password_bp from .password
- tokens_bp from .tokens

For utilities, import from .utils:
- generate_access_token, generate_refresh_token, verify_token, etc.

This module re-exports all blueprints for backward compatibility with existing code.
"""

# Re-export all blueprints for backward compatibility
from .register import register_bp
from .login import login_bp
from .password import password_bp
from .tokens import tokens_bp

# Re-export commonly imported utilities for backward compatibility
from .utils import (
    generate_access_token,
    generate_refresh_token,
    verify_token,
    verify_password,
    extract_token_from_header,
)

__all__ = [
    "register_bp",
    "login_bp",
    "password_bp",
    "tokens_bp",
    "generate_access_token",
    "generate_refresh_token",
    "verify_token",
    "verify_password",
    "extract_token_from_header",
]
