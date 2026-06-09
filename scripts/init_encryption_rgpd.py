#!/usr/bin/env python
"""
Script d'initialisation pour le chiffrement et RGPD.

Exécute:
1. Génération d'une clé de chiffrement
2. Installation des dépendances cryptographiques
3. Vérification de la conformité RGPD
4. Configuration des politiques de rétention
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import secrets
from datetime import datetime

# Load env
load_dotenv()

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))


def generate_encryption_key():
    """Générer une clé de chiffrement sécurisée."""
    print("\n🔐 Génération de clé de chiffrement...")

    # Générer une clé sécurisée
    master_key = secrets.token_urlsafe(64)

    print(f"  Clé générée (64 caractères URL-safe)")
    print(f"  À ajouter à .env:")
    print(f"  ENCRYPTION_KEY={master_key}")

    return master_key


def install_crypto_dependencies():
    """Installer les dépendances cryptographiques."""
    print("\n📦 Installation des dépendances cryptographiques...")

    try:
        import subprocess

        packages = [
            'cryptography',
            'python-dotenv'
        ]

        for package in packages:
            print(f"  Vérification de {package}...", end=" ")
            try:
                __import__(package.replace('-', '_'))
                print("✅ Installé")
            except ImportError:
                print("Installation...", end=" ")
                subprocess.check_call([
                    sys.executable, "-m", "pip", "install", package, "-q"
                ])
                print("✅")

    except Exception as e:
        print(f"  ⚠️  Erreur: {str(e)}")


def verify_encryption_setup():
    """Vérifier que le chiffrement est prêt."""
    print("\n✅ Vérification du chiffrement...")

    try:
        from src.services.document_encryption import DocumentEncryptionService

        encryption_key = os.getenv('ENCRYPTION_KEY')
        if not encryption_key:
            print("  ⚠️  ENCRYPTION_KEY non définie")
            return False

        # Tester l'initialisation
        DocumentEncryptionService.initialize(encryption_key)
        print("  ✅ Clé maître acceptée")

        # Tester le chiffrement
        test_content = b"Test document"
        encrypted, enc_id = DocumentEncryptionService.encrypt_document(
            test_content,
            {'filename': 'test.txt'}
        )

        decrypted = DocumentEncryptionService.decrypt_document(encrypted)
        assert decrypted == test_content
        print("  ✅ Chiffrement/déchiffrement fonctionne")

        return True

    except Exception as e:
        print(f"  ❌ Erreur: {str(e)}")
        return False


def configure_retention_policy():
    """Configurer la politique de rétention."""
    print("\n📋 Configuration de la rétention des données...")

    retention_days = os.getenv('DATA_RETENTION_DAYS', '365')

    print(f"  Jours de rétention: {retention_days} jours")
    print(f"  Documents plus anciens seront supprimés automatiquement")

    # Exemple de configuration
    example_config = f"""
# .env
DATA_RETENTION_DAYS={retention_days}

# Cron job (exemple avec APScheduler)
@scheduler.scheduled_job('cron', hour=2)
def cleanup_old_documents():
    from src.services.document_encryption import DocumentEncryptionService
    DocumentEncryptionService.apply_retention_policy(days_to_keep={retention_days})
"""

    print(example_config)


def verify_rgpd_compliance():
    """Vérifier la conformité RGPD."""
    print("\n📊 Vérification de la conformité RGPD...")

    try:
        from src.services.document_encryption import RGPDComplianceService

        # Générer un rapport
        report = RGPDComplianceService.generate_privacy_report()

        print(f"  📅 Date du rapport: {report['report_date']}")
        print(f"  👥 Nombre d'utilisateurs: {report['total_users']}")
        print(f"  📄 Nombre de documents: {report['total_documents']}")
        print(f"  🔐 Documents chiffrés: {report['encrypted_documents']}")
        print(f"  📈 Couverture: {report['encryption_coverage']}")
        print(f"  ✅ Statut: {report['compliance_status']}")

    except Exception as e:
        print(f"  ⚠️  Impossible de générer le rapport: {str(e)}")


def create_rgpd_audit_table():
    """Créer la table d'audit RGPD si nécessaire."""
    print("\n🗂️  Vérification des tables RGPD...")

    try:
        from src.auth.models import db
        from sqlalchemy import inspect

        # Vérifier si les tables existent
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()

        required_tables = [
            'notifications',
            'historique_notaire'
        ]

        missing = [t for t in required_tables if t not in tables]

        if missing:
            print(f"  ⚠️  Tables manquantes: {', '.join(missing)}")
            print("  Exécutez: python run_migrations_and_tests.py")
        else:
            print(f"  ✅ Toutes les tables RGPD existent")

    except Exception as e:
        print(f"  ⚠️  Erreur: {str(e)}")


