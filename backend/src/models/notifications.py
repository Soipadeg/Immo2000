"""
Modèle SQLAlchemy pour les notifications utilisateur.

Permet de stocker et gérer les notifications envoyées aux utilisateurs.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey, Enum as SqlEnum
from src.auth.models import db
import enum


class NotificationType(enum.Enum):
    """Types de notifications disponibles"""
    # Annonces
    ANNONCE_CREATED = "annonce_created"  # Une nouvelle annonce a été créée
    ANNONCE_UPDATED = "annonce_updated"  # Une annonce a été modifiée
    ANNONCE_DELETED = "annonce_deleted"  # Une annonce a été supprimée

    # Alertes
    ALERTE_MATCHED = "alerte_matched"  # Une alerte a trouvé une nouvelle annonce

    # Offres
    OFFER_RECEIVED = "offer_received"  # Une offre a été reçue
    OFFER_ACCEPTED = "offer_accepted"  # Une offre a été acceptée
    OFFER_REJECTED = "offer_rejected"  # Une offre a été rejetée

    # Messages
    MESSAGE_RECEIVED = "message_received"  # Un nouveau message reçu

    # Favoris
    FAVORI_ANNONCE_UPDATED = "favori_annonce_updated"  # Une annonce en favori a changé

    # Notaire
    NOTAIRE_ASSIGNED = "notaire_assigned"  # Un notaire a été assigné
    DOCUMENT_REQUESTED = "document_requested"  # Un document est demandé
    DOCUMENT_VALIDATED = "document_validated"  # Un document a été validé

    # Système
    ACCOUNT_VERIFIED = "account_verified"  # Compte vérifié
    PASSWORD_CHANGED = "password_changed"  # Mot de passe changé


class Notification(db.Model):
    """
    Modèle notification mappé à la table 'notifications' de PostgreSQL.

    Permet de stocker toutes les notifications envoyées aux utilisateurs
    et de suivre leur état de lecture.

    Attributes:
        notification_id (int): Identifiant unique (PK).
        user_id (int): FK vers utilisateurs.utilisateur_id.
        type (str): Type de notification (enum NotificationType).
        title (str): Titre de la notification.
        message (str): Corps du message.

        # Lien vers l'entité concernée (optionnel)
        related_entity_type (str): Type d'entité (annonce, offre, message, alerte, etc.).
        related_entity_id (int): ID de l'entité concernée.

        # Métadonnées
        is_read (bool): Si la notification a été lue.
        created_at (datetime): Date de création.
        read_at (datetime): Date de lecture (None si non lue).
        action_url (str): URL pour l'action (optionnel).
        icon (str): Icon/emoji pour affichage (optionnel).
    """

    __tablename__ = "notifications"

    notification_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    user_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    type = db.Column(
        SqlEnum(NotificationType),
        nullable=False,
        index=True,
        default=NotificationType.ACCOUNT_VERIFIED
    )

    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)

    # Lien vers l'entité concernée
    related_entity_type = db.Column(db.String(50), nullable=True)  # "annonce", "offre", "message", etc.
    related_entity_id = db.Column(db.Integer, nullable=True)

    # État de la notification
    is_read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, index=True)
    read_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Optionnels
    action_url = db.Column(db.String(500), nullable=True)  # URL pour effectuer l'action
    icon = db.Column(db.String(50), nullable=True)  # Emoji ou icon name

    # Index pour optimiser les requêtes courantes
    __table_args__ = (
        Index('idx_user_created', 'user_id', 'created_at'),
        Index('idx_user_is_read', 'user_id', 'is_read'),
        Index('idx_related_entity', 'related_entity_type', 'related_entity_id'),
    )

    def __repr__(self):
        return f"<Notification {self.notification_id} - {self.type} - User {self.user_id}>"

    def to_dict(self):
        """Convertir en dictionnaire pour la sérialisation JSON"""
        return {
            'notification_id': self.notification_id,
            'user_id': self.user_id,
            'type': self.type.value if self.type else None,
            'title': self.title,
            'message': self.message,
            'related_entity_type': self.related_entity_type,
            'related_entity_id': self.related_entity_id,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'action_url': self.action_url,
            'icon': self.icon,
        }
