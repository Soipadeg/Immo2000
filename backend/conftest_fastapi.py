"""
Configuration pytest pour FastAPI - Fixtures et setup
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from pathlib import Path
import sys

# Ajouter le backend au path
sys.path.insert(0, str(Path(__file__).parent))

from src.main import create_app


@pytest.fixture(scope='session')
def app():
    """Créer l'application FastAPI pour les tests"""
    app = create_app()
    return app


@pytest.fixture(scope='session')
def client(app):
    """Créer un client de test"""
    return TestClient(app)


@pytest.fixture
def async_client(app):
    """Créer un client asynchrone"""
    from httpx import AsyncClient
    return AsyncClient(app=app, base_url="http://test")
