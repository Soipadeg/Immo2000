"""
Sentry Integration - Error tracking and monitoring

Captures errors, exceptions, and performance issues for production monitoring.
"""

import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.tracing import SAMPLE_RATE
import logging

# Configure Sentry logging
sentry_logging = LoggingIntegration(
    level=logging.INFO,          # Capture info and above as breadcrumbs
    event_level=logging.ERROR    # Send errors as events
)


def init_sentry(app, dsn: str = None, environment: str = 'production', debug: bool = False):
    """
    Initialize Sentry error tracking

    Args:
        app: Flask application instance
        dsn: Sentry DSN (from https://sentry.io)
        environment: Environment name (production, staging, development)
        debug: Debug mode (don't send errors to Sentry if True)
    """

    if not dsn or debug:
        print(f"Sentry disabled (dsn={bool(dsn)}, debug={debug})")
        return None

    sentry_sdk.init(
        dsn=dsn,
        integrations=[
            FlaskIntegration(),
            SqlalchemyIntegration(),
            RedisIntegration(),
            sentry_logging,
        ],
        # Set traces sample rate for performance monitoring
        traces_sample_rate=0.1,  # 10% of transactions

        # Environment
        environment=environment,

        # Release tracking
        release=app.config.get('APP_VERSION', '1.0.0'),

        # Ignore specific exceptions
        ignore_errors=[
            KeyboardInterrupt,
            SystemExit,
        ],

        # Before send hook to filter sensitive data
        before_send=before_send_sentry,

        # Attach stack traces
        attach_stacktrace=True,

        # Capture local variables in stack traces
        with_locals=True,

        # Maximum request body size
        max_request_body_size='medium',
    )

    # Set user context from request
    @app.before_request
    def set_sentry_user_context():
        from flask import g, request

        # Extract user info if available
        if hasattr(g, 'user'):
            sentry_sdk.set_user({
                'id': getattr(g.user, 'id', None),
                'email': getattr(g.user, 'email', None),
                'username': getattr(g.user, 'username', None),
            })

        # Add request context
        sentry_sdk.set_context('request_info', {
            'method': request.method,
            'path': request.path,
            'remote_addr': request.remote_addr,
        })

    return sentry_sdk


def before_send_sentry(event, hint):
    """
    Filter sensitive data before sending to Sentry

    Args:
        event: Sentry event
        hint: Exception hint

    Returns:
        Event (modified or None to drop)
    """
    # List of sensitive fields to scrub
    sensitive_fields = [
        'password',
        'token',
        'api_key',
        'secret',
        'authorization',
        'credit_card',
        'ssn',
    ]

    # Scrub request data
    if 'request' in event:
        request_data = event['request']

        # Scrub query string
        if 'query_string' in request_data:
            request_data['query_string'] = scrub_sensitive_data(
                request_data['query_string'],
                sensitive_fields
            )

        # Scrub cookies
        if 'cookies' in request_data:
            request_data['cookies'] = scrub_sensitive_data(
                request_data['cookies'],
                sensitive_fields
            )

        # Scrub headers
        if 'headers' in request_data:
            request_data['headers'] = scrub_sensitive_data(
                request_data['headers'],
                sensitive_fields
            )

    # Scrub breadcrumbs
    if 'breadcrumbs' in event:
        for breadcrumb in event['breadcrumbs']:
            if 'data' in breadcrumb:
                breadcrumb['data'] = scrub_sensitive_data(
                    breadcrumb['data'],
                    sensitive_fields
                )

    return event


def scrub_sensitive_data(data, sensitive_fields):
    """
    Recursively scrub sensitive fields from data

    Args:
        data: Data to scrub
        sensitive_fields: List of field names to scrub

    Returns:
        Scrubbed data
    """
    if isinstance(data, dict):
        scrubbed = {}
        for key, value in data.items():
            if any(field.lower() in key.lower() for field in sensitive_fields):
                scrubbed[key] = '[REDACTED]'
            else:
                scrubbed[key] = scrub_sensitive_data(value, sensitive_fields)
        return scrubbed
    elif isinstance(data, (list, tuple)):
        return [scrub_sensitive_data(item, sensitive_fields) for item in data]
    else:
        return data


def capture_exception(exception, level='error', extra=None, tags=None):
    """
    Manually capture an exception in Sentry

    Args:
        exception: Exception object
        level: Error level (fatal, error, warning, info, debug)
        extra: Extra context data
        tags: Tags for filtering
    """
    with sentry_sdk.push_scope() as scope:
        if extra:
            for key, value in extra.items():
                scope.set_extra(key, value)

        if tags:
            for key, value in tags.items():
                scope.set_tag(key, value)

        sentry_sdk.capture_exception(exception, level=level)


def capture_message(message, level='info', extra=None, tags=None):
    """
    Manually capture a message in Sentry

    Args:
        message: Message string
        level: Log level
        extra: Extra context data
        tags: Tags for filtering
    """
    with sentry_sdk.push_scope() as scope:
        if extra:
            for key, value in extra.items():
                scope.set_extra(key, value)

        if tags:
            for key, value in tags.items():
                scope.set_tag(key, value)

        sentry_sdk.capture_message(message, level=level)


def set_sentry_context(context_name: str, context_data: dict):
    """
    Set custom context for Sentry

    Args:
        context_name: Name of context
        context_data: Context data dictionary
    """
    sentry_sdk.set_context(context_name, context_data)


def set_sentry_tags(tags: dict):
    """
    Set tags for Sentry event

    Args:
        tags: Dictionary of tags
    """
    for key, value in tags.items():
        sentry_sdk.set_tag(key, value)


def set_sentry_user(user_id: str, email: str = None, username: str = None):
    """
    Set user context for Sentry

    Args:
        user_id: User ID
        email: User email
        username: Username
    """
    sentry_sdk.set_user({
        'id': user_id,
        'email': email,
        'username': username,
    })


class SentryMiddleware:
    """WSGI middleware for Sentry integration"""

    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        try:
            return self.app(environ, start_response)
        except Exception as e:
            capture_exception(
                e,
                level='error',
                extra={
                    'method': environ.get('REQUEST_METHOD'),
                    'path': environ.get('PATH_INFO'),
                    'remote_addr': environ.get('REMOTE_ADDR'),
                }
            )
            raise
