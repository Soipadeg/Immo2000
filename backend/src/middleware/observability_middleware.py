# backend/src/middleware/observability_middleware.py

import time
import uuid
import logging
from flask import request, g
from functools import wraps
from typing import Callable
from src.config.sentry_config import set_user_context, add_breadcrumb
from src.services.monitoring_service import get_monitoring_service
from src.config.tracing_config import (
    get_current_span,
    set_span_attribute,
    add_span_event,
)

logger = logging.getLogger(__name__)

class ObservabilityMiddleware:
    """Middleware for observability (logging, tracing, monitoring)"""

    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)

    def init_app(self, app):
        """Initialize middleware with Flask app"""

        @app.before_request
        def before_request():
            # Generate request ID
            g.request_id = str(uuid.uuid4())
            g.start_time = time.time()

            # Set user context if authenticated
            try:
                from flask_jwt_extended import get_jwt_identity
                user_id = get_jwt_identity()
                if user_id:
                    g.user_id = user_id
                    set_user_context(user_id)
            except Exception:
                pass

            # Add request info to span
            span = get_current_span()
            span.set_attribute('http.method', request.method)
            span.set_attribute('http.url', request.url)
            span.set_attribute('http.target', request.path)
            span.set_attribute('request_id', g.request_id)

            # Log request
            logger.info(
                'Request started',
                extra={
                    'request_id': g.request_id,
                    'method': request.method,
                    'path': request.path,
                    'user_id': getattr(g, 'user_id', None),
                }
            )

        @app.after_request
        def after_request(response):
            # Calculate request duration
            duration = time.time() - getattr(g, 'start_time', 0)

            # Record metrics
            monitoring = get_monitoring_service()
            monitoring.record_request_time(
                endpoint=request.path,
                method=request.method,
                duration=duration
            )

            # Update span
            span = get_current_span()
            span.set_attribute('http.status_code', response.status_code)
            span.set_attribute('http.duration_ms', int(duration * 1000))

            # Log response
            logger.info(
                'Request completed',
                extra={
                    'request_id': g.request_id,
                    'method': request.method,
                    'path': request.path,
                    'status': response.status_code,
                    'duration_ms': int(duration * 1000),
                }
            )

            # Alert if slow
            if duration > 1.0:  # >1 second
                logger.warning(
                    'Slow request detected',
                    extra={
                        'request_id': g.request_id,
                        'endpoint': request.path,
                        'duration_ms': int(duration * 1000),
                    }
                )

            return response

        @app.errorhandler(Exception)
        def handle_error(error):
            # Record error
            monitoring = get_monitoring_service()
            monitoring.record_error(
                error_type=type(error).__name__,
                error_message=str(error),
                context={
                    'request_id': getattr(g, 'request_id', None),
                    'path': request.path,
                    'method': request.method,
                }
            )

            # Update span
            span = get_current_span()
            span.record_exception(error)

            logger.exception(
                'Request failed',
                extra={
                    'request_id': getattr(g, 'request_id', None),
                    'path': request.path,
                }
            )

            raise


def track_performance(func: Callable) -> Callable:
    """Decorator to track function performance"""

    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()

        try:
            result = func(*args, **kwargs)
            return result
        finally:
            duration = time.time() - start_time

            # Record in monitoring
            monitoring = get_monitoring_service()
            monitoring.record_request_time(
                endpoint=func.__name__,
                method='FUNCTION',
                duration=duration
            )

            # Log if slow
            if duration > 0.1:  # >100ms
                logger.warning(
                    f'Slow function execution: {func.__name__}',
                    extra={'duration_ms': int(duration * 1000)}
                )

    return wrapper


def track_db_query(query_type: str):
    """Decorator to track database query performance"""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time

                # Record in monitoring
                monitoring = get_monitoring_service()
                monitoring.record_db_query(
                    query_type=query_type,
                    duration=duration
                )

                # Log if slow
                if duration > 0.1:
                    logger.warning(
                        f'Slow DB query: {query_type}',
                        extra={'duration_ms': int(duration * 1000)}
                    )

        return wrapper

    return decorator


def record_event(event_name: str, attributes: dict = None):
    """Record custom event to span"""
    add_span_event(event_name, attributes or {})
    logger.info(f'Event: {event_name}', extra=attributes or {})
