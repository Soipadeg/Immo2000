"""
Configuration pytest - Fixtures et setup pour les tests
"""

import pytest
import os
from pathlib import Path

# Ajouter le backend au path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from src.app import create_app
from src.models import db as _db


@pytest.fixture(scope='session')
def app():
    """Créer l'application Flask pour les tests"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'test-secret-key-dev')

    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def db(app):
    """Fournir la session de base de données pour les tests"""
    with app.app_context():
        yield _db
        _db.session.rollback()


@pytest.fixture
def client(app):
    """Client de test Flask"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """CLI runner pour les commandes"""
    return app.test_cli_runner()


# Markers personnalisés
def pytest_configure(config):
    config.addinivalue_line("markers", "unit: mark test as unit test")
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "slow: mark test as slow")
