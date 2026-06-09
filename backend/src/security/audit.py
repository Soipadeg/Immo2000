"""
Audit et logging des actions sensibles pour conformité RGPD et sécurité
"""

import json
from datetime import datetime
from flask import request, current_app
from functools import wraps
import logging
from src.auth.models import db

logger = logging.getLogger(__name__)

# Logger structuré
class StructuredLogger:
    """Logger qui produit du JSON structuré"""

    def __init__(self, name):
        self.logger = logging.getLogger(name)

    def _format_log(self, level, message, **extra):
        """Format un log en JSON structuré"""
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': level,
            'message': message,
            **extra
        }
        return json.dumps(log_data)

    def info(self, message, **extra):
        self.logger.info(self._format_log('INFO', message, **extra))

    def warning(self, message, **extra):
        self.logger.warning(self._format_log('WARNING', message, **extra))

    def error(self, message, **extra):
        self.logger.error(self._format_log('ERROR', message, **extra))

    def critical(self, message, **extra):
        self.logger.critical(self._format_log('CRITICAL', message, **extra))


# Audit logger global
audit_logger = StructuredLogger('admin.audit')


class AdminAuditLog(db.Model):
    """
    Table pour enregistrer toutes les actions administrateur
    """
    __tablename__ = 'admin_audit_logs'

    log_id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, nullable=False, index=True)
    admin_email = db.Column(db.String(255), nullable=False)
    action = db.Column(db.String(100), nullable=False, index=True)
    resource_type = db.Column(db.String(50), nullable=False)  # 'user', 'listing', 'transaction', etc.
    resource_id = db.Column(db.Integer)
    old_value = db.Column(db.JSON)  # Valeur avant changement
    new_value = db.Column(db.JSON)  # Valeur après changement
    status_code = db.Column(db.Integer)
    ip_address = db.Column(db.String(45))  # IPv4 ou IPv6
    user_agent = db.Column(db.String(500))
    reason = db.Column(db.String(500))  # Raison du rejet/suppression
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f'<AdminAuditLog {self.action} {self.resource_type}/{self.resource_id}>'


def log_admin_action(action: str, resource_type: str, resource_id=None,
                     old_value=None, new_value=None, reason=None):
    """
    Décorateur pour logger automatiquement les actions admin

    Usage:
        @log_admin_action('update', 'user', 'user_id')
        def update_user_role(user_id, new_role):
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Exécuter la fonction
            response = f(*args, **kwargs)

            # Récupérer l'admin courant et l'IP
            admin_id = g.get('user_id')
            admin_email = g.get('email', 'unknown')
            ip_address = request.remote_addr
            user_agent = request.user_agent.string[:500] if request.user_agent else None

            # Déterminer le code de statut
            status_code = 200
            if isinstance(response, tuple):
                status_code = response[1] if len(response) > 1 else 200

            # Enregistrer dans la BD
            try:
                audit_log = AdminAuditLog(
                    admin_id=admin_id,
                    admin_email=admin_email,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    old_value=old_value,
                    new_value=new_value,
                    status_code=status_code,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    reason=reason
                )
                db.session.add(audit_log)
                db.session.commit()
            except ValueError as e:
                db.session.rollback()
                audit_logger.error(
                    'Failed to log admin action (validation)',
                    action=action,
                    admin_id=admin_id,
                    error=str(e),
                    exc_info=True
                )
            except Exception as e:
                db.session.rollback()
                audit_logger.error(
                    'Failed to log admin action',
                    action=action,
                    admin_id=admin_id,
                    error=str(e),
                    exc_info=True
                )

            # Log structuré
            audit_logger.info(
                f'Admin action: {action} on {resource_type}',
                admin_id=admin_id,
                admin_email=admin_email,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                status_code=status_code,
                ip_address=ip_address
            )

            return response

        return decorated_function
    return decorator


def get_audit_logs(admin_id=None, action=None, resource_type=None,
                   limit=100, offset=0):
    """
    Récupérer les logs d'audit

    Args:
        admin_id: ID admin (filtrer par admin)
        action: Type d'action (filtrer par action)
        resource_type: Type de ressource
        limit: Nombre maximum de logs
        offset: Décalage pour pagination

    Returns:
        Liste des logs d'audit
    """
    query = AdminAuditLog.query

    if admin_id:
        query = query.filter_by(admin_id=admin_id)
    if action:
        query = query.filter_by(action=action)
    if resource_type:
        query = query.filter_by(resource_type=resource_type)

    # Trier par date décroissante et paginer
    logs = query.order_by(AdminAuditLog.timestamp.desc()).offset(offset).limit(limit).all()

    return logs


def export_audit_logs_csv(admin_id=None):
    """
    Exporter les logs d'audit en CSV
    """
    import csv
    from io import StringIO

    logs = get_audit_logs(admin_id=admin_id, limit=10000)

    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'log_id', 'admin_id', 'admin_email', 'action', 'resource_type',
        'resource_id', 'status_code', 'ip_address', 'timestamp'
    ])

    writer.writeheader()
    for log in logs:
        writer.writerow({
            'log_id': log.log_id,
            'admin_id': log.admin_id,
            'admin_email': log.admin_email,
            'action': log.action,
            'resource_type': log.resource_type,
            'resource_id': log.resource_id,
            'status_code': log.status_code,
            'ip_address': log.ip_address,
            'timestamp': log.timestamp.isoformat()
        })

    return output.getvalue()
