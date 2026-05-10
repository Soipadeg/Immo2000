"""
Modèle SQLAlchemy pour les alertes d'annonces.

Permet aux utilisateurs de sauvegarder des critères de recherche
et de recevoir des notifications email quand de nouvelles annonces correspondent.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey
from src.auth.models import db


class AlerteAnnonce(db.Model):
    """
    Modèle alerte immobilière mappé à la table 'alertes_annonces' de PostgreSQL.

    Attributes:
        alerte_id (int): Identifiant unique (PK, SERIAL).
        utilisateur_id (int): FK vers utilisateurs.utilisateur_id.
        nom (str): Nom de l'alerte (ex: "Appartement Paris 3p").

        # Critères de recherche sauvegardés
        ville (str, optional): Ville recherchée.
        code_postal (str, optional): Code postal.
        type_bien (str, optional): Type de bien.
        prix_min (float, optional): Prix minimum en euros.
        prix_max (float, optional): Prix maximum en euros.
        surface_min (float, optional): Surface minimale en m².
        surface_max (float, optional): Surface maximale en m².
        nombre_pieces_min (int, optional): Nombre minimum de pièces.
        nombre_pieces_max (int, optional): Nombre maximum de pièces.
        dpe (str, optional): Classe énergétique (A-G).

        # Équipements souhaités (JSON)
        ascenseur (bool): Presence d'ascenseur.
        balcon (bool): Presence de balcon.
        terrasse (bool): Presence de terrasse.
        jardin (bool): Presence de jardin.
        piscine (bool): Presence de piscine.
        parking (bool): Presence de parking.

        # Configuration
        actif (bool): Si l'alerte est active (default: True).
        frequence (str): Fréquence d'alerte (quotidienne, hebdomadaire, immediatement).
        email_notification (bool): Envoyer les notifications par email.

        # Métadonnées
        date_creation (datetime): Date de création de l'alerte.
        date_derniere_notification (datetime, optional): Dernière alerte envoyée.
        date_derniere_modification (datetime): Dernière modification.
    """

    __tablename__ = "alertes_annonces"

    # Clé primaire
    alerte_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Clé étrangère vers utilisateurs
    utilisateur_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Nom de l'alerte
    nom = db.Column(db.String(200), nullable=False)

    # Critères de recherche
    ville = db.Column(db.String(100), nullable=True, index=True)
    code_postal = db.Column(db.String(5), nullable=True, index=True)
    type_bien = db.Column(db.String(50), nullable=True, index=True)
    prix_min = db.Column(db.Float, nullable=True)
    prix_max = db.Column(db.Float, nullable=True)
    surface_min = db.Column(db.Float, nullable=True)
    surface_max = db.Column(db.Float, nullable=True)
    nombre_pieces_min = db.Column(db.Integer, nullable=True)
    nombre_pieces_max = db.Column(db.Integer, nullable=True)
    dpe = db.Column(db.String(1), nullable=True)

    # Équipements
    ascenseur = db.Column(db.Boolean, default=False)
    balcon = db.Column(db.Boolean, default=False)
    terrasse = db.Column(db.Boolean, default=False)
    jardin = db.Column(db.Boolean, default=False)
    piscine = db.Column(db.Boolean, default=False)
    parking = db.Column(db.Boolean, default=False)

    # Configuration
    actif = db.Column(db.Boolean, default=True, index=True)
    frequence = db.Column(
        db.String(50),
        nullable=False,
        default="quotidienne",
        index=True
    )  # 'quotidienne', 'hebdomadaire', 'immediatement'
    email_notification = db.Column(db.Boolean, default=True)

    # Métadonnées
    date_creation = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    date_derniere_notification = db.Column(db.DateTime(timezone=True), nullable=True)
    date_derniere_modification = db.Column(
        db.DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Indexes pour optimisation
    __table_args__ = (
        Index('idx_alerte_utilisateur_actif', 'utilisateur_id', 'actif'),
        Index('idx_alerte_utilisateur', 'utilisateur_id'),
        Index('idx_alerte_criteres', 'type_bien', 'ville', 'prix_min', 'prix_max'),
    )

    def to_dict(self):
        """Convertit l'alerte en dictionnaire."""
        return {
            "alerte_id": self.alerte_id,
            "utilisateur_id": self.utilisateur_id,
            "nom": self.nom,
            "ville": self.ville,
            "code_postal": self.code_postal,
            "type_bien": self.type_bien,
            "prix_min": self.prix_min,
            "prix_max": self.prix_max,
            "surface_min": self.surface_min,
            "surface_max": self.surface_max,
            "nombre_pieces_min": self.nombre_pieces_min,
            "nombre_pieces_max": self.nombre_pieces_max,
            "dpe": self.dpe,
            "ascenseur": self.ascenseur,
            "balcon": self.balcon,
            "terrasse": self.terrasse,
            "jardin": self.jardin,
            "piscine": self.piscine,
            "parking": self.parking,
            "actif": self.actif,
            "frequence": self.frequence,
            "email_notification": self.email_notification,
            "date_creation": self.date_creation.isoformat() if self.date_creation else None,
            "date_derniere_notification": self.date_derniere_notification.isoformat() if self.date_derniere_notification else None,
            "date_derniere_modification": self.date_derniere_modification.isoformat() if self.date_derniere_modification else None,
        }
