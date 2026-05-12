"""
Modèle SQLAlchemy pour la table annonces.

Représente les annonces immobilières créées par les vendeurs.
Champs obligatoires et optionnels conformément à la spécification Melo.
"""

from datetime import datetime
from sqlalchemy import Index, CheckConstraint, ForeignKey
from src.auth.models import db


class Annonce(db.Model):
    """
    Modèle annonce immobilière mappé à la table 'annonces' de PostgreSQL.

    Attributes:
        annonce_id (int): Identifiant unique (PK, SERIAL).

        # Champs obligatoires
        titre (str): Titre de l'annonce (max 100 chars).
        description (str): Description détaillée (max 2000 chars).
        prix (float): Prix en euros (> 0).
        surface (float): Surface en m² (> 0).
        adresse (str): Adresse complète du bien.
        code_postal (str): Code postal français (5 chiffres).
        ville (str): Ville du bien.
        type_bien (str): Type de bien (maison, appartement, terrain, local commercial).
        nombre_pieces (int): Nombre de pièces (>= 1).
        utilisateur_id (int): FK vers utilisateurs.utilisateur_id (PK).
        date_creation (datetime): Date de création (auto-générée).

        # Champs optionnels
        photos (list): URLs des photos (JSON array, default: []).
        etage (int): Numéro d'étage (pour appartements).
        ascenseur (bool): Présence ascenseur (default: False).
        balcon (bool): Présence balcon (default: False).
        terrasse (bool): Présence terrasse (default: False).
        jardin (bool): Présence jardin (default: False).
        piscine (bool): Présence piscine (default: False).
        parking (bool): Présence parking (default: False).
        dpe (str): Classe énergétique (A-G).
        annee_construction (int): Année de construction.
        statut (str): Statut de l'annonce (brouillon, publiée, vendue, archivée).

        # Métadonnées
        date_modification (datetime): Dernière modification.
        date_statut (datetime): Date du dernier changement de statut.
        date_vente (datetime): Date de vente (optionnel).
    """

    __tablename__ = "annonces"

    # Clé primaire
    annonce_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Champs obligatoires
    titre = db.Column(db.String(100), nullable=False, index=False)
    description = db.Column(db.String(2000), nullable=False)
    prix = db.Column(db.Float, nullable=False)
    surface = db.Column(db.Float, nullable=False)
    adresse = db.Column(db.String(255), nullable=False)
    code_postal = db.Column(db.String(5), nullable=False, index=True)
    ville = db.Column(db.String(100), nullable=False, index=True)
    type_bien = db.Column(db.String(50), nullable=False, index=True)
    nombre_pieces = db.Column(db.Integer, nullable=False)

    # Clé étrangère vers utilisateurs
    utilisateur_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Champs optionnels
    photos = db.Column(db.JSON, nullable=True, default=[])
    etage = db.Column(db.Integer, nullable=True)
    ascenseur = db.Column(db.Boolean, default=False)
    balcon = db.Column(db.Boolean, default=False)
    terrasse = db.Column(db.Boolean, default=False)
    jardin = db.Column(db.Boolean, default=False)
    piscine = db.Column(db.Boolean, default=False)
    parking = db.Column(db.Boolean, default=False)
    masquer_adresse_complete = db.Column(db.Boolean, default=False)
    dpe = db.Column(db.String(1), nullable=True)
    annee_construction = db.Column(db.Integer, nullable=True)
    statut = db.Column(
        db.String(20),
        nullable=False,
        default="brouillon",
        index=True
    )

    # Métadonnées
    date_creation = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    date_modification = db.Column(
        db.DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    date_statut = db.Column(
        db.DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    date_vente = db.Column(db.DateTime(timezone=True), nullable=True)

    # Constraints
    __table_args__ = (
        CheckConstraint("prix > 0", name="check_prix_positive"),
        CheckConstraint("surface > 0", name="check_surface_positive"),
        CheckConstraint("nombre_pieces >= 1", name="check_nombre_pieces_min"),
        CheckConstraint(
            "statut IN ('brouillon', 'publiée', 'vendue', 'archivée')",
            name="check_statut_valid"
        ),
        CheckConstraint(
            "type_bien IN ('maison', 'appartement', 'terrain', 'local commercial')",
            name="check_type_bien_valid"
        ),
        CheckConstraint(
            "dpe IS NULL OR dpe IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')",
            name="check_dpe_valid"
        ),
        # Indexes composés pour filtrage courant
        Index("idx_ville_type_bien", "ville", "type_bien"),
        Index("idx_utilisateur_statut", "utilisateur_id", "statut"),
        Index("idx_code_postal_ville", "code_postal", "ville"),
    )

    def __repr__(self) -> str:
        """Représentation lisible de l'annonce."""
        return f"<Annonce {self.annonce_id}: {self.titre} ({self.statut})>"

    def to_dict(self, include_relations: bool = False) -> dict:
        """
        Convertir l'annonce en dictionnaire.

        Args:
            include_relations: Si True, inclut les relations (utilisateur, etc.)

        Returns:
            Dictionnaire représentant l'annonce
        """
        return {
            "annonce_id": self.annonce_id,
            "titre": self.titre,
            "description": self.description,
            "prix": self.prix,
            "surface": self.surface,
            "adresse": self.adresse,
            "code_postal": self.code_postal,
            "ville": self.ville,
            "type_bien": self.type_bien,
            "nombre_pieces": self.nombre_pieces,
            "utilisateur_id": self.utilisateur_id,
            "photos": self.photos or [],
            "etage": self.etage,
            "ascenseur": self.ascenseur,
            "balcon": self.balcon,
            "terrasse": self.terrasse,
            "jardin": self.jardin,
            "piscine": self.piscine,
            "parking": self.parking,
            "dpe": self.dpe,
            "annee_construction": self.annee_construction,
            "statut": self.statut,
            "date_creation": self.date_creation.isoformat() if self.date_creation else None,
            "date_modification": self.date_modification.isoformat() if self.date_modification else None,
            "date_statut": self.date_statut.isoformat() if self.date_statut else None,
            "date_vente": self.date_vente.isoformat() if self.date_vente else None,
        }
