"""
Configuration Sentry pour le tracking des erreurs en production

Setup Sentry:
1. Créer un compte sur https://sentry.io
2. Créer un projet Python/Flask
3. Copier la clé DSN dans .env: SENTRY_DSN
4. L'initialisation se fait automatiquement dans app.py
"""

import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
import os
import logging


def init_sentry(app):
    """
    Initialiser Sentry pour le tracking des erreurs

    Args:
        app: Application Flask

    Returns:
        bool: True si Sentry est configuré, False sinon
    """
    sentry_dsn = os.getenv("SENTRY_DSN")

    if not sentry_dsn or sentry_dsn.startswith("https://xxxxx"):
        print("⚠️  Sentry DSN not configured. Error tracking disabled.")
        return False

    environment = os.getenv("SENTRY_ENVIRONMENT", "production")
    traces_sample_rate = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))

    try:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                FlaskIntegration(),
                SqlalchemyIntegration(),
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=logging.ERROR
                ),
            ],
            environment=environment,
            traces_sample_rate=traces_sample_rate,
            profiles_sample_rate=0.1,  # Sample 10% of transactions for profiling
            _experiments={
                "profiles_sample_rate": 0.1,
            },
            max_breadcrumbs=50,
            send_default_pii=False,  # RGPD compliant: don't send PII by default
            attach_stacktrace=True,
            with_locals=True,
        )

        logging.info(f"✅ Sentry initialized (environment={environment}, sample_rate={traces_sample_rate})")
        return True

    except Exception as e:
        logging.error(f"❌ Failed to initialize Sentry: {e}")
        return False


def configure_sentry_scope(user_id: str = None, extra_data: dict = None):
    """
    Configurer le scope Sentry avec des infos utilisateur

    Args:
        user_id: ID utilisateur pour le tracking
        extra_data: Données supplémentaires à ajouter au scope
    """
    if user_id:
        sentry_sdk.set_user({
            "id": user_id,
            "ip_address": "{{auto}}"
        })

    if extra_data:
        for key, value in extra_data.items():
            sentry_sdk.set_context(key, value)


def log_error_to_sentry(exception: Exception, level: str = "error", **context):
    """
    Envoyer une erreur à Sentry avec contexte

    Args:
        exception: Exception à logguer
        level: Niveau de sévérité (info, warning, error, critical)
        **context: Contexte supplémentaire
    """
    with sentry_sdk.push_scope() as scope:
        # Ajouter contexte
        for key, value in context.items():
            scope.set_context("error_context", {key: str(value)})

        scope.level = level
        sentry_sdk.capture_exception(exception)


# Decorator pour wrapper des fonctions critiques
def monitor_with_sentry(func):
    """
    Decorator pour monitorer une fonction avec Sentry

    Exemple:
        @monitor_with_sentry
        def critical_function():
            pass
    """
    import functools

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            log_error_to_sentry(
                e,
                level="error",
                function=func.__name__,
                args=str(args)[:100],
                kwargs=str(kwargs)[:100]
            )
            raise

    return wrapper
