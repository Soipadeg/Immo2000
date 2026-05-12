"""
Modèle SQLAlchemy pour la table visites.

Représente les réservations de visites entre acheteurs et annonces.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey, UniqueConstraint
from src.auth.models import db


class Visite(db.Model):
    """
    Modèle visite immobilière mappé à la table 'visites' de PostgreSQL.

    Attributes:
        id (int): Identifiant unique (PK, SERIAL).
        acheteur_id (int): FK vers acheteurs.id.
        annonce_id (int): FK vers annonces.annonce_id.
        date_heure (datetime): Date et heure de la visite en format ISO 8601.
        statut (str): État de la visite ('confirmee', 'annulee', 'terminee').
        created_at (datetime): Date de création de la réservation (auto-générée).
        updated_at (datetime): Dernière mise à jour de la réservation.

    Constraints:
        - UNIQUE(annonce_id, date_heure): Une seule visite par annonce à une date/heure donnée.
        - Relation ForeignKey avec acheteurs et annonces (CASCADE delete).
    """

    __tablename__ = "visites"

    # Clé primaire
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Clés étrangères
    acheteur_id = db.Column(
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

    # Données principales
    date_heure = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        index=True
    )

    statut = db.Column(
        db.String(20),
        nullable=False,
        default="confirmee",
        index=True,
        comment="'confirmee', 'annulee', ou 'terminee'"
    )

    # Métadonnées
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Constraints
    __table_args__ = (
        UniqueConstraint("annonce_id", "date_heure", name="unique_visite_per_annonce_datetime"),
        Index("idx_visites_annonce_statut", "annonce_id", "statut"),
    )

    # Relations (optionnel, pour accès facile)
    # acheteur = db.relationship("Acheteur", backref="visites")
    # annonce = db.relationship("Annonce", backref="visites")

    def __repr__(self):
        return f"<Visite id={self.id} acheteur={self.acheteur_id} annonce={self.annonce_id} statut={self.statut}>"

    def to_dict(self):
        """Convertir le modèle en dictionnaire."""
        return {
            "id": self.id,
            "acheteur_id": self.acheteur_id,
            "annonce_id": self.annonce_id,
            "date_heure": self.date_heure.isoformat() if self.date_heure else None,
            "statut": self.statut,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
