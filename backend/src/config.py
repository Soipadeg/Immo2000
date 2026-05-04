"""
Configuration centralisée pour le backend Immo2000.
"""

import os
from typing import Dict, Any


class Config:
    """Configuration de base."""

    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
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
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES_IN = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_IN", 86400))  # 24h
    JWT_REFRESH_TOKEN_EXPIRES_IN = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_IN", 604800))  # 7 jours

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


class DevelopmentConfig(Config):
    """Configuration de développement."""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class TestingConfig(Config):
    """Configuration de test."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-secret-key-very-secure-do-not-use-in-prod"


class ProductionConfig(Config):
    """Configuration de production."""
    DEBUG = False
    SQLALCHEMY_ECHO = False


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
