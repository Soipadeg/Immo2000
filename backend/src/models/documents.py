"""
Modèle SQLAlchemy pour les documents (compromis, diagnostics, etc.)

Permet aux vendeurs de partager des documents avec les acheteurs.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey, Enum as SQLEnum
import enum
from src.auth.models import db


class DocumentType(str, enum.Enum):
    """Types de documents supportés."""
    COMPROMIS = "compromis"
    DIAGNOSTIC_DPE = "diagnostic_dpe"
    DIAGNOSTIC_AMIANTE = "diagnostic_amiante"
    DIAGNOSTIC_ELECTRIQUE = "diagnostic_electrique"
    DIAGNOSTIC_GAZ = "diagnostic_gaz"
    DIAGNOSTIC_PLOMB = "diagnostic_plomb"
    ATTESTATION_ASSURANCE = "attestation_assurance"
    CERTIFICATION_TRAVAUX = "certification_travaux"
    PLAN_ETAGE = "plan_etage"
    PHOTOS = "photos"
    VIDEO = "video"
    AUTRES = "autres"


class Document(db.Model):
    """
    Modèle document mappé à la table 'documents' de PostgreSQL.

    Permet aux vendeurs de partager des documents relatifs à une annonce.

    Attributes:
        document_id (int): Identifiant unique (PK).
        annonce_id (int): FK vers annonces.annonce_id.
        type (str): Type de document (enum DocumentType).
        nom (str): Nom du document.
        url (str): URL d'accès au document.
        taille (int): Taille en octets.
        mime_type (str): Type MIME (application/pdf, image/jpeg, etc.).
        date_upload (datetime): Date d'upload.
        date_expiration (datetime): Date d'expiration du partage (optionnel).
        visible_pour_tous (bool): Visible pour tous les visiteurs ou seulement contactants.
        telecharge (int): Nombre de téléchargements.
    """

    __tablename__ = "documents"

    document_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    annonce_id = db.Column(
        db.Integer,
        ForeignKey("annonces.annonce_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    type = db.Column(
        db.String(50),
        nullable=False,
        default="autres",
        index=True
    )

    nom = db.Column(db.String(255), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    taille = db.Column(db.Integer, nullable=False)  # en octets
    mime_type = db.Column(db.String(100), nullable=False)

    date_upload = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    date_expiration = db.Column(db.DateTime(timezone=True), nullable=True)

    visible_pour_tous = db.Column(db.Boolean, default=True)
    telecharge = db.Column(db.Integer, default=0)

    def __repr__(self) -> str:
        """Représentation lisible du document."""
        return f"<Document {self.nom} ({self.type})>"

    def is_expired(self) -> bool:
        """Vérifie si le document a expiré."""
        if not self.date_expiration:
            return False
        return datetime.utcnow() > self.date_expiration
