"""
Configuration Flask pour les tests.

Utilise une base de données SQLite en mémoire pour les tests.
"""

import os
from datetime import timedelta


class TestingConfig:
    """Configuration pour les tests."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-secret-key-very-secure"
    JWT_ACCESS_TOKEN_EXPIRES_IN = 86400  # 24h
    JWT_REFRESH_TOKEN_EXPIRES_IN = 604800  # 7j
    SQLALCHEMY_TRACK_MODIFICATIONS = False
