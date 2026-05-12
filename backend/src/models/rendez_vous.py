"""
Modèle SQLAlchemy pour la table rendez_vous.

Représente les rendez-vous de visite entre acheteurs et vendeurs.
Gère la négociation de date/heure et le statut de confirmation.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey
from src.auth.models import db


class RendezVous(db.Model):
    """
    Modèle rendez-vous de visite immobilière.

    Attributes:
        rdv_id (int): Identifiant unique (PK).
        annonce_id (int): FK vers l'annonce concernée.
        acheteur_id (int): FK vers l'utilisateur acheteur.
        vendeur_id (int): FK vers l'utilisateur vendeur.

        statut (str): État du RDV
            - 'en_attente_vendeur': Acheteur a proposé, vendeur n'a pas réagi
            - 'en_attente_acheteur': Vendeur a contre-proposé, acheteur n'a pas réagi
            - 'confirmé': Date/heure acceptée par les 2
            - 'refusé': L'un des deux a refusé

        date_proposée (datetime): Date/heure actuellement proposée
        date_confirmée (datetime): Date/heure acceptée par les 2 (NULL si pas encore)

        message_dernier (str): Dernier message échangé (max 500 chars)
        dernier_proposant (str): 'acheteur' ou 'vendeur' - qui a proposé en dernier

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

    # Champs de statut et dates
    statut = db.Column(
        db.String(30),
        nullable=False,
        default="en_attente_vendeur",
        index=True
    )
    date_proposée = db.Column(db.DateTime(timezone=True), nullable=False)
    date_confirmée = db.Column(db.DateTime(timezone=True), nullable=True)

    # Messages et historique
    message_dernier = db.Column(db.String(500), nullable=True)
    dernier_proposant = db.Column(db.String(20), nullable=False, default="acheteur")

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
    )

    def __repr__(self) -> str:
        """Représentation lisible du RDV."""
        return f"<RendezVous {self.rdv_id}: Annonce {self.annonce_id} ({self.statut})>"

    def to_dict(self) -> dict:
        """Convertir le RDV en dictionnaire."""
        return {
            "rdv_id": self.rdv_id,
            "annonce_id": self.annonce_id,
            "acheteur_id": self.acheteur_id,
            "vendeur_id": self.vendeur_id,
            "statut": self.statut,
            "date_proposée": self.date_proposée.isoformat() if self.date_proposée else None,
            "date_confirmée": self.date_confirmée.isoformat() if self.date_confirmée else None,
            "message_dernier": self.message_dernier,
            "dernier_proposant": self.dernier_proposant,
            "rappel_envoye": self.rappel_envoye,
            "date_rappel_envoi": self.date_rappel_envoi.isoformat() if self.date_rappel_envoi else None,
            "date_création": self.date_création.isoformat(),
            "date_dernière_modification": self.date_dernière_modification.isoformat(),
        }
