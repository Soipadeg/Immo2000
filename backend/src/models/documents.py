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


class DocumentObligatoire(str, enum.Enum):
    """Types de documents obligatoires pour mettre en ligne une annonce."""
    TITRE_PROPRIETE = "titre_propriete"
    CARTE_IDENTITE = "carte_identite"
    PV_AG = "pv_ag"  # Procès verbal d'assemblée générale (3 derniers)
    REGLEMENT_COPROPRIETE = "reglement_copropriete"
    DIAGNOSTICS = "diagnostics"


class DocumentRequis(db.Model):
    """
    Modèle pour les documents OBLIGATOIRES d'une annonce.

    Les vendeurs doivent fournir ces 5 documents pour publier une annonce:
    1. Titre de propriété
    2. Carte nationale d'identité du/des vendeur(s)
    3. 3 derniers PV d'AG (procès verbal d'assemblée générale)
    4. Règlement de copropriété
    5. Diagnostics Techniques

    Attributes:
        document_requis_id (int): Identifiant unique.
        annonce_id (int): FK vers annonces.
        type_document (str): Type du document obligatoire.
        statut (str): 'manquant', 'soumis', 'valide', 'rejete'.
        url_document (str): URL du fichier stocké.
        taille (int): Taille du fichier en bytes.
        mime_type (str): Type MIME (application/pdf).
        motif_rejet (str): Raison du rejet (si applicable).
        date_submission (datetime): Date de soumission.
        date_validation (datetime): Date de validation.
    """

    __tablename__ = "documents_requis"

    document_requis_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    annonce_id = db.Column(
        db.Integer,
        ForeignKey("annonces.annonce_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    type_document = db.Column(
        db.String(50),
        nullable=False,
        index=True
    )

    statut = db.Column(
        db.String(20),
        nullable=False,
        default="manquant",
        index=True
    )  # manquant | soumis | valide | rejete

    url_document = db.Column(db.String(500), nullable=True)
    taille = db.Column(db.Integer, nullable=True)  # en bytes
    mime_type = db.Column(db.String(50), nullable=True)

    motif_rejet = db.Column(db.Text, nullable=True)

    date_submission = db.Column(db.DateTime(timezone=True), nullable=True)
    date_validation = db.Column(db.DateTime(timezone=True), nullable=True)

    # Metadonnées
    date_creation = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    date_modification = db.Column(
        db.DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Indexes composés
    __table_args__ = (
        Index("idx_annonce_type", "annonce_id", "type_document"),
        Index("idx_annonce_statut", "annonce_id", "statut"),
    )

    def __repr__(self) -> str:
        return f"<DocumentRequis Annonce {self.annonce_id}: {self.type_document} ({self.statut})>"

    def to_dict(self) -> dict:
        """Convertir en dictionnaire."""
        return {
            "document_requis_id": self.document_requis_id,
            "annonce_id": self.annonce_id,
            "type_document": self.type_document,
            "statut": self.statut,
            "url_document": self.url_document,
            "taille": self.taille,
            "mime_type": self.mime_type,
            "motif_rejet": self.motif_rejet,
            "date_submission": self.date_submission.isoformat() if self.date_submission else None,
            "date_validation": self.date_validation.isoformat() if self.date_validation else None,
        }
