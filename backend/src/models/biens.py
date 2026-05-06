"""
Modèle SQLAlchemy pour les biens immobiliers.

Représente un bien immobilier avec ses caractéristiques principales.
Un bien appartient à un vendeur (User) et peut avoir plusieurs annonces.
"""

from datetime import datetime
from src.auth.models import db


class Bien(db.Model):
    """Modèle pour les biens immobiliers."""

    __tablename__ = "biens"

    # Clé primaire
    bien_id = db.Column(db.Integer, primary_key=True)

    # Foreign key vers l'utilisateur propriétaire
    utilisateur_id = db.Column(db.Integer, db.ForeignKey("utilisateurs.utilisateur_id"), nullable=False, index=True)

    # Localisation
    adresse = db.Column(db.String(255), nullable=False)
    code_postal = db.Column(db.String(10), nullable=False, index=True)
    ville = db.Column(db.String(100), nullable=False, index=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    # Caractéristiques du bien
    type_bien = db.Column(
        db.String(50),
        nullable=False,
        index=True,
        default="appartement"
        # Valeurs possibles: appartement, maison, terrain, commercial, garage, parking
    )
    surface = db.Column(db.Integer, nullable=False)  # En m²
    nombre_pieces = db.Column(db.Integer, nullable=True)
    nombre_chambres = db.Column(db.Integer, nullable=True)
    nombre_salles_bain = db.Column(db.Integer, nullable=True)
    etage = db.Column(db.Integer, nullable=True)
    date_construction = db.Column(db.Integer, nullable=True)  # Année

    # Description et détails
    description = db.Column(db.Text, nullable=True)
    prix_demande = db.Column(db.Numeric(12, 2), nullable=True)

    # État du bien
    etat = db.Column(
        db.String(50),
        nullable=False,
        default="bon",
        index=True
        # Valeurs possibles: excellent, bon, moyen, mauvais, renovation_requise
    )

    # Caractéristiques supplémentaires (JSON stocké comme string)
    equipements = db.Column(db.Text, nullable=True)  # JSON: ["terrasse", "garage", "ascenseur", ...]
    commodites = db.Column(db.Text, nullable=True)  # JSON: ["metro", "ecole", "commerce", ...]

    # Métadonnées
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    date_modification = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    actif = db.Column(db.Boolean, nullable=False, default=True, index=True)

    # Contraintes
    __table_args__ = (
        db.CheckConstraint("surface > 0", name="check_surface_positive"),
        db.CheckConstraint("nombre_pieces >= 0", name="check_pieces_positive"),
        db.CheckConstraint("nombre_chambres >= 0", name="check_bedrooms_positive"),
        db.Index("idx_bien_utilisateur_actif", "utilisateur_id", "actif"),
        db.Index("idx_bien_type_ville", "type_bien", "ville"),
    )

    def to_dict(self):
        """Convertir le modèle en dictionnaire."""
        return {
            "bien_id": self.bien_id,
            "utilisateur_id": self.utilisateur_id,
            "adresse": self.adresse,
            "code_postal": self.code_postal,
            "ville": self.ville,
            "type_bien": self.type_bien,
            "surface": self.surface,
            "nombre_pieces": self.nombre_pieces,
            "nombre_chambres": self.nombre_chambres,
            "nombre_salles_bain": self.nombre_salles_bain,
            "etage": self.etage,
            "date_construction": self.date_construction,
            "description": self.description,
            "prix_demande": float(self.prix_demande) if self.prix_demande else None,
            "etat": self.etat,
            "equipements": self.equipements,
            "commodites": self.commodites,
            "date_creation": self.date_creation.isoformat(),
            "date_modification": self.date_modification.isoformat(),
            "actif": self.actif,
        }

    def __repr__(self):
        return f"<Bien {self.bien_id}: {self.type_bien} at {self.adresse}>"
