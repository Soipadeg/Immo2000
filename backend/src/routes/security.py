"""
Routes pour les fonctionnalités de sécurité et conformité RGPD
- 2FA (Double Authentification)
- Vérification d'identité
- Gestion des données RGPD
- Profil de sécurité
"""

from flask import Blueprint, render_template, request, jsonify, redirect, url_for, send_file
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import json
import io

from src.auth.models import db, User
from src.models.security import SecurityProfile, AuditLog, RGPDRequest, IdentityVerificationLog
from src.security.auth_advanced import TwoFactorAuth, IdentityVerification, XSSProtection
from src.security.audit import log_audit_action, AuditAction, AlertSystem

security_bp = Blueprint('security', __name__, url_prefix='/api/v1/security')


# ==================== 2FA (Double Authentification) ====================

@security_bp.route('/2fa/setup', methods=['GET', 'POST'])
@login_required
def setup_2fa():
    """Configuration du 2FA"""
    security_profile = SecurityProfile.query.filter_by(
        utilisateur_id=current_user.utilisateur_id
    ).first()

    if request.method == 'GET':
        # Générer un secret et un QR code
        secret = TwoFactorAuth.generate_secret()
        qr_code = TwoFactorAuth.generate_qr_code(current_user.email, secret)

        return jsonify({
            "success": True,
            "qr_code": qr_code,
            "secret": secret,
            "message": "Scannez ce code QR avec votre application d'authentification"
        })

    elif request.method == 'POST':
        # Vérifier le code 2FA et activer
        data = request.get_json()
        secret = data.get('secret')
        code = data.get('code')

        if not secret or not code:
            return jsonify({"error": "Secret et code requis"}), 400

        # Vérifier le code
        if not TwoFactorAuth.verify_token(secret, code):
            return jsonify({"error": "Code 2FA invalide"}), 401

        # Activer le 2FA
        if not security_profile:
            security_profile = SecurityProfile(utilisateur_id=current_user.utilisateur_id)
            db.session.add(security_profile)

        security_profile.secret_2fa = secret
        security_profile.is_2fa_enabled = True
        security_profile.backup_codes = TwoFactorAuth.get_backup_codes()

        db.session.commit()

        log_audit_action(
            user_id=current_user.utilisateur_id,
            action=AuditAction.ENABLE_2FA,
            status="success",
            risk_level="high"
        )

        return jsonify({
            "success": True,
            "message": "2FA activé avec succès",
            "backup_codes": security_profile.backup_codes
        })


@security_bp.route('/2fa/disable', methods=['POST'])
@login_required
def disable_2fa():
    """Désactiver le 2FA"""
    security_profile = SecurityProfile.query.filter_by(
        utilisateur_id=current_user.utilisateur_id
    ).first()

    if not security_profile or not security_profile.is_2fa_enabled:
        return jsonify({"error": "2FA n'est pas activé"}), 400

    # Demander la vérification avec le code 2FA
    data = request.get_json()
    code = data.get('code')

    if not TwoFactorAuth.verify_token(security_profile.secret_2fa, code):
        return jsonify({"error": "Code 2FA invalide"}), 401

    # Désactiver le 2FA
    security_profile.is_2fa_enabled = False
    security_profile.secret_2fa = None
    security_profile.backup_codes = None

    db.session.commit()

    log_audit_action(
        user_id=current_user.utilisateur_id,
        action=AuditAction.DISABLE_2FA,
        status="success",
        risk_level="high"
    )

    return jsonify({"success": True, "message": "2FA désactivé"})


@security_bp.route('/2fa/verify', methods=['POST'])
def verify_2fa():
    """Vérifier le code 2FA lors de la connexion"""
    data = request.get_json()
    user_id = data.get('user_id')
    code = data.get('code')

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404

    security_profile = SecurityProfile.query.filter_by(utilisateur_id=user_id).first()
    if not security_profile or not security_profile.is_2fa_enabled:
        return jsonify({"error": "2FA n'est pas activé"}), 400

    # Vérifier le code TOTP ou les codes de secours
    if TwoFactorAuth.verify_token(security_profile.secret_2fa, code):
        log_audit_action(
            user_id=user_id,
            action=AuditAction.LOGIN_2FA,
            status="success"
        )
        return jsonify({"success": True, "message": "2FA validé"})

    # Vérifier les codes de secours
    if code in (security_profile.backup_codes or []):
        security_profile.backup_codes.remove(code)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Code de secours utilisé",
            "backup_codes_remaining": len(security_profile.backup_codes or [])
        })

    log_audit_action(
        user_id=user_id,
        action=AuditAction.FAILED_2FA,
        status="failed",
        risk_level="high"
    )

    return jsonify({"error": "Code 2FA invalide"}), 401


# ==================== VÉRIFICATION D'IDENTITÉ ====================

