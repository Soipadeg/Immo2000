"""
Modèle SQLAlchemy pour la table photos.

Représente les photos/images associées à une annonce immobilière.
Une annonce peut avoir plusieurs photos, organisées par ordre de présentation.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey
from src.auth.models import db


class Photo(db.Model):
    """
    Modèle photo d'annonce mappé à la table 'photos' de PostgreSQL.

    Chaque photo est associée à une annonce spécifique.
    Les photos sont triées par ordre (0 = première photo = miniature).

    Attributes:
        photo_id (int): Identifiant unique (PK, SERIAL).
        annonce_id (int): FK vers annonces.annonce_id.
        url (str): URL/chemin de la photo (ex: /static/uploads/annonces/photo_uuid.jpg).
        nom_fichier (str): Nom d'origine du fichier uploadé.
        ordre (int): Ordre de présentation (0 = première/miniature, default: 0).
        largeur (int, optional): Largeur de l'image en pixels.
        hauteur (int, optional): Hauteur de l'image en pixels.
        taille_bytes (int, optional): Taille du fichier en bytes.
        date_upload (datetime): Date d'upload de la photo.
    """

    __tablename__ = "photos"

    # Clé primaire
    photo_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Clé étrangère vers annonces
    annonce_id = db.Column(
        db.Integer,
        ForeignKey("annonces.annonce_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Champs photos
    url = db.Column(db.String(500), nullable=False)  # Chemin ou URL de la photo
    nom_fichier = db.Column(db.String(255), nullable=False)  # Nom du fichier original
    ordre = db.Column(db.Integer, default=0, index=True)  # Ordre de présentation
    largeur = db.Column(db.Integer, nullable=True)  # Largeur en pixels
    hauteur = db.Column(db.Integer, nullable=True)  # Hauteur en pixels
    taille_bytes = db.Column(db.Integer, nullable=True)  # Taille du fichier

    # Métadonnées
    date_upload = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Index pour améliorer les requêtes
    __table_args__ = (
        Index("idx_annonce_ordre", "annonce_id", "ordre"),
    )

    def __repr__(self) -> str:
        """Représentation lisible de la photo."""
        return f"<Photo {self.photo_id} - Annonce {self.annonce_id} (ordre {self.ordre})>"

    def to_dict(self) -> dict:
        """
        Convertit la photo en dictionnaire JSON.

        Returns:
            dict: Dictionnaire avec les données de la photo.
        """
        return {
            "photo_id": self.photo_id,
            "annonce_id": self.annonce_id,
            "url": self.url,
            "nom_fichier": self.nom_fichier,
            "ordre": self.ordre,
            "largeur": self.largeur,
            "hauteur": self.hauteur,
            "taille_bytes": self.taille_bytes,
            "date_upload": self.date_upload.isoformat() if self.date_upload else None,
        }
