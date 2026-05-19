#!/usr/bin/env python3
"""
Script de démarrage de l'application Flask Immo2000
Diagnostique et démarrage avec gestion d'erreurs
"""

import os
import sys
import logging
from pathlib import Path

# Ajouter le répertoire backend au path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Démarrer l'application Flask"""

    logger.info("🚀 Démarrage de Immo2000 Backend")
    logger.info(f"📁 Working directory: {os.getcwd()}")
    logger.info(f"🐍 Python version: {sys.version}")

    # Vérifier .env
    env_file = backend_path / ".env"
    if env_file.exists():
        logger.info(f"✅ Fichier .env trouvé")
    else:
        logger.warning(f"⚠️ Fichier .env manquant - créer un .env pour la configuration")

    # Import des dépendances
    try:
        logger.info("📦 Import des dépendances...")
        import flask
        logger.info(f"   ✅ Flask {flask.__version__}")

        import sqlalchemy
        logger.info(f"   ✅ SQLAlchemy {sqlalchemy.__version__}")

        import jwt
        logger.info(f"   ✅ PyJWT {jwt.__version__}")

        logger.info("✅ Toutes les dépendances importées avec succès")
    except ImportError as e:
        logger.error(f"❌ Erreur import dépendance: {e}")
        sys.exit(1)

    # Import de l'app Flask
    try:
        logger.info("📚 Import de l'application Flask...")
        from dotenv import load_dotenv
        load_dotenv()

        from src.app import create_app
        logger.info("✅ App Flask importée")

        app = create_app("development")
        logger.info("✅ App Flask créée")

    except Exception as e:
        logger.error(f"❌ Erreur lors de la création de l'app: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Configuration SMTP
    try:
        logger.info("📧 Vérification configuration SMTP...")
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = os.getenv("SMTP_PORT")
        email_user = os.getenv("EMAIL_USER")

        if smtp_host and smtp_port and email_user:
            logger.info(f"   ✅ SMTP configuré: {smtp_host}:{smtp_port}")
            logger.info(f"   ✅ Email: {email_user}")
        else:
            logger.warning(f"   ⚠️ Configuration SMTP incomplète - les emails ne seront pas envoyés")
            if not smtp_host:
                logger.warning(f"      Manquant: SMTP_HOST")
            if not smtp_port:
                logger.warning(f"      Manquant: SMTP_PORT")
            if not email_user:
                logger.warning(f"      Manquant: EMAIL_USER")
    except Exception as e:
        logger.warning(f"⚠️ Erreur vérification SMTP: {e}")

    # Démarrer le serveur
    try:
        port = int(os.getenv("PORT", 8000))
        logger.info("🎯 Démarrage du serveur Flask...")
        logger.info(f"   🌐 http://0.0.0.0:{port}")
        logger.info("   📊 /health - Health check")
        logger.info("   📚 /api/v1/... - API endpoints")
        logger.info("")
        logger.info("💡 Appuyez sur Ctrl+C pour arrêter le serveur")
        logger.info("")

        app.run(
            host="0.0.0.0",
            port=port,
            debug=True,
            use_reloader=True
        )

    except KeyboardInterrupt:
        logger.info("\n✋ Arrêt du serveur...")
        sys.exit(0)
    except Exception as e:
        logger.error(f"❌ Erreur démarrage serveur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