@security_bp.route('/identity/start', methods=['POST'])
@login_required
def start_identity_verification():
    """Démarrer une vérification d'identité"""
    security_profile = SecurityProfile.query.filter_by(
        utilisateur_id=current_user.utilisateur_id
    ).first()

    if security_profile and security_profile.identite_verifiee:
        return jsonify({"error": "L'identité est déjà vérifiée"}), 400

    data = request.get_json()
    provider = data.get('provider', 'yousign')  # 'yousign' ou 'veriff'

    # Démarrer la vérification
    if provider == 'yousign':
        result = IdentityVerification.start_yousign_verification(
            user_id=current_user.utilisateur_id,
            email=current_user.email,
            first_name=current_user.prenom,
            last_name=current_user.nom
        )
    elif provider == 'veriff':
        result = IdentityVerification.start_veriff_verification(
            user_id=current_user.utilisateur_id,
            email=current_user.email,
            first_name=current_user.prenom,
            last_name=current_user.nom
        )
    else:
        return jsonify({"error": f"Fournisseur {provider} non supporté"}), 400

    if "error" in result:
        log_audit_action(
            user_id=current_user.utilisateur_id,
            action=AuditAction.START_IDENTITY_VERIFICATION,
            status="failed",
            details=result,
            risk_level="medium"
        )
        return jsonify(result), 400

    # Enregistrer le log de vérification
    verification_log = IdentityVerificationLog(
        utilisateur_id=current_user.utilisateur_id,
        provider=provider,
        verification_id=result.get('verification_id'),
        first_name=current_user.prenom,
        last_name=current_user.nom,
        status='pending'
    )
    db.session.add(verification_log)
    db.session.commit()

    log_audit_action(
        user_id=current_user.utilisateur_id,
        action=AuditAction.START_IDENTITY_VERIFICATION,
        resource_type="identity_verification",
        resource_id=verification_log.id,
        status="success"
    )

    return jsonify({
        "success": True,
        "url": result.get('url'),
        "verification_id": result.get('verification_id'),
        "message": "Redirection vers le fournisseur de vérification"
    })


@security_bp.route('/identity/callback', methods=['POST'])
def identity_verification_callback():
    """Callback de vérification d'identité (Yousign/Veriff)"""
    data = request.get_json()
    verification_id = data.get('verification_id')
    status = data.get('status')  # 'approved', 'rejected', 'expired'
    user_id = data.get('user_id')

    verification_log = IdentityVerificationLog.query.filter_by(
        verification_id=verification_id
    ).first()

    if not verification_log:
        return jsonify({"error": "Vérification non trouvée"}), 404

    verification_log.status = status
    verification_log.completed_at = datetime.utcnow()

    if status == 'approved':
        security_profile = SecurityProfile.query.filter_by(
            utilisateur_id=verification_log.utilisateur_id
        ).first()

        if not security_profile:
            security_profile = SecurityProfile(utilisateur_id=verification_log.utilisateur_id)
            db.session.add(security_profile)

        security_profile.identite_verifiee = True
        security_profile.verification_id = verification_id
        security_profile.verification_method = verification_log.provider
        security_profile.verification_date = datetime.utcnow()
        security_profile.verification_expires = datetime.utcnow() + timedelta(days=365*5)  # 5 ans

        log_audit_action(
            user_id=verification_log.utilisateur_id,
            action=AuditAction.COMPLETE_IDENTITY_VERIFICATION,
            resource_type="identity_verification",
            resource_id=verification_log.id,
            status="success",
            risk_level="low"
        )
    else:
        log_audit_action(
            user_id=verification_log.utilisateur_id,
            action=AuditAction.FAILED_IDENTITY_VERIFICATION,
            resource_type="identity_verification",
            resource_id=verification_log.id,
            details={"reason": status},
            status="failed",
            risk_level="medium"
        )

    db.session.commit()
    return jsonify({"success": True, "message": "Callback traité"})


# ==================== RGPD (Gestion des Données) ====================

@security_bp.route('/rgpd/status', methods=['GET'])
@login_required
def rgpd_status():
    """Obtenir le statut RGPD de l'utilisateur"""
    rgpd_requests = RGPDRequest.query.filter_by(
        utilisateur_id=current_user.utilisateur_id
    ).order_by(RGPDRequest.requested_at.desc()).all()

    return jsonify({
        "success": True,
        "requests": [
            {
                "id": r.id,
                "type": r.request_type,
                "status": r.status,
                "requested_at": r.requested_at.isoformat(),
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                "data_url": r.data_url
            }
            for r in rgpd_requests
        ]
    })


