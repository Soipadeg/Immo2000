"""
Modèle SQLAlchemy pour les offres d'achat.

Permet aux acheteurs de faire des offres sur les annonces.
Gère le parcours complet : PROPOSEE → ACCEPTEE → NEGOCIATION → (ACCEPTEE ou REFUSEE) → TRANSACTION
"""

from datetime import datetime, timedelta
from sqlalchemy import Index, ForeignKey, Enum as SQLEnum, Text
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
    TRANSACTION_EN_COURS = "transaction_en_cours"
    FINALISEE = "finalisee"
    ECHOUEE = "echouee"


class Offre(db.Model):
    """
    Modèle offre d'achat mappé à la table 'offres' de PostgreSQL.

    Permet aux acheteurs de faire des offres sur les annonces.
    Gère le parcours complet du processus de vente.

    Attributes:
        offre_id (int): Identifiant unique (PK).
        annonce_id (int): FK vers annonces.annonce_id.
        acheteur_id (int): FK vers utilisateurs.utilisateur_id (acheteur).
        vendeur_id (int): FK vers utilisateurs.utilisateur_id (vendeur, dénormalisé).
        prix_propose (float): Prix proposé en euros.
        statut (str): Statut de l'offre (enum).
        message (str): Message accompagnant l'offre.
        conditions_suspensives (str): Conditions suspensives (obtention prêt, etc.)
        contre_proposition (float): Prix contre-proposé (en cas de négociation).
        date_offre (datetime): Date de la proposition.
        date_reponse (datetime): Date de réponse du vendeur.
        date_expiration (datetime): Date d'expiration de l'offre.
        date_acceptation (datetime): Date d'acceptation (si acceptée).
        conditions (dict): Conditions spéciales (JSON).
        transaction_notaire_id (int): FK vers transaction_notaire (optionnel, après acceptation).
    """

    __tablename__ = "offres"

    offre_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Foreign keys
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

    # Dénormalisé pour plus facile accès au vendeur
    vendeur_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # FK vers transaction (créée après acceptation)
    transaction_notaire_id = db.Column(
        db.Integer,
        ForeignKey("transaction_notaire.transaction_notaire_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Prix et conditions
    prix_propose = db.Column(db.Numeric(12, 2), nullable=False)
    statut = db.Column(db.String(50), default="proposee", nullable=False, index=True)
    message = db.Column(db.String(1000), nullable=True)
    conditions_suspensives = db.Column(Text, nullable=True)
    contre_proposition = db.Column(db.Numeric(12, 2), nullable=True)

    # Conditions spéciales (JSON)
    conditions = db.Column(db.JSON, nullable=True, default={})

    # Dates clés
    date_offre = db.Column(
        db.DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    date_reponse = db.Column(db.DateTime(timezone=True), nullable=True)
    date_expiration = db.Column(db.DateTime(timezone=True), nullable=True)
    date_acceptation = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    annonce = relationship("Annonce", backref="offres", foreign_keys=[annonce_id])
    acheteur = relationship("User", foreign_keys=[acheteur_id], backref="offres_envoyees")
    vendeur = relationship("User", foreign_keys=[vendeur_id], backref="offres_recues")
    transaction = relationship("TransactionNotaire", foreign_keys=[transaction_notaire_id])

    # Indices de performance
    __table_args__ = (
        Index('idx_offres_annonce_statut', 'annonce_id', 'statut'),
        Index('idx_offres_acheteur_statut', 'acheteur_id', 'statut'),
        Index('idx_offres_vendeur_statut', 'vendeur_id', 'statut'),
        Index('idx_offres_date_creation', 'date_offre'),
    )

    def __repr__(self) -> str:
        """Représentation lisible de l'offre."""
        return f"<Offre {self.offre_id} {self.statut} ({self.prix_propose}€)>"

    def to_dict(self) -> dict:
        """Sérialisation pour API."""
        return {
            'offre_id': self.offre_id,
            'annonce_id': self.annonce_id,
            'acheteur_id': self.acheteur_id,
            'vendeur_id': self.vendeur_id,
            'prix_propose': float(self.prix_propose),
            'contre_proposition': float(self.contre_proposition) if self.contre_proposition else None,
            'statut': self.statut,
            'message': self.message,
            'conditions_suspensives': self.conditions_suspensives,
            'date_offre': self.date_offre.isoformat() if self.date_offre else None,
            'date_reponse': self.date_reponse.isoformat() if self.date_reponse else None,
            'date_expiration': self.date_expiration.isoformat() if self.date_expiration else None,
            'date_acceptation': self.date_acceptation.isoformat() if self.date_acceptation else None,
            'transaction_notaire_id': self.transaction_notaire_id,
        }

    def set_expiration_24h(self) -> None:
        """Définit la date d'expiration à 24h après création."""
        self.date_expiration = datetime.utcnow() + timedelta(hours=24)

    def is_expired(self) -> bool:
        """Vérifie si l'offre a expiré."""
        if not self.date_expiration:
            return False
        return datetime.utcnow() > self.date_expiration
