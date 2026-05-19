"""
Configuration FastAPI pour Immo2000 API.

Valeurs par défaut: développement local.
Utilise les variables d'environnement du fichier .env.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Configuration centralisée pour FastAPI."""

    # === Application ===
    APP_NAME: str = "Immo2000 API"
    APP_VERSION: str = "2.0.0"
    APP_DESCRIPTION: str = "API FastAPI pour Immo2000 (offres, transactions, notaires, paiements)"
    DEBUG: bool = os.getenv("DEBUG", "True") == "True"

    # === Ports ===
    FASTAPI_HOST: str = "0.0.0.0"
    FASTAPI_PORT: int = 8001  # Port séparé pour ne pas conflictuer avec Flask (8000)

    # === Base de données ===
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/immo2000"
    )
    DB_ECHO: bool = False  # Logs SQL

    # === Authentification & Sécurité ===
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # === CORS ===
    ALLOWED_ORIGINS: list = [
        "http://localhost:3001",      # Frontend React (Vite)
        "http://localhost:5000",      # Flask backend (si nécessaire)
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5000",
    ]

    # === URLs ===
    REACT_FRONTEND_URL: str = os.getenv("REACT_FRONTEND_URL", "http://localhost:3001")
    FLASK_BACKEND_URL: str = os.getenv("FLASK_BACKEND_URL", "http://localhost:5000")

    # === DocuSign OAuth ===
    DOCUSIGN_CLIENT_ID: str = os.getenv("DOCUSIGN_CLIENT_ID", "")
    DOCUSIGN_PRIVATE_KEY: str = os.getenv("DOCUSIGN_PRIVATE_KEY", "")
    DOCUSIGN_USER_ID: str = os.getenv("DOCUSIGN_USER_ID", "")
    DOCUSIGN_BASE_URL: str = "https://demo.docusign.net/restapi"
    DOCUSIGN_OAUTH_URL: str = "account-d.docusign.com"

    # === Stripe ===
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLIC_KEY: str = os.getenv("STRIPE_PUBLIC_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    # === SendGrid ===
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    SENDGRID_FROM_EMAIL: str = os.getenv("SENDGRID_FROM_EMAIL", "noreply@immo2000.fr")

    # === AWS S3 ===
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_S3_BUCKET: str = os.getenv("AWS_S3_BUCKET", "immo2000-documents")
    AWS_S3_REGION: str = os.getenv("AWS_S3_REGION", "eu-west-1")

    # === Logs ===
    LOG_LEVEL: str = "INFO" if not DEBUG else "DEBUG"

    class Config:
        extra = "ignore"
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retourner une instance cachée des settings."""
    return Settings()


settings = get_settings()