@security_bp.route('/rgpd/export-data', methods=['POST'])
@login_required
def export_data():
    """Exporter toutes les données personnelles de l'utilisateur"""
    # Créer une demande d'export
    rgpd_request = RGPDRequest(
        utilisateur_id=current_user.utilisateur_id,
        request_type='data_export',
        status='processing',
        reason=request.get_json().get('reason')
    )
    db.session.add(rgpd_request)
    db.session.commit()

    log_audit_action(
        user_id=current_user.utilisateur_id,
        action=AuditAction.EXPORT_DATA,
        resource_type="rgpd_request",
        resource_id=rgpd_request.id,
        status="success",
        risk_level="high"
    )

    # TODO: Générer asynchroniquement le fichier JSON avec tous les données
    # Pour maintenant, on confirme juste la demande

    return jsonify({
        "success": True,
        "request_id": rgpd_request.id,
        "message": "Demande d'export enregistrée. Vous recevrez un email dans les 30 jours."
    })


@security_bp.route('/rgpd/delete-account', methods=['POST'])
@login_required
def delete_account():
    """Demander la suppression du compte (avec délai de confirmation)"""
    data = request.get_json()
    password = data.get('password')

    # Vérifier le mot de passe
    if not current_user.verify_password(password):
        return jsonify({"error": "Mot de passe invalide"}), 401

    # Créer une demande de suppression avec token de confirmation
    rgpd_request = RGPDRequest(
        utilisateur_id=current_user.utilisateur_id,
        request_type='delete_account',
        status='pending',
        reason=data.get('reason')
    )
    db.session.add(rgpd_request)
    db.session.commit()

    log_audit_action(
        user_id=current_user.utilisateur_id,
        action=AuditAction.DELETE_DATA,
        resource_type="rgpd_request",
        resource_id=rgpd_request.id,
        status="success",
        risk_level="critical"
    )

    # TODO: Envoyer un email de confirmation avec lien de validation

    return jsonify({
        "success": True,
        "request_id": rgpd_request.id,
        "message": "Demande de suppression enregistrée. Veuillez confirmer par email dans les 30 jours."
    })


@security_bp.route('/rgpd/confirm-deletion/<token>', methods=['POST'])
def confirm_deletion(token):
    """Confirmer la suppression du compte"""
    rgpd_request = RGPDRequest.query.filter_by(
        confirmation_token=token,
        request_type='delete_account'
    ).first()

    if not rgpd_request or rgpd_request.status != 'pending':
        return jsonify({"error": "Token invalide ou expiré"}), 400

    if rgpd_request.confirmation_expires < datetime.utcnow():
        return jsonify({"error": "Token expiré"}), 400

    # Anonymiser le compte
    user = User.query.get(rgpd_request.utilisateur_id)
    user.email = f"deleted_{user.utilisateur_id}@immo2000.fr"
    user.nom = f"Utilisateur supprimé ({user.utilisateur_id})"
    user.prenom = ""
    user.actif = False

    rgpd_request.status = 'completed'
    rgpd_request.completed_at = datetime.utcnow()

    db.session.commit()

    log_audit_action(
        user_id=user.utilisateur_id,
        action=AuditAction.DELETE_ACCOUNT,
        status="success",
        risk_level="critical"
    )

    return jsonify({"success": True, "message": "Compte supprimé avec succès"})


# ==================== PROFIL DE SÉCURITÉ ====================

@security_bp.route('/profile', methods=['GET'])
@login_required
def security_profile_view():
    """Obtenir le profil de sécurité de l'utilisateur"""
    security_profile = SecurityProfile.query.filter_by(
        utilisateur_id=current_user.utilisateur_id
    ).first()

    if not security_profile:
        security_profile = SecurityProfile(utilisateur_id=current_user.utilisateur_id)
        db.session.add(security_profile)
        db.session.commit()

    return jsonify({
        "success": True,
        "profile": {
            "identite_verifiee": security_profile.identite_verifiee,
            "verification_date": security_profile.verification_date.isoformat() if security_profile.verification_date else None,
            "verification_expires": security_profile.verification_expires.isoformat() if security_profile.verification_expires else None,
            "is_2fa_enabled": security_profile.is_2fa_enabled,
            "failed_login_attempts": security_profile.failed_login_attempts,
            "active_sessions": len(security_profile.active_sessions or []),
            "last_security_alert": security_profile.last_security_alert.isoformat() if security_profile.last_security_alert else None
        }
    })


@security_bp.route('/audit-log', methods=['GET'])
@login_required
def view_audit_log():
    """Voir son propre journal d'audit"""
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)

    logs = AuditLog.query.filter_by(
        utilisateur_id=current_user.utilisateur_id
    ).order_by(AuditLog.timestamp.desc()).limit(limit).offset(offset).all()

    return jsonify({
        "success": True,
        "logs": [
            {
                "id": log.id,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "status": log.status,
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.isoformat()
            }
            for log in logs
        ]
    })
