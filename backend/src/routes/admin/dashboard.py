"""
Routes Flask pour le dashboard administrateur.

Endpoints :
- GET /api/v1/admin/dashboard → Dashboard administrateur avec statistiques
- GET /api/v1/admin/analytics → Analytics et statistiques du trafic
- GET /api/v1/admin/stats/user-activity → Statistiques d'activité des utilisateurs
- GET /api/v1/admin/audit-logs → Logs d'audit filtrés
- GET /api/v1/admin/audit-logs/export → Exporter les logs d'audit
- GET /api/v1/admin/security/status → État de la sécurité et KPIs
"""

from flask import Blueprint, jsonify, request, g, current_app
from sqlalchemy import desc, func, text
from datetime import datetime, timedelta
import logging

from src.auth.models import db, User
from src.auth.decorators import token_required, admin_required
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError
from src.security.audit import AdminAuditLog, log_admin_action, audit_logger, get_audit_logs

logger = logging.getLogger(__name__)

# Blueprint
dashboard_bp = Blueprint("admin_dashboard", __name__, url_prefix="/api/v1")


@dashboard_bp.route("/admin/dashboard", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_admin_dashboard(current_user):
    """GET /api/v1/admin/dashboard - Dashboard administrateur avec statistiques"""
    from src.models.annonces import Annonce

    now = datetime.utcnow()
    last_30_days = now - timedelta(days=30)
    last_7_days = now - timedelta(days=7)

    # Core queries
    total_users = db.session.query(User).count()
    active_users = db.session.query(User).filter(User.actif == True).count()
    role_counts = db.session.query(User.role, func.count(User.utilisateur_id)).group_by(User.role).all()
    users_by_role = {(r if r else 'undefined'): c for r, c in role_counts}

    total_listings = db.session.query(Annonce).count()
    active_listings = db.session.query(Annonce).filter(Annonce.statut == 'active').count()
    new_listings_7d = db.session.query(Annonce).filter(Annonce.date_creation >= last_7_days).count()
    new_listings_30d = db.session.query(Annonce).filter(Annonce.date_creation >= last_30_days).count()

    new_users_7d = db.session.query(User).filter(User.date_inscription >= last_7_days).count()
    new_users_30d = db.session.query(User).filter(User.date_inscription >= last_30_days).count()
    active_users_7d = db.session.query(User).filter(User.date_derniere_connexion >= last_7_days).count()
    never_logged_in = db.session.query(User).filter(User.date_derniere_connexion == None).count()

    # Optional tables
    total_offers, offers_this_month, new_offers_7d = 0, 0, 0
    try:
        from src.models.offres import Offre
        total_offers = db.session.query(Offre).count()
        offers_this_month = db.session.query(Offre).filter(Offre.date_offre >= last_30_days).count()
        new_offers_7d = db.session.query(Offre).filter(Offre.date_offre >= last_7_days).count()
    except Exception as e:
        logger.warning(f"Offres unavailable: {str(e)}", exc_info=True)
        db.session.rollback()

    messages_7d = 0
    try:
        from src.models.messages import Message
        messages_7d = db.session.query(Message).filter(Message.date_creation >= last_7_days).count()
    except Exception as e:
        logger.warning(f"Messages unavailable: {str(e)}", exc_info=True)
        db.session.rollback()

    top_listings_data = []
    try:
        top_listings = db.session.query(Annonce).order_by(desc(Annonce.nombre_vues)).limit(5).all()
        top_listings_data = [{"annonce_id": l.annonce_id, "titre": l.titre, "nombre_vues": l.nombre_vues or 0, "adresse": l.adresse, "prix": l.prix} for l in top_listings]
    except Exception as e:
        logger.warning(f"Top listings unavailable: {str(e)}", exc_info=True)
        db.session.rollback()

    return {
        "admin_id": current_user['user_id'],
        "generated_at": now.isoformat(),
        "summary": {"total_users": total_users, "active_users": active_users, "inactive_users": total_users - active_users, "total_listings": total_listings, "active_listings": active_listings, "total_offers": total_offers},
        "users_by_role": users_by_role,
        "activity_7days": {"new_users": new_users_7d, "active_users": active_users_7d, "new_listings": new_listings_7d, "messages": messages_7d, "new_offers": new_offers_7d},
        "growth_30days": {"new_users": new_users_30d, "new_listings": new_listings_30d, "offers_created": offers_this_month},
        "health": {"never_logged_in_users": never_logged_in, "avg_new_users_per_day": round(new_users_7d / 7, 2), "avg_new_listings_per_day": round(new_listings_7d / 7, 2)},
        "top_listings": top_listings_data,
        "alerts": {"inactive_users": total_users - active_users, "inactive_listings": total_listings - active_listings, "never_logged_in": never_logged_in}
    }


@dashboard_bp.route("/admin/analytics", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_analytics(current_user):
    """
    GET /api/v1/admin/analytics
    Obtenir les analytics et statistiques du trafic (admin only).
    """
    period = request.args.get("period", "week", type=str)
    if period not in ["week", "month", "year", "all"]:
        raise ValidationError('period must be one of: week, month, year, all')

    # Déterminer la date limite en fonction de la période
    now = datetime.utcnow()
    if period == "week":
        date_limit = now - timedelta(days=7)
    elif period == "month":
        date_limit = now - timedelta(days=30)
    elif period == "year":
        date_limit = now - timedelta(days=365)
    else:  # 'all'
        date_limit = datetime.min

    # ============ RÉSUMÉ GÉNÉRAL ============
    total_users = db.session.query(User).count()
    active_users = db.session.query(User).filter(User.actif == True).count()

    # Compter les utilisateurs par rôle
    users_by_role = {}
    role_counts = db.session.query(User.role, func.count(User.utilisateur_id)).group_by(User.role).all()
    for role, count in role_counts:
        users_by_role[role] = count

    # Compter les annonces, offres, notaires
    from src.models.annonces import Annonce
    total_listings = db.session.query(Annonce).count()

    try:
        from src.models.offres import Offre
        total_offers = db.session.query(Offre).count()
    except:
        total_offers = 0

    total_notaires = db.session.query(User).filter(User.role == 'notaire').count()

    # ============ TRAFIC RÉCENT ============
    logins_recent = db.session.query(User).filter(
        User.date_derniere_connexion >= date_limit
    ).count()

    listings_created_recent = db.session.query(Annonce).filter(
        Annonce.date_creation >= date_limit
    ).count() if date_limit != datetime.min else db.session.query(Annonce).count()

    try:
        from src.models.offres import Offre
        offers_created_recent = db.session.query(Offre).filter(
            Offre.date_creation >= date_limit
        ).count() if date_limit != datetime.min else db.session.query(Offre).count()
    except:
        offers_created_recent = 0

    try:
        from src.models.messages import Message
        messages_sent_recent = db.session.query(Message).filter(
            Message.date_envoi >= date_limit
        ).count() if date_limit != datetime.min else db.session.query(Message).count()
    except:
        messages_sent_recent = 0

    new_users_recent = db.session.query(User).filter(
        User.date_inscription >= date_limit
    ).count() if date_limit != datetime.min else 0

    analytics = {
        "summary": {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "total_listings": total_listings,
            "total_offers": total_offers,
            "total_notaires": total_notaires
        },
        "users_by_role": users_by_role,
        "traffic": {
            "logins": logins_recent,
            "listings_created": listings_created_recent,
            "offers_created": offers_created_recent,
            "messages_sent": messages_sent_recent
        },
        "growth": {
            "new_users": new_users_recent,
            "new_listings": listings_created_recent,
            "new_offers": offers_created_recent
        },
        "period": period,
        "generated_at": datetime.utcnow().isoformat()
    }

    logger.info(f"Admin {current_user['user_id']} accessed analytics (period: {period})")

    return analytics


@dashboard_bp.route("/admin/stats/user-activity", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_user_activity_stats(current_user):
    """
    GET /api/v1/admin/stats/user-activity
    Obtenir les statistiques d'activité des utilisateurs (admin only).
    """
    # Utilisateurs actifs vs inactifs
    active_count = db.session.query(User).filter(User.actif == True).count()
    inactive_count = db.session.query(User).filter(User.actif == False).count()

    # Nouvelles inscriptions par jour (7 derniers jours)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    new_registrations_by_day = db.session.query(
        func.date(User.date_inscription).label('date'),
        func.count(User.utilisateur_id).label('count')
    ).filter(
        User.date_inscription >= seven_days_ago
    ).group_by(func.date(User.date_inscription)).all()

    days_data = [{"date": str(day), "count": count} for day, count in new_registrations_by_day]

    # Utilisateurs n'ayant jamais login
    never_logged_in = db.session.query(User).filter(
        User.date_derniere_connexion == None
    ).count()

    logger.info(f"Admin {current_user['user_id']} accessed user activity stats")

    return {
        "user_status": {
            "active": active_count,
            "inactive": inactive_count,
            "never_logged_in": never_logged_in
        },
        "new_registrations_last_7_days": days_data,
        "total_new_registrations_this_week": sum([d["count"] for d in days_data])
    }


# ============================================================================
# ROUTES AUDIT & SÉCURITÉ (Migré de admin_security.py)
# ============================================================================

@dashboard_bp.route("/admin/audit-logs", methods=["GET"])
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

    except ValueError as e:
        logger.error(f"Error getting audit logs (paramètres invalides): {str(e)}", exc_info=True)
        raise ValidationError(f"Erreur: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting audit logs: {str(e)}", exc_info=True)
        raise ValidationError(f"Erreur: {str(e)}")


@dashboard_bp.route("/admin/audit-logs/export", methods=["GET"])
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

    except ValueError as e:
        logger.error(f"Error exporting audit logs (erreur de format): {str(e)}", exc_info=True)
        raise ValidationError(f"Erreur: {str(e)}")
    except Exception as e:
        logger.error(f"Error exporting audit logs: {str(e)}", exc_info=True)
        raise ValidationError(f"Erreur: {str(e)}")


@dashboard_bp.route("/admin/security/status", methods=["GET"])
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
        suspicious_ips = db.session.execute(text("""
            SELECT ip_address, COUNT(*) as count FROM admin_audit_logs
            WHERE status_code >= 400 AND timestamp >= NOW() - INTERVAL '24 hours'
            GROUP BY ip_address HAVING COUNT(*) > 5
            ORDER BY count DESC LIMIT 10
        """)).fetchall()

        # Admins avec plus d'actions
        top_admins = db.session.execute(text("""
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

    except ValueError as e:
        logger.error(f"Error getting security status (erreur de calcul): {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'message': str(e),
            'failed_actions_24h': 0,
            'suspicious_ips': [],
            'top_active_admins': []
        }
