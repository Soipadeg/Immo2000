# backend/src/config/logging_config.py

import os
import logging
import logging.handlers
import json
from datetime import datetime
from pythonjsonlogger import jsonlogger

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter for structured logging"""

    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)

        # Add custom fields
        log_record['timestamp'] = datetime.utcnow().isoformat()
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        log_record['environment'] = os.getenv('ENVIRONMENT', 'development')

        # Add request context if available
        try:
            from flask import g, request
            if hasattr(g, 'user_id'):
                log_record['user_id'] = g.user_id
            if hasattr(g, 'request_id'):
                log_record['request_id'] = g.request_id
            log_record['method'] = request.method
            log_record['path'] = request.path
            log_record['remote_addr'] = request.remote_addr
        except (ImportError, RuntimeError):
            pass

def setup_logging():
    """Setup structured logging configuration"""

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # JSON formatter
    json_formatter = CustomJsonFormatter()

    # Console handler (stdout)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(json_formatter)
    console_handler.setLevel(logging.DEBUG)
    root_logger.addHandler(console_handler)

    # File handler for all logs
    log_dir = os.getenv('LOG_DIR', '/app/logs')
    os.makedirs(log_dir, exist_ok=True)

    # Rotating file handler
    file_handler = logging.handlers.RotatingFileHandler(
        filename=f'{log_dir}/app.log',
        maxBytes=10485760,  # 10MB
        backupCount=10,
    )
    file_handler.setFormatter(json_formatter)
    file_handler.setLevel(logging.DEBUG)
    root_logger.addHandler(file_handler)

    # Error file handler
    error_handler = logging.handlers.RotatingFileHandler(
        filename=f'{log_dir}/error.log',
        maxBytes=10485760,
        backupCount=10,
    )
    error_handler.setFormatter(json_formatter)
    error_handler.setLevel(logging.ERROR)
    root_logger.addHandler(error_handler)

    return root_logger

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance"""
    return logging.getLogger(name)

class LoggerMixin:
    """Mixin to add logging to classes"""

    @property
    def logger(self) -> logging.Logger:
        name = f'{self.__class__.__module__}.{self.__class__.__name__}'
        return logging.getLogger(name)

# Create global logger
logger = logging.getLogger(__name__)

# Log levels mapping
LOG_LEVELS = {
    'DEBUG': logging.DEBUG,
    'INFO': logging.INFO,
    'WARNING': logging.WARNING,
    'ERROR': logging.ERROR,
    'CRITICAL': logging.CRITICAL,
}

def set_log_level(level_name: str):
    """Set log level"""
    level = LOG_LEVELS.get(level_name.upper(), logging.INFO)
    logging.getLogger().setLevel(level)

# Initialize on import
setup_logging()
