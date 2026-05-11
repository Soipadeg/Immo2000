"""
Modèle SQLAlchemy pour les favoris.

Permet aux acheteurs de marquer des annonces comme favorites.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey, UniqueConstraint
from src.auth.models import db


class Favori(db.Model):
    """
    Modèle favori mappé à la table 'favoris' de PostgreSQL.

    Permet aux acheteurs de marquer des annonces comme favorites.

    Attributes:
        favori_id (int): Identifiant unique (PK).
        user_id (int): FK vers utilisateurs.utilisateur_id (acheteur).
        annonce_id (int): FK vers annonces.annonce_id.
        date_ajout (datetime): Date d'ajout au favori.
        note (int): Note personnelle (1-5, optionnel).
        commentaire (str): Commentaire personnel (optionnel).
    """

    __tablename__ = "favoris"

    favori_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    user_id = db.Column(
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

    date_ajout = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, index=True)
    note = db.Column(db.Integer, nullable=True)  # 1-5 stars
    commentaire = db.Column(db.String(500), nullable=True)

    # Contrainte unique : chaque utilisateur ne peut avoir qu'une seule fois chaque annonce en favori
    __table_args__ = (UniqueConstraint('user_id', 'annonce_id', name='unique_user_annonce_favori'),)

    def __repr__(self) -> str:
        """Représentation lisible du favori."""
        return f"<Favori user_id={self.user_id} annonce_id={self.annonce_id}>"
