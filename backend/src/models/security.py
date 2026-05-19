"""
Modèles SQLAlchemy pour la sécurité et conformité RGPD
"""

from datetime import datetime
from src.auth.models import db


class SecurityProfile(db.Model):
    """Profil de sécurité utilisateur"""
    __tablename__ = 'security_profiles'

    id = db.Column(db.Integer, primary_key=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.utilisateur_id'), unique=True, nullable=False)

    # Vérification d'identité
    identite_verifiee = db.Column(db.Boolean, default=False, index=True)
    verification_id = db.Column(db.String(500))  # ID de vérification (Yousign/Veriff)
    verification_method = db.Column(db.String(50))  # 'yousign' ou 'veriff'
    verification_date = db.Column(db.DateTime)
    verification_expires = db.Column(db.DateTime)

    # 2FA TOTP
    secret_2fa = db.Column(db.String(200))  # Secret TOTP (chiffré en pratique)
    is_2fa_enabled = db.Column(db.Boolean, default=False)
    backup_codes = db.Column(db.JSON)  # Codes de secours JSON

    # Suivi des appareils de confiance
    trusted_devices = db.Column(db.JSON, default=[])  # Liste des appareils de confiance
    last_device_id = db.Column(db.String(500))  # Hash du dernier appareil utilisé

    # Statistiques de sécurité
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_failed_login = db.Column(db.DateTime)
    account_locked_until = db.Column(db.DateTime)  # Verrouillage temporaire en cas d'attaque

    # Connexions actives
    active_sessions = db.Column(db.JSON, default=[])  # Sessions actives avec timestamps

    # Alertes de sécurité
    last_security_alert = db.Column(db.DateTime)
    security_alert_count = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    utilisateur = db.relationship('User', backref='security_profile')

    def __repr__(self):
        return f'<SecurityProfile user={self.utilisateur_id} 2fa={self.is_2fa_enabled} verified={self.identite_verifiee}>'


class AuditLog(db.Model):
    """Log d'audit pour traçabilité des actions sensibles"""
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.utilisateur_id'), index=True)
    action = db.Column(db.String(100), index=True, nullable=False)  # 'login', 'delete_data', 'sign_document', etc.
    action_category = db.Column(db.String(50))  # 'auth', 'data', 'transaction', 'admin'
    resource_type = db.Column(db.String(50))  # 'user', 'transaction', 'listing', 'offer'
    resource_id = db.Column(db.Integer)

    # Détails
    details = db.Column(db.JSON)  # Détails additionnels
    status = db.Column(db.String(20), default='success')  # 'success', 'failed', 'attempted'
    risk_level = db.Column(db.String(20), default='low')  # 'low', 'medium', 'high', 'critical'

    # Contexte
    ip_address = db.Column(db.String(45), index=True)
    user_agent = db.Column(db.String(500))
    country_code = db.Column(db.String(2))  # Pays détecté par IP

    # Timestamps
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    utilisateur = db.relationship('User', backref='audit_logs')

    def __repr__(self):
        return f'<AuditLog {self.action} {self.resource_type}/{self.resource_id}>'


class RGPDRequest(db.Model):
    """Demandes RGPD (suppression, export de données)"""
    __tablename__ = 'rgpd_requests'

    id = db.Column(db.Integer, primary_key=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.utilisateur_id'), nullable=False, index=True)
    request_type = db.Column(db.String(50), nullable=False)  # 'data_export', 'delete_account', 'anonymize'

    # Statut
    status = db.Column(db.String(50), default='pending')  # 'pending', 'confirmed', 'processing', 'completed', 'rejected'
    confirmation_token = db.Column(db.String(255), unique=True)
    confirmation_expires = db.Column(db.DateTime)

    # Résultats
    data_url = db.Column(db.String(500))  # URL de téléchargement pour export
    result = db.Column(db.JSON)  # Résultat de la suppression/anonymisation

    # Notes
    reason = db.Column(db.String(500))  # Raison fournie par l'utilisateur
    admin_notes = db.Column(db.String(500))

    # Timestamps
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    utilisateur = db.relationship('User', backref='rgpd_requests')

    def __repr__(self):
        return f'<RGPDRequest {self.request_type} user={self.utilisateur_id} status={self.status}>'


class IdentityVerificationLog(db.Model):
    """Log des vérifications d'identité"""
    __tablename__ = 'identity_verification_logs'

    id = db.Column(db.Integer, primary_key=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.utilisateur_id'), nullable=False, index=True)

    # Fournisseur
    provider = db.Column(db.String(50), nullable=False)  # 'yousign' ou 'veriff'
    verification_id = db.Column(db.String(500), unique=True)

    # Détails
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    document_type = db.Column(db.String(50))  # 'passport', 'id_card', 'driving_license'

    # Résultats
    status = db.Column(db.String(50), default='pending')  # 'pending', 'approved', 'rejected', 'expired'
    verification_data = db.Column(db.JSON)  # Données de vérification

    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)  # Expiration de la vérification (e.g., 5 ans)

    utilisateur = db.relationship('User', backref='identity_verifications')

    def __repr__(self):
        return f'<IdentityVerification user={self.utilisateur_id} provider={self.provider} status={self.status}>'


class SecurityEvent(db.Model):
    """Événements de sécurité pour détection des menaces"""
    __tablename__ = 'security_events'

    id = db.Column(db.Integer, primary_key=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.utilisateur_id'), index=True)

    # Type d'événement
    event_type = db.Column(db.String(50), nullable=False)  # 'failed_login', 'unusual_ip', 'rapid_actions', etc.
    severity = db.Column(db.String(20), default='medium')  # 'low', 'medium', 'high', 'critical'

    # Détails
    description = db.Column(db.String(500))
    details = db.Column(db.JSON)

    # IP et localisation
    ip_address = db.Column(db.String(45))
    country_code = db.Column(db.String(2))

    # Actions
    action_taken = db.Column(db.String(100))  # 'none', 'alert_user', 'lock_account', 'require_verification'

    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    utilisateur = db.relationship('User', backref='security_events')

    def __repr__(self):
        return f'<SecurityEvent {self.event_type} severity={self.severity}>'