def create_setup_guide():
    """Créer un guide de configuration."""
    print("\n📖 Création du guide de configuration...")

    guide = """
# Guide de Configuration RGPD et Chiffrement

## 1. Variables d'environnement requises

Ajouter à votre fichier `.env`:

```bash
# Clé maître pour le chiffrement (64+ caractères)
ENCRYPTION_KEY=<votre-clé-générée>

# Rétention des données (jours)
DATA_RETENTION_DAYS=365

# Email pour alertes RGPD
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=admin@immo2000.fr
MAIL_PASSWORD=<your-app-password>
```

## 2. Initialiser le chiffrement au démarrage

Dans `backend/src/app.py`:

```python
from src.services.document_encryption import DocumentEncryptionService

def create_app(config_name='development'):
    app = Flask(__name__)

    # ... autres initialisations ...

    # Initialiser le chiffrement
    with app.app_context():
        DocumentEncryptionService.initialize()

    return app
```

## 3. Configurer les tâches de rétention

Ajouter à votre scheduler (APScheduler):

```python
from apscheduler.schedulers.background import BackgroundScheduler
from src.services.document_encryption import DocumentEncryptionService

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('cron', hour=2, minute=0)
def cleanup_old_documents():
    from src.services.document_encryption import DocumentEncryptionService
    DocumentEncryptionService.apply_retention_policy()

scheduler.start()
```

## 4. Tests

Vérifier que tout fonctionne:

```bash
# Test de chiffrement
python -c "
from src.services.document_encryption import DocumentEncryptionService
DocumentEncryptionService.initialize()
print('✅ Chiffrement OK')
"

# Test RGPD
python -c "
from src.services.document_encryption import RGPDComplianceService
report = RGPDComplianceService.generate_privacy_report()
print(f\"✅ RGPD: {report['compliance_status']}\")
"
```

## 5. Endpoints disponibles

- `GET /api/v1/notaires/documents/<id>/content` - Récupérer document (déchiffré)
- `GET /api/v1/notaires/documents/<id>/access-log` - Journal d'accès RGPD
- `POST /api/v1/notaires/documents/<id>/delete-permanently` - Supprimer document
- `GET /api/v1/notaires/rgpd/user-data/export` - Exporter mes données
- `POST /api/v1/notaires/rgpd/user-data/delete` - Droit à l'oubli
- `GET /api/v1/notaires/rgpd/privacy-report` - Rapport RGPD (admin)

## Documentation

Voir: [docs/NOTAIRE/README.md](../docs/NOTAIRE/README.md)
"""

    print(guide)


def main():
    """Main entry point."""
    print("=" * 70)
    print("🔐 INITIALISATION - Chiffrement et RGPD")
    print("=" * 70)

    # 1. Générer clé
    master_key = generate_encryption_key()

    # 2. Installer dépendances
    install_crypto_dependencies()

    # 3. Vérifier le chiffrement
    os.environ['ENCRYPTION_KEY'] = master_key
    encryption_ok = verify_encryption_setup()

    if not encryption_ok:
        print("\n⚠️  Chiffrement non fonctionnel. Vérifiez ENCRYPTION_KEY")
        sys.exit(1)

    # 4. Configurer la rétention
    configure_retention_policy()

    # 5. Vérifier RGPD
    verify_rgpd_compliance()

    # 6. Vérifier les tables
    create_rgpd_audit_table()

    # 7. Créer le guide
    create_setup_guide()

    print("\n" + "=" * 70)
    print("✅ CONFIGURATION TERMINÉE")
    print("=" * 70)
    print("\n📝 Prochaines étapes:")
    print("  1. Copier la clé générée dans votre .env")
    print("  2. Redémarrer l'application")
    print("  3. Consulter docs/NOTAIRE/README.md pour plus de détails")
    print("  4. Configurer les tâches de rétention")
    print("  5. Configurer les alertes RGPD")


if __name__ == "__main__":
    main()
