"""
Admin routes for audit log management and security events.
"""

from flask import Blueprint, request, jsonify
from sqlalchemy import desc
from datetime import datetime, timedelta
from backend.src.models.audit import AuditLog, SecurityEvent, AuditActionType
from backend.src.database import db
from backend.src.dependencies import token_required, admin_required

audit_bp = Blueprint('audit', __name__, url_prefix='/api/v1/admin/audit')


@audit_bp.route('/logs', methods=['GET'])
@token_required
@admin_required
def get_audit_logs():
    """Get audit logs with filtering and pagination."""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        user_id = request.args.get('user_id', None, type=int)
        action = request.args.get('action', None, type=str)
        start_date = request.args.get('start_date', None, type=str)
        end_date = request.args.get('end_date', None, type=str)
        resource_type = request.args.get('resource_type', None, type=str)
        status = request.args.get('status', None, type=str)

        # Build query
        query = AuditLog.query

        if user_id:
            query = query.filter_by(user_id=user_id)

        if action:
            query = query.filter_by(action=action)

        if resource_type:
            query = query.filter_by(resource_type=resource_type)

        if status:
            query = query.filter_by(status=status)

        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
                query = query.filter(AuditLog.created_at >= start)
            except:
                pass

        if end_date:
            try:
                end = datetime.fromisoformat(end_date)
                query = query.filter(AuditLog.created_at <= end)
            except:
                pass

        # Paginate and sort
        paginated = query.order_by(desc(AuditLog.created_at)).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        return {
            'logs': [log.to_dict() for log in paginated.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages,
            }
        }, 200

    except Exception as e:
        return {'error': str(e)}, 500


@audit_bp.route('/logs/<int:log_id>', methods=['GET'])
@token_required
@admin_required
def get_audit_log(log_id):
    """Get a specific audit log."""
    try:
        log = AuditLog.query.get(log_id)
        if not log:
            return {'error': 'Audit log not found'}, 404

        return log.to_dict(), 200

    except Exception as e:
        return {'error': str(e)}, 500


@audit_bp.route('/logs/user/<int:user_id>', methods=['GET'])
@token_required
@admin_required
def get_user_audit_logs(user_id):
    """Get all audit logs for a specific user."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        paginated = AuditLog.query.filter_by(user_id=user_id).order_by(
            desc(AuditLog.created_at)
        ).paginate(page=page, per_page=per_page, error_out=False)

        return {
            'user_id': user_id,
            'logs': [log.to_dict() for log in paginated.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages,
            }
        }, 200

    except Exception as e:
        return {'error': str(e)}, 500


@audit_bp.route('/stats', methods=['GET'])
@token_required
@admin_required
def get_audit_stats():
    """Get audit log statistics."""
    try:
        # Stats for last 30 days
        start_date = datetime.utcnow() - timedelta(days=30)

        # Query for stats
        total_logs = AuditLog.query.filter(AuditLog.created_at >= start_date).count()

        # By action type
        actions = db.session.query(
            AuditLog.action,
            db.func.count(AuditLog.id).label('count')
        ).filter(AuditLog.created_at >= start_date).group_by(AuditLog.action).all()

        # By status
        statuses = db.session.query(
            AuditLog.status,
            db.func.count(AuditLog.id).label('count')
        ).filter(AuditLog.created_at >= start_date).group_by(AuditLog.status).all()

        # Failed logins
        failed_logins = AuditLog.query.filter(
            AuditLog.action == AuditActionType.LOGIN_FAILED,
            AuditLog.created_at >= start_date
        ).count()

        # By user (top 10 most active)
        top_users = db.session.query(
            AuditLog.user_id,
            db.func.count(AuditLog.id).label('count')
        ).filter(AuditLog.created_at >= start_date).group_by(AuditLog.user_id).order_by(
            db.desc('count')
        ).limit(10).all()

        return {
            'period': {
                'start': start_date.isoformat(),
                'end': datetime.utcnow().isoformat(),
            },
            'total_logs': total_logs,
            'by_action': [{'action': a[0], 'count': a[1]} for a in actions],
            'by_status': [{'status': s[0], 'count': s[1]} for s in statuses],
            'failed_logins': failed_logins,
            'top_users': [{'user_id': u[0], 'count': u[1]} for u in top_users],
        }, 200

    except Exception as e:
        return {'error': str(e)}, 500


@audit_bp.route('/security-events', methods=['GET'])
@token_required
@admin_required
def get_security_events():
    """Get security events with filtering."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        severity = request.args.get('severity', None, type=str)
        resolved = request.args.get('resolved', None, type=str)

        query = SecurityEvent.query

        if severity:
            query = query.filter_by(severity=severity)

        if resolved:
            if resolved.lower() == 'true':
                query = query.filter(SecurityEvent.resolved_at.isnot(None))
            else:
                query = query.filter(SecurityEvent.resolved_at.is_(None))

        paginated = query.order_by(desc(SecurityEvent.created_at)).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        return {
            'events': [event.to_dict() for event in paginated.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages,
            }
        }, 200

    except Exception as e:
        return {'error': str(e)}, 500


@audit_bp.route('/security-events/<int:event_id>/resolve', methods=['POST'])
@token_required
@admin_required
def resolve_security_event(event_id):
    """Mark a security event as resolved."""
    try:
        event = SecurityEvent.query.get(event_id)
        if not event:
            return {'error': 'Security event not found'}, 404

        event.resolved_at = datetime.utcnow()
        event.resolved_by_admin = g.user_id

        db.session.commit()

        return event.to_dict(), 200

    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@audit_bp.route('/export', methods=['GET'])
@token_required
@admin_required
def export_audit_logs():
    """Export audit logs as CSV."""
    try:
        import csv
        from io import StringIO
        from flask import send_file, make_response

        # Get all logs from last 30 days
        start_date = datetime.utcnow() - timedelta(days=30)
        logs = AuditLog.query.filter(AuditLog.created_at >= start_date).order_by(
            desc(AuditLog.created_at)
        ).all()

        # Create CSV
        si = StringIO()
        writer = csv.writer(si)
        writer.writerow([
            'ID', 'User ID', 'Action', 'Resource Type', 'Resource ID',
            'IP Address', 'Status', 'Created At', 'Error Message'
        ])

        for log in logs:
            writer.writerow([
                log.id,
                log.user_id,
                log.action,
                log.resource_type,
                log.resource_id,
                log.ip_address,
                log.status,
                log.created_at,
                log.error_message,
            ])

        # Return as file
        response = make_response(si.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = 'attachment; filename=audit_logs.csv'

        return response, 200

    except Exception as e:
        return {'error': str(e)}, 500
