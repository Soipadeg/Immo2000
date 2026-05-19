# backend/src/config/sentry_config.py

import os
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

def init_sentry(app=None):
    """Initialize Sentry error tracking"""

    sentry_dsn = os.getenv('SENTRY_DSN')
    if not sentry_dsn:
        return None

    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[
            FlaskIntegration(),
            SqlalchemyIntegration(),
            RedisIntegration(),
            LoggingIntegration(
                level=logging.INFO,
                event_level=logging.ERROR
            ),
        ],
        traces_sample_rate=float(os.getenv('SENTRY_TRACES_RATE', 0.1)),
        profiles_sample_rate=float(os.getenv('SENTRY_PROFILES_RATE', 0.1)),
        release=os.getenv('APP_VERSION', 'unknown'),
        environment=os.getenv('ENVIRONMENT', 'development'),
        send_default_pii=False,
        debug=os.getenv('DEBUG', False),
        attach_stacktrace=True,
        max_breadcrumbs=50,
        include_local_variables=True,
    )

    # Set release info
    if app:
        @app.before_request
        def set_sentry_context():
            sentry_sdk.set_context("user", {
                "id": getattr(g, 'user_id', None),
                "email": getattr(g, 'user_email', None),
            })

    return sentry_sdk


def capture_exception(exception, context=None):
    """Capture an exception with context"""
    if context:
        sentry_sdk.set_context("exception_context", context)
    sentry_sdk.capture_exception(exception)


def capture_message(message, level='info', context=None):
    """Capture a message"""
    if context:
        sentry_sdk.set_context("message_context", context)
    sentry_sdk.capture_message(message, level=level)


def set_user_context(user_id, email=None, username=None):
    """Set user context for Sentry"""
    sentry_sdk.set_user({
        "id": user_id,
        "email": email,
        "username": username,
    })


def add_breadcrumb(message, category='info', level='info', data=None):
    """Add a breadcrumb to Sentry"""
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data or {},
    )
