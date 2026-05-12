"""
Endpoints de sécurité et audit
"""

from flask import request, jsonify, g, current_app
from src.routes.admin import admin_bp
from src.security.audit import AdminAuditLog, log_admin_action, audit_logger, get_audit_logs
from src.security.rate_limit import apply_rate_limit
from src.security.validation import (
    validate_request_data, sanitize_input, ValidationError
)
from src.models import db
from src.auth.decorators import token_required, admin_required
from src.decorators.error_handling import handle_errors
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@admin_bp.route("/admin/audit-logs", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_audit_logs_endpoint(current_user):
    """
    GET /api/v1/admin/audit-logs
    Récupérer les logs d'audit filtrés

    Paramètres query:
        - admin_id: Filtrer par ID admin
        - action: Filtrer par action
        - resource_type: Filtrer par type de ressource
        - days: Nombre de jours à remonter (défaut: 30)
        - skip: Offset pour pagination
        - limit: Nombre de logs à retourner
    """
    try:
        # Paramètres de pagination
        skip = int(request.args.get('skip', 0))
        limit = int(request.args.get('limit', 100))
        limit = min(limit, 500)  # Max 500

        # Filtres
        admin_id = request.args.get('admin_id', type=int)
        action = request.args.get('action')
        resource_type = request.args.get('resource_type')
        days = request.args.get('days', 30, type=int)

        # Construire la requête
        query = AdminAuditLog.query

        if admin_id:
            query = query.filter_by(admin_id=admin_id)
        if action:
            query = query.filter_by(action=action)
        if resource_type:
            query = query.filter_by(resource_type=resource_type)

        # Filtrer par date
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(AdminAuditLog.timestamp >= start_date)

        # Compter le total
        total = query.count()

        # Paginer et trier
        logs = query.order_by(AdminAuditLog.timestamp.desc()).offset(skip).limit(limit).all()

        # Formatter la réponse
        logs_data = []
        for log in logs:
            logs_data.append({
                'log_id': log.log_id,
                'admin_id': log.admin_id,
                'admin_email': log.admin_email,
                'action': log.action,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id,
                'status_code': log.status_code,
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'reason': log.reason,
                'timestamp': log.timestamp.isoformat()
            })

        audit_logger.info(
            'Audit logs retrieved',
            admin_id=current_user['user_id'],
            filter_count=len(logs_data),
            total=total
        )

        return {
            'data': logs_data,
            'pagination': {
                'skip': skip,
                'limit': limit,
                'total': total
            }
        }

    except Exception as e:
        logger.error(f"Error getting audit logs: {str(e)}")
        raise ValidationError(f"Erreur: {str(e)}")


@admin_bp.route("/admin/audit-logs/export", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def export_audit_logs(current_user):
    """
    GET /api/v1/admin/audit-logs/export
    Exporter les logs d'audit en CSV
    """
    try:
        from src.security.audit import export_audit_logs_csv

        # Exporter
        csv_content = export_audit_logs_csv()

        audit_logger.info(
            'Audit logs exported',
            admin_id=current_user['user_id'],
            size=len(csv_content)
        )

        return {
            'csv': csv_content
        }

    except Exception as e:
        logger.error(f"Error exporting audit logs: {str(e)}")
        raise ValidationError(f"Erreur: {str(e)}")


@admin_bp.route("/admin/security/status", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_security_status(current_user):
    """
    GET /api/v1/admin/security/status
    Récupérer le statut de sécurité du système
    """
    try:
        # Récents logs d'audit suspects
        recent_failed = AdminAuditLog.query.filter(
            AdminAuditLog.status_code >= 400,
            AdminAuditLog.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).count()

        # Adresses IP suspects
        suspicious_ips = db.session.execute(db.text("""
            SELECT ip_address, COUNT(*) as count FROM admin_audit_logs
            WHERE status_code >= 400 AND timestamp >= NOW() - INTERVAL '24 hours'
            GROUP BY ip_address HAVING COUNT(*) > 5
            ORDER BY count DESC LIMIT 10
        """)).fetchall()

        # Admins avec plus d'actions
        top_admins = db.session.execute(db.text("""
            SELECT admin_id, admin_email, COUNT(*) as actions
            FROM admin_audit_logs WHERE timestamp >= NOW() - INTERVAL '7 days'
            GROUP BY admin_id, admin_email
            ORDER BY actions DESC LIMIT 5
        """)).fetchall()

        return {
            'status': 'ok',
            'failed_actions_24h': recent_failed,
            'suspicious_ips': [
                {'ip': row.ip_address, 'failed_count': row.count}
                for row in suspicious_ips
            ] if suspicious_ips else [],
            'top_active_admins': [
                {'admin_id': row.admin_id, 'email': row.admin_email, 'actions': row.actions}
                for row in top_admins
            ] if top_admins else []
        }

    except Exception as e:
        logger.error(f"Error getting security status: {str(e)}")
        return {
            'status': 'error',
            'message': str(e),
            'failed_actions_24h': 0,
            'suspicious_ips': [],
            'top_active_admins': []
        }
