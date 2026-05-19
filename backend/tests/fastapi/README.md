"""Tests FastAPI pour Immo2000

Tests complets pour les routes FastAPI, webhooks, intégrations et authentification.

Structure des Tests:
- test_routes_offres.py: Tests des routes d'offres (CRUD)
- test_routes_transactions.py: Tests des routes de transactions
- test_routes_notaires.py: Tests des routes de notaires
- test_routes_paiements.py: Tests des routes de paiements
- test_routes_documents.py: Tests des routes de documents
- test_webhooks.py: Tests des webhooks Stripe et DocuSign
- test_integrations.py: Tests des clients d'intégration (Stripe, DocuSign, SendGrid, AWS)
- test_auth.py: Tests de l'authentification et des permissions

Exécution des Tests:
====================

Exécuter tous les tests:
    pytest tests/fastapi

Exécuter un fichier de test:
    pytest tests/fastapi/test_routes_offres.py

Exécuter une classe de test:
    pytest tests/fastapi/test_routes_offres.py::TestOffresRoutes

Exécuter un test spécifique:
    pytest tests/fastapi/test_routes_offres.py::TestOffresRoutes::test_create_offre_success

Exécuter avec couverture:
    pytest tests/fastapi --cov=app_fastapi --cov-report=html

Exécuter avec markers:
    pytest tests/fastapi -m webhook
    pytest tests/fastapi -m auth
    pytest tests/fastapi -m asyncio

Exécuter les tests lents:
    pytest tests/fastapi -m slow

Fixtures Disponibles:
=====================

Base de données:
- test_db: Base de données de test (SQLite in-memory)
- db_session: Session SQLAlchemy pour les tests
- client: Client TestClient FastAPI

Authentification:
- test_user: Utilisateur acheteur de test
- test_vendor: Vendeur de test
- test_notaire: Notaire de test
- auth_headers: Headers avec Bearer token d'acheteur
- vendor_auth_headers: Headers avec Bearer token de vendeur
- notaire_auth_headers: Headers avec Bearer token de notaire

Mocks:
- mock_stripe: Mock Stripe API
- mock_docusign: Mock DocuSign API
- mock_sendgrid: Mock SendGrid API

Modèles de test:
- sample_annonce: Annonce de test
- sample_offre: Offre de test
- sample_transaction: Transaction de test

Couverture Attendue:
====================

Routes:
- Offres: 100% (create, read, list, respond, update)
- Transactions: 100% (read, list, select-notaire, validate-fees)
- Notaires: 100% (list, read, dashboard)
- Paiements: 100% (create-intent, confirm, read)
- Documents: 100% (upload, read, list, sign)

Webhooks:
- Stripe: payment_intent.succeeded, charge.failed, charge.refunded
- DocuSign: envelope.completed, envelope.declined

Intégrations:
- Stripe: ✓ (mocked)
- DocuSign: ✓ (mocked)
- SendGrid: ✓ (mocked)
- AWS S3: ✓ (mocked)

Authentification:
- Token creation/verification: ✓
- Authorization headers: ✓
- Permission checks: ✓
- Role-based access: ✓

Exemple d'utilisation:
====================

pytest tests/fastapi::
    Exécute tous les tests FastAPI

pytest tests/fastapi::TestOffresRoutes::
    Exécute tous les tests de la classe TestOffresRoutes

pytest tests/fastapi -v --tb=short::
    Exécute avec output détaillé et traceback court

pytest tests/fastapi --cov=app_fastapi --cov-report=term-missing::
    Affiche la couverture manquante
"""
