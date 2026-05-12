"""
Configuration pytest conftest.py pour les tests.

Point d'entrée pour la configuration des fixtures et des plugins pytest.
"""

import sys
import os

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from src.app import create_app
from src.auth.models import db
from sqlalchemy import text


@pytest.fixture(scope="session")
def app_session():
    """Créer l'app Flask pour la session de test."""
    app = create_app("testing")
    return app


@pytest.fixture(scope="function")
def app():
    """Créer l'app Flask et initialiser la BD pour chaque test."""
    app = create_app("testing")
    with app.app_context():
        # Drop tous les objets de la BD précédents
        try:
            db.drop_all()
        except Exception:
            pass  # Ignorer les erreurs lors du drop

        # Créer les tables - ignorer les erreurs d'index existant
        try:
            db.create_all()
        except Exception as e:
            # Ignorer les erreurs comme "index already exists"
            if "already exists" not in str(e):
                raise

        yield app
        db.session.remove()
        try:
            db.drop_all()
        except Exception:
            pass


@pytest.fixture
def client(app):
    """Créer un client test Flask."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Créer un CLI runner."""
    return app.test_cli_runner()
