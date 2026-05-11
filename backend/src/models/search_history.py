"""
Modèle SQLAlchemy pour l'historique des recherches.

Permet de tracker les recherches effectuées par les acheteurs.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey
from src.auth.models import db


class SearchHistory(db.Model):
    """
    Modèle historique de recherche mappé à la table 'search_history' de PostgreSQL.

    Permet de tracker les recherches pour les analytics et recommandations.

    Attributes:
        search_id (int): Identifiant unique (PK).
        user_id (int): FK vers utilisateurs.utilisateur_id (optionnel).
        ville (str): Ville recherchée.
        type_bien (str): Type de bien recherché.
        budget_min (float): Budget minimum.
        budget_max (float): Budget maximum.
        surface_min (float): Surface minimum en m².
        surface_max (float): Surface maximum en m².
        pieces_min (int): Nombre minimum de pièces.
        date_search (datetime): Date de la recherche.
        nombre_resultats (int): Nombre de résultats trouvés.
    """

    __tablename__ = "search_history"

    search_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    user_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    ville = db.Column(db.String(100), nullable=True)
    type_bien = db.Column(db.String(50), nullable=True)
    budget_min = db.Column(db.Float, nullable=True)
    budget_max = db.Column(db.Float, nullable=True)
    surface_min = db.Column(db.Float, nullable=True)
    surface_max = db.Column(db.Float, nullable=True)
    pieces_min = db.Column(db.Integer, nullable=True)

    date_search = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, index=True)
    nombre_resultats = db.Column(db.Integer, default=0)

    def __repr__(self) -> str:
        """Représentation lisible de la recherche."""
        return f"<SearchHistory {self.ville} ({self.type_bien}) at {self.date_search}>"
