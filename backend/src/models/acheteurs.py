"""
Modèle SQLAlchemy pour les acheteurs (buyers).

Représente un profil d'acheteur avec ses critères de recherche immobilière.
"""

from datetime import datetime
from sqlalchemy import Index, CheckConstraint, ForeignKey
from src.auth.models import db


class Acheteur(db.Model):
    """
    Modèle acheteur mappé à la table 'acheteurs' de PostgreSQL.

    Attributes:
        acheteur_id (int): Identifiant unique (PK, SERIAL).
        utilisateur_id (int): FK vers utilisateurs.user_id (UNIQUE).

        budget_max (float): Budget maximum en euros (> 0).
        ville_recherchee (str): Ville principale de recherche (exact match).
        surface_min (int): Surface minimale requise en m².
        type_bien_recherche (str): Type de bien recherché (appartement, maison, terrain, etc.).

        nombre_pieces_min (int, optional): Nombre de pièces minimum.
        dpe_ideale (str, optional): Classe énergétique idéale (A-G).

        date_creation (datetime): Date de création du profil acheteur.
        date_modification (datetime): Date de dernière modification.
        actif (bool): Profil actif (True) ou inactif (False).
    """

    __tablename__ = "acheteurs"

    # Clé primaire
    acheteur_id = db.Column(db.Integer, primary_key=True)

    # Foreign key vers l'utilisateur
    utilisateur_id = db.Column(
        db.Integer,
        db.ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # Un acheteur par utilisateur
        index=True,
    )

    # Critères de recherche (obligatoires)
    budget_max = db.Column(db.Numeric(12, 2), nullable=False)  # En euros
    ville_recherchee = db.Column(db.String(100), nullable=False, index=True)
    surface_min = db.Column(db.Integer, nullable=False)  # En m²
    type_bien_recherche = db.Column(
        db.String(50),
        nullable=False,
        index=True,
        default="appartement",
        # Valeurs: appartement, maison, terrain, commercial, garage, parking
    )

    # Critères optionnels
    nombre_pieces_min = db.Column(db.Integer, nullable=True)
    dpe_ideale = db.Column(db.String(1), nullable=True)  # A, B, C, D, E, F, G

    # Métadonnées
    date_creation = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    date_modification = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    actif = db.Column(db.Boolean, default=True, index=True)

    # Contraintes de validation
    __table_args__ = (
        CheckConstraint("budget_max > 0", name="ck_budget_max_positive"),
        CheckConstraint("surface_min > 0", name="ck_surface_min_positive"),
    )

    def to_dict(self):
        """Convertir en dictionnaire pour la sérialisation JSON."""
        return {
            "acheteur_id": self.acheteur_id,
            "utilisateur_id": self.utilisateur_id,
            "budget_max": float(self.budget_max) if self.budget_max else 0,
            "ville_recherchee": self.ville_recherchee,
            "surface_min": self.surface_min,
            "type_bien_recherche": self.type_bien_recherche,
            "nombre_pieces_min": self.nombre_pieces_min,
            "dpe_ideale": self.dpe_ideale,
            "actif": self.actif,
            "date_creation": self.date_creation.isoformat() if self.date_creation else None,
        }

    def __repr__(self):
        return f"<Acheteur {self.acheteur_id}: {self.utilisateur_id} - {self.ville_recherchee} max {self.budget_max}€>"
