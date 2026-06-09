"""
Modèle SQLAlchemy pour la table messages.

Représente les messages entre utilisateurs pour discuter des annonces.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey
from sqlalchemy.orm import relationship
from src.auth.models import db


class Message(db.Model):
    """
    Modèle message immobilier mappé à la table 'messages' de PostgreSQL.

    Attributes:
        message_id (int): Identifiant unique (PK, SERIAL).

        # Champs obligatoires
        sender_id (int): FK vers utilisateurs.utilisateur_id (expéditeur).
        receiver_id (int): FK vers utilisateurs.utilisateur_id (destinataire).
        annonce_id (int): FK vers annonces.annonce_id (bien concerné).
        contenu (str): Contenu du message.
        date_creation (datetime): Date de création (auto-générée).

        # Champs optionnels
        lu (bool): Message lu ou non (default: False).
        date_lecture (datetime): Date de lecture (optionnel).
        supprime_par_expediteur (bool): Message supprimé par expéditeur (default: False).
        supprime_par_destinataire (bool): Message supprimé par destinataire (default: False).
    """

    __tablename__ = "messages"

    # Clé primaire
    message_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Clés étrangères
    sender_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    receiver_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    annonce_id = db.Column(
        db.Integer,
        ForeignKey("annonces.annonce_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # TODO: conversation_id commented out - waiting for Conversation model
    # conversation_id = db.Column(
    #     db.Integer,
    #     ForeignKey("conversations.conversation_id", ondelete="CASCADE"),
    #     nullable=True,
    #     index=True
    # )

    # Contenu
    contenu = db.Column(db.String(2000), nullable=False)

    # Métadonnées
    date_creation = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, index=True)
    lu = db.Column(db.Boolean, default=False, index=True)
    date_lecture = db.Column(db.DateTime(timezone=True), nullable=True)
    supprime_par_expediteur = db.Column(db.Boolean, default=False)
    supprime_par_destinataire = db.Column(db.Boolean, default=False)

    # Relations
    # TODO: Uncomment when Conversation model is created
    # conversation = relationship("Conversation", back_populates="messages", foreign_keys=[conversation_id])

    # Phase 3.1: Performance indexes (composites)
    __table_args__ = (
        Index('idx_messages_receiver_unread', 'receiver_id', 'lu'),  # Unread messages count
        Index('idx_messages_receiver_date', 'receiver_id', 'date_creation'),  # Message history ordered
    )

    def __repr__(self) -> str:
        """Représentation lisible du message."""
        return f"<Message {self.message_id} from {self.sender_id} to {self.receiver_id}>"

    def mark_as_read(self) -> None:
        """
        Marque le message comme lu.

        À appeler avant commit/flush.
        """
        self.lu = True
        self.date_lecture = datetime.utcnow()
