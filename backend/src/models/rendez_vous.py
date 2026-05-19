"""
Modèle SQLAlchemy pour la table rendez_vous.

Représente les rendez-vous de visite entre acheteurs et vendeurs.
Intégré avec le système de créneaux disponibles.
"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Index, ForeignKey, Enum, Text
from src.auth.models import db


class StatutRDV(str, PyEnum):
    """Énumération des statuts possibles pour un rendez-vous."""
    EN_ATTENTE = "en_attente"  # Demande envoyée, en attente de réponse du vendeur
    ACCEPTE = "accepte"        # Accepté par le vendeur
    REFUSE = "refuse"          # Refusé et nouveau créneau proposé
    ANNULE = "annule"          # Annulé par l'une des parties


class RendezVous(db.Model):
    """
    Modèle rendez-vous de visite immobilière.

    Attributes:
        rdv_id (int): Identifiant unique (PK).
        annonce_id (int): FK vers l'annonce concernée.
        acheteur_id (int): FK vers l'utilisateur acheteur.
        vendeur_id (int): FK vers l'utilisateur vendeur.
        creneau_id (int): FK vers le créneau proposé.

        statut (str): État du RDV
            - 'en_attente': Acheteur a proposé, vendeur n'a pas réagi
            - 'accepte': Date/heure acceptée par le vendeur
            - 'refuse': Refusé, nouveau créneau proposé
            - 'annule': Annulé par l'une des parties

        message (str): Message optionnel de l'acheteur pour le vendeur
        date_proposée (datetime): Date/heure actuellement proposée (copie du créneau)
        date_confirmée (datetime): Date/heure acceptée par le vendeur

        date_création (datetime): Quand le RDV a été créé
        date_dernière_modification (datetime): Dernière action
    """

    __tablename__ = "rendez_vous"

    # Clé primaire
    rdv_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Clés étrangères
    annonce_id = db.Column(
        db.Integer,
        ForeignKey("annonces.annonce_id", ondelete="CASCADE"),
        nullable=False,
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
    creneau_id = db.Column(
        db.Integer,
        ForeignKey("creneaux_disponibles.id", ondelete="SET NULL"),
        nullable=True
    )

    # Champs de statut et dates
    statut = db.Column(
        Enum(StatutRDV),
        nullable=False,
        default=StatutRDV.EN_ATTENTE,
        index=True
    )
    message = db.Column(Text, nullable=True)  # Message optionnel de l'acheteur
    date_proposée = db.Column(db.DateTime(timezone=True), nullable=True)
    date_confirmée = db.Column(db.DateTime(timezone=True), nullable=True)

    # Rappels
    rappel_envoye = db.Column(db.Boolean, default=False, index=True)
    date_rappel_envoi = db.Column(db.DateTime(timezone=True), nullable=True)

    # Métadonnées
    date_création = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    date_dernière_modification = db.Column(
        db.DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Indexes
    __table_args__ = (
        Index("idx_annonce_statut", "annonce_id", "statut"),
        Index("idx_acheteur_statut", "acheteur_id", "statut"),
        Index("idx_vendeur_statut", "vendeur_id", "statut"),
        Index("idx_creneau", "creneau_id"),
    )

    # === RELATIONS ===
    # Annonce concernée
    annonce = db.relationship(
        "Annonce",
        foreign_keys=[annonce_id],
        back_populates="rendez_vous",
        lazy="joined"
    )

    # Utilisateur acheteur
    acheteur = db.relationship(
        "User",
        foreign_keys=[acheteur_id],
        back_populates="rdv_en_tant_que_acheteur",
        lazy="joined"
    )

    # Utilisateur vendeur
    vendeur = db.relationship(
        "User",
        foreign_keys=[vendeur_id],
        back_populates="rdv_en_tant_que_vendeur",
        lazy="joined"
    )

    def __repr__(self) -> str:
        """Représentation lisible du RDV."""
        return f"<RendezVous {self.rdv_id}: Annonce {self.annonce_id} ({self.statut.value if isinstance(self.statut, StatutRDV) else self.statut})>"

    def to_dict(self) -> dict:
        """Convertir le RDV en dictionnaire."""
        return {
            "rdv_id": self.rdv_id,
            "annonce_id": self.annonce_id,
            "acheteur_id": self.acheteur_id,
            "vendeur_id": self.vendeur_id,
            "creneau_id": self.creneau_id,
            "statut": self.statut.value if isinstance(self.statut, StatutRDV) else self.statut,
            "message": self.message,
            "date_proposée": self.date_proposée.isoformat() if self.date_proposée else None,
            "date_confirmée": self.date_confirmée.isoformat() if self.date_confirmée else None,
            "rappel_envoye": self.rappel_envoye,
            "date_rappel_envoi": self.date_rappel_envoi.isoformat() if self.date_rappel_envoi else None,
            "date_création": self.date_création.isoformat(),
            "date_dernière_modification": self.date_dernière_modification.isoformat(),
        }
