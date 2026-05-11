"""
Modèle SQLAlchemy pour tracker les vues d'annonces.

Permet d'avoir des analytics sur les vues et l'engagement.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey
from src.auth.models import db


class AnnonceView(db.Model):
    """
    Modèle vue d'annonce mappé à la table 'annonce_views' de PostgreSQL.

    Permet de tracker les vues et d'avoir des analytics.

    Attributes:
        view_id (int): Identifiant unique (PK).
        annonce_id (int): FK vers annonces.annonce_id.
        user_id (int): FK vers utilisateurs.utilisateur_id (optionnel, peut être NULL).
        ip_address (str): Adresse IP du visiteur (pour les non-connectés).
        date_view (datetime): Date de la vue.
        duree_vue (int): Durée de la vue en secondes (optionnel).
        source (str): Source (direct, search, link, email, etc.).
    """

    __tablename__ = "annonce_views"

    view_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    annonce_id = db.Column(
        db.Integer,
        ForeignKey("annonces.annonce_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    user_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    ip_address = db.Column(db.String(45), nullable=True)
    date_view = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, index=True)
    duree_vue = db.Column(db.Integer, nullable=True)  # en secondes
    source = db.Column(db.String(50), default="direct")  # direct, search, link, email, etc.

    def __repr__(self) -> str:
        """Représentation lisible de la vue."""
        return f"<AnnonceView {self.annonce_id} at {self.date_view}>"
