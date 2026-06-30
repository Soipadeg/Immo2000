"""
Configuration centralisée pour le backend Immo2000.
"""

import os
import secrets as _secrets
from typing import Dict, Any


def _get_or_generate_secret(env_var: str) -> str:
    """Récupérer un secret depuis l'environnement ou le générer en dev."""
    value = os.getenv(env_var)
    if not value:
        if os.getenv("FLASK_ENV", "development") == "production":
            raise ValueError(
                f"❌ SECURITY ERROR: {env_var} MUST be set in production!\n"
                f"Generate with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )
        # Dev mode: generate temporary secret
        return f"dev-{_secrets.token_urlsafe(32)}"
    return value


class Config:
    """Configuration de base."""

    # Flask
    SECRET_KEY = _get_or_generate_secret("SECRET_KEY")
    DEBUG = False
    TESTING = False

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///immo2000.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv("DATABASE_ECHO", "false").lower() == "true"

    # API
    API_TITLE = "Immo2000 API"
    API_VERSION = "0.1.0"

    # Melo API
    MELO_API_KEY = os.getenv("MELO_API_KEY")
    MELO_API_BASE_URL = os.getenv("MELO_API_BASE_URL", "https://api.melo.io/v1/estimations")
    MELO_API_TIMEOUT = int(os.getenv("MELO_API_TIMEOUT", 10))
    MELO_API_MAX_RETRIES = int(os.getenv("MELO_API_MAX_RETRIES", 3))
    MELO_API_CACHE_ENABLED = os.getenv("MELO_API_CACHE_ENABLED", "true").lower() == "true"
    MELO_API_CACHE_TTL = int(os.getenv("MELO_API_CACHE_TTL", 3600))

    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # JWT (Authentication)
    JWT_SECRET_KEY = _get_or_generate_secret("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES_IN = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_IN", 86400))  # 24h
    JWT_REFRESH_TOKEN_EXPIRES_IN = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_IN", 604800))  # 7 jours

    # OAuth (Google & Facebook)
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
    FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")
    APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID")
    APPLE_TEAM_ID = os.getenv("APPLE_TEAM_ID")
    APPLE_KEY_ID = os.getenv("APPLE_KEY_ID")

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # Connection Pooling
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": int(os.getenv("DB_POOL_SIZE", 20)),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", 3600)),
        "pool_pre_ping": True,  # Verify connection before using
        "max_overflow": 40,
    }

    # Security
    SESSION_COOKIE_SECURE = os.getenv("FLASK_ENV", "development") == "production"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Strict"
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours


class DevelopmentConfig(Config):
    """Configuration de développement."""
    DEBUG = True
    SQLALCHEMY_ECHO = True
    LOG_LEVEL = "DEBUG"
    SESSION_COOKIE_SECURE = False


class TestingConfig(Config):
    """Configuration de test."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = _get_or_generate_secret('JWT_SECRET_KEY')
    LOG_LEVEL = "INFO"


class ProductionConfig(Config):
    """Configuration de production - STRICT SECURITY."""
    DEBUG = False
    SQLALCHEMY_ECHO = False
    LOG_LEVEL = "INFO"

    # Enforce production security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Strict"
    PERMANENT_SESSION_LIFETIME = 86400

    # Connection Pool optimized for production
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 30,
        "pool_recycle": 3600,
        "pool_pre_ping": True,
        "max_overflow": 60,
        "echo_pool": False,
    }


def get_config(env: str = None) -> Config:
    """Retourne la configuration appropriée.

    Args:
        env: Environnement (development, testing, production)

    Returns:
        Configuration instance
    """
    if env is None:
        env = os.getenv("FLASK_ENV", "development")

    configs: Dict[str, Any] = {
        "development": DevelopmentConfig,
        "testing": TestingConfig,
        "production": ProductionConfig,
    }

    return configs.get(env, DevelopmentConfig)()
