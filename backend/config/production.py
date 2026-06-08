"""
Production Configuration for Immo2000 Backend
Settings for production environment
"""

import os
from datetime import timedelta

class ProductionConfig:
    """Production configuration"""

    # Environment
    ENVIRONMENT = 'production'
    DEBUG = False
    TESTING = False

    # Application
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-me-in-production')
    APP_NAME = 'Immo2000 API'
    API_VERSION = 'v1'

    # Security
    JWT_SECRET = os.getenv('JWT_SECRET', 'change-me-in-production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION = timedelta(hours=24)
    JWT_REFRESH_EXPIRATION = timedelta(days=7)

    # CORS Configuration
    ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOW_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://user:password@localhost:5432/immo2000_db'
    )
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': int(os.getenv('DB_POOL_SIZE', 20)),
        'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', 3600)),
        'pool_pre_ping': True,
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', 10)),
        'connect_args': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',
        }
    }

    # Redis Cache
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_TYPE = 'redis'
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_KEY_PREFIX = 'immo2000_'

    # Session
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_NAME = 'immo2000_session'

    # Security Headers
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

    # Rate Limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/1')
    RATELIMIT_DEFAULT = '100/hour'  # Default rate limit
    RATELIMIT_LOGIN = '5/minute'  # Strict login rate limiting
    RATELIMIT_API = '100/minute'  # API rate limit

    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'info').upper()
    LOG_TO_FILE = os.getenv('LOG_TO_FILE', 'true').lower() == 'true'
    LOG_DIR = os.getenv('LOG_DIR', '/app/logs')
    LOG_MAX_SIZE = int(os.getenv('LOG_MAX_SIZE', 104857600))  # 100MB
    LOG_BACKUP_COUNT = int(os.getenv('LOG_BACKUP_COUNT', 10))

    # Monitoring
    MONITORING_ENABLED = os.getenv('MONITORING_ENABLED', 'true').lower() == 'true'
    PROMETHEUS_METRICS = True

    # Request/Response
    MAX_CONTENT_LENGTH = int(os.getenv('API_MAX_REQUEST_SIZE', 10485760))  # 10MB
    JSON_SORT_KEYS = False
    JSONIFY_PRETTYPRINT_REGULAR = False

    # API Workers
    API_WORKERS = int(os.getenv('API_WORKERS', 4))
    API_TIMEOUT = int(os.getenv('API_TIMEOUT', 60))

    # External Services
    DOCUSIGN_CLIENT_ID = os.getenv('DOCUSIGN_CLIENT_ID', '')
    DOCUSIGN_USER_ID = os.getenv('DOCUSIGN_USER_ID', '')
    DOCUSIGN_ACCOUNT_ID = os.getenv('DOCUSIGN_ACCOUNT_ID', '')
    DOCUSIGN_PRIVATE_KEY = os.getenv('DOCUSIGN_PRIVATE_KEY', '')
    DOCUSIGN_BASE_URL = os.getenv('DOCUSIGN_BASE_URL', 'app.docusign.com')

    # Email Service
    SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY', '')
    SENDGRID_FROM_EMAIL = os.getenv('SENDGRID_FROM_EMAIL', 'noreply@immo2000.com')
    SENDGRID_FROM_NAME = os.getenv('SENDGRID_FROM_NAME', 'Immo2000')

    # AWS S3
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
    AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET', 'immo2000-prod-uploads')
    AWS_S3_REGION = os.getenv('AWS_S3_REGION', 'eu-west-1')
    AWS_S3_URL_EXPIRY = 3600  # 1 hour

    # Sentry Error Tracking
    SENTRY_DSN = os.getenv('SENTRY_DSN', '')
    SENTRY_ENVIRONMENT = 'production'
    SENTRY_TRACES_SAMPLE_RATE = 0.1

    # Analytics
    ANALYTICS_ENABLED = os.getenv('ANALYTICS_ENABLED', 'true').lower() == 'true'

    # Cache Configuration
    CACHE_TTL_LISTINGS = int(os.getenv('CACHE_TTL_LISTINGS', 3600))
    CACHE_TTL_FAVORITES = int(os.getenv('CACHE_TTL_FAVORITES', 1800))
    CACHE_TTL_ALERTS = int(os.getenv('CACHE_TTL_ALERTS', 1800))
    CACHE_TTL_OFFERS = int(os.getenv('CACHE_TTL_OFFERS', 1200))

    # Backup Configuration
    BACKUP_ENABLED = os.getenv('BACKUP_ENABLED', 'true').lower() == 'true'
    BACKUP_SCHEDULE = os.getenv('BACKUP_SCHEDULE', '0 2 * * *')  # Daily 2 AM
    BACKUP_RETENTION_DAYS = int(os.getenv('BACKUP_RETENTION_DAYS', 30))

    # Feature Flags
    FEATURE_DOCUSIGN = True
    FEATURE_2FA = True
    FEATURE_NOTIFICATIONS = True
    FEATURE_ANALYTICS = True

    @staticmethod
    def init_app(app):
        """Initialize application with production config"""
        # Setup logging
        if ProductionConfig.LOG_TO_FILE:
            import logging
            from logging.handlers import RotatingFileHandler

            os.makedirs(ProductionConfig.LOG_DIR, exist_ok=True)
            handler = RotatingFileHandler(
                filename=os.path.join(ProductionConfig.LOG_DIR, 'app.log'),
                maxBytes=ProductionConfig.LOG_MAX_SIZE,
                backupCount=ProductionConfig.LOG_BACKUP_COUNT
            )
            handler.setLevel(ProductionConfig.LOG_LEVEL)
            formatter = logging.Formatter(
                '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
            )
            handler.setFormatter(formatter)
            app.logger.addHandler(handler)
            app.logger.info('Production logging initialized')

        # Setup Sentry if configured
        if ProductionConfig.SENTRY_DSN:
            try:
                import sentry_sdk
                from sentry_sdk.integrations.flask import FlaskIntegration

                sentry_sdk.init(
                    ProductionConfig.SENTRY_DSN,
                    integrations=[FlaskIntegration()],
                    environment=ProductionConfig.SENTRY_ENVIRONMENT,
                    traces_sample_rate=ProductionConfig.SENTRY_TRACES_SAMPLE_RATE
                )
                app.logger.info('Sentry error tracking initialized')
            except Exception as e:
                app.logger.warning(f'Failed to initialize Sentry: {e}')


# Alias for easy import
Config = ProductionConfig
