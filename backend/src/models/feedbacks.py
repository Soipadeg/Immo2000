"""
Modèle SQLAlchemy pour la table feedbacks.

Représente les avis post-visite laissés par les acheteurs.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey
from src.auth.models import db


class Feedback(db.Model):
    """
    Modèle feedback mappé à la table 'feedbacks' de PostgreSQL.

    Attributes:
        id (int): Identifiant unique (PK, SERIAL).
        visite_id (int): FK vers visites.id.
        acheteur_id (int): FK vers acheteurs.id.
        note (int): Note de 1 à 5 étoiles.
        commentaire (str): Avis textuel de l'acheteur.
        reponse_vendeur (str): Réponse optionnelle du vendeur.
        created_at (datetime): Date de création du feedback.
        updated_at (datetime): Dernière mise à jour.

    Constraints:
        - CHECK (note BETWEEN 1 AND 5): Note entre 1 et 5.
        - UNIQUE (visite_id, acheteur_id): 1 feedback max par visite/acheteur.
        - ForeignKey avec visites et acheteurs (CASCADE delete).
    """

    __tablename__ = "feedbacks"

    # Clé primaire
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Clés étrangères
    visite_id = db.Column(
        db.Integer,
        ForeignKey("visites.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    acheteur_id = db.Column(
        db.Integer,
        ForeignKey("acheteurs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Données principales
    note = db.Column(
        db.Integer,
        nullable=False,
        # Note: SQLAlchemy doesn't enforce CHECK constraints, but PostgreSQL will
    )

    commentaire = db.Column(db.Text, nullable=True)

    reponse_vendeur = db.Column(db.Text, nullable=True)

    # Timestamps
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        index=True
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        """Convertir le feedback en dictionnaire JSON."""
        return {
            "id": self.id,
            "visite_id": self.visite_id,
            "acheteur_id": self.acheteur_id,
            "note": self.note,
            "commentaire": self.commentaire,
            "reponse_vendeur": self.reponse_vendeur,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
