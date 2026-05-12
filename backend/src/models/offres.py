"""
Modèle SQLAlchemy pour les offres d'achat.

Permet aux acheteurs de faire des offres sur les annonces.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from src.auth.models import db


class OffreStatus(str, enum.Enum):
    """Statuts possibles d'une offre."""
    PROPOSEE = "proposee"
    ACCEPTEE = "acceptee"
    REFUSEE = "refusee"
    NEGOCIATION = "negociation"
    RETIREE = "retiree"
    FINALISEE = "finalisee"


class Offre(db.Model):
    """
    Modèle offre d'achat mappé à la table 'offres' de PostgreSQL.

    Permet aux acheteurs de faire des offres sur les annonces.

    Attributes:
        offre_id (int): Identifiant unique (PK).
        annonce_id (int): FK vers annonces.annonce_id.
        acheteur_id (int): FK vers utilisateurs.utilisateur_id (acheteur).
        prix_propose (float): Prix proposé en euros.
        statut (str): Statut de l'offre (proposee, acceptee, refusee, negociation, retiree, finalisee).
        message (str): Message accompagnant l'offre.
        date_offre (datetime): Date de la proposition.
        date_reponse (datetime): Date de réponse du vendeur (optionnel).
        conditions (dict): Conditions spéciales (JSON).
    """

    __tablename__ = "offres"

    offre_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

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

    prix_propose = db.Column(db.Float, nullable=False)
    statut = db.Column(db.String(50), default="proposee", index=True)
    message = db.Column(db.String(1000), nullable=True)

    date_offre = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, index=True)
    date_reponse = db.Column(db.DateTime(timezone=True), nullable=True)

    conditions = db.Column(db.JSON, nullable=True, default={})

    # Relationships
    annonce = relationship("Annonce", backref="offres")
    acheteur = relationship("User", foreign_keys=[acheteur_id])

    def __repr__(self) -> str:
        """Représentation lisible de l'offre."""
        return f"<Offre {self.offre_id} {self.statut} ({self.prix_propose}€)>"
