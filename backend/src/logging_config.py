"""
Configuration du logging structuré pour l'API Admin
"""

import logging
import logging.handlers
import json
from datetime import datetime
import os

class JsonFormatter(logging.Formatter):
    """Formatter qui produit du JSON structuré"""

    def format(self, record):
        log_obj = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'pathname': record.pathname,
            'lineno': record.lineno,
            'funcName': record.funcName
        }

        # Ajouter les extras
        if hasattr(record, 'user_id'):
            log_obj['user_id'] = record.user_id
        if hasattr(record, 'email'):
            log_obj['email'] = record.email
        if hasattr(record, 'action'):
            log_obj['action'] = record.action
        if hasattr(record, 'resource'):
            log_obj['resource'] = record.resource
        if hasattr(record, 'ip_address'):
            log_obj['ip_address'] = record.ip_address
        if hasattr(record, 'request_id'):
            log_obj['request_id'] = record.request_id

        # Exception info si présent
        if record.exc_info:
            log_obj['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_obj)


def setup_logging():
    """Configurer le système de logging"""

    # Créer le répertoire logs s'il n'existe pas
    logs_dir = 'logs'
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir)

    # Logger principal
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Format
    json_formatter = JsonFormatter()
    plain_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Handler pour fichier admin.log (JSON)
    admin_handler = logging.handlers.RotatingFileHandler(
        f'{logs_dir}/admin.log',
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    admin_handler.setLevel(logging.INFO)
    admin_handler.setFormatter(json_formatter)

    # Handler pour fichier audit.log (JSON structuré)
    audit_handler = logging.handlers.RotatingFileHandler(
        f'{logs_dir}/audit.log',
        maxBytes=10485760,  # 10MB
        backupCount=20
    )
    audit_handler.setLevel(logging.INFO)
    audit_handler.setFormatter(json_formatter)

    # Handler pour fichier error.log
    error_handler = logging.handlers.RotatingFileHandler(
        f'{logs_dir}/error.log',
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(plain_formatter)

    # Handler console (développement)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(plain_formatter)

    # Ajouter les handlers
    root_logger.addHandler(admin_handler)
    root_logger.addHandler(error_handler)
    root_logger.addHandler(console_handler)

    # Logger spécifique pour audit
    audit_logger = logging.getLogger('admin.audit')
    audit_logger.addHandler(audit_handler)
    audit_logger.setLevel(logging.INFO)

    # Logger pour les requêtes
    request_logger = logging.getLogger('admin.requests')
    request_logger.setLevel(logging.INFO)

    # Logger pour les erreurs
    error_logger = logging.getLogger('admin.errors')
    error_logger.setLevel(logging.ERROR)

    return {
        'root': root_logger,
        'audit': audit_logger,
        'requests': request_logger,
        'errors': error_logger
    }


# Initialiser au import
loggers = setup_logging()
