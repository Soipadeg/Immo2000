"""
Modèle Conversation pour gérer les conversations liées aux rendez-vous.

Une conversation est créée automatiquement quand un RDV est accepté.
Elle lie l'acheteur et le vendeur pour discuter du bien et des détails de la visite.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from src.auth.models import db


class Conversation(db.Model):
    """
    Représente une conversation entre un acheteur et un vendeur pour un RDV.

    Une conversation est associée à un RDV accepté.
    Les messages y sont rangés de manière organisée.

    Attributes:
        conversation_id (int): Identifiant unique.
        rdv_id (int): FK vers le rendez-vous associé (1-to-1, unique).
        acheteur_id (int): ID de l'acheteur (dénormalisé pour optimiser les requêtes).
        vendeur_id (int): ID du vendeur (dénormalisé pour optimiser les requêtes).
        date_creation (datetime): Quand la conversation a été créée.
        messages (relationship): Liste des messages de la conversation.
    """

    __tablename__ = "conversations"

    conversation_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    rdv_id = db.Column(
        db.Integer,
        ForeignKey("rendez_vous.rdv_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )
    acheteur_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    vendeur_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    date_creation = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relations
    rendez_vous = relationship("RendezVous", back_populates="conversation", foreign_keys=[rdv_id])
