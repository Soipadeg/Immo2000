"""
Modèle SQLAlchemy pour la table utilisateurs.

Représente les utilisateurs de la plateforme Immo2000.
Un utilisateur peut naturellement vendre (créer annonce) et acheter (contacter utilisateurs).
Rôles: utilisateur (standard), administrateur (modérateur), notaire (expert en vente).
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from enum import Enum
import bcrypt

db = SQLAlchemy()


class RoleEnum(str, Enum):
    """Énumération des rôles disponibles dans Immo2000."""
    UTILISATEUR = "utilisateur"
    ADMINISTRATEUR = "administrateur"
    NOTAIRE = "notaire"


class User(db.Model):
    """
    Modèle utilisateur mappé à la table 'utilisateurs' de PostgreSQL.

    Un utilisateur peut naturellement vendre (créer annonces) et acheter (rechercher, contacter).
    Les critères d'acheteur sont OPTIONNELS et définis directement dans ce modèle (pas de table séparée).

    Attributes:
        utilisateur_id (int): Identifiant unique (PK).
        email (str): Email unique, utilisé pour la connexion.
        mot_de_passe_hash (str, optional): Hash bcrypt du mot de passe (nullable pour OAuth).
        nom (str): Nom de l'utilisateur.
        prenom (str): Prénom de l'utilisateur.
        telephone (str, optional): Numéro de téléphone.
        adresse_contact (str, optional): Adresse postale.
        role (str): Rôle - 'user' (standard) ou 'admin' (modérateur).
        actif (bool): Indique si le compte est actif.
        date_inscription (datetime): Datetime d'inscription.
        date_derniere_connexion (datetime, optional): Dernière connexion.
        updated_at (datetime): Dernière modification du profil.
        google_id (str, optional): ID unique Google OAuth.
        facebook_id (str, optional): ID unique Facebook OAuth.
        apple_id (str, optional): ID unique Apple OAuth.
        photo_url (str, optional): URL de la photo de profil.
        auth_method (str): Méthode d'authentification ('email', 'google', 'facebook', 'apple').
        email_verified (bool): Indique si l'email a été confirmé (RGPD).
        verification_token (str, optional): Token unique de vérification d'email.
        verification_token_expires (datetime, optional): Expiration du token de vérification.

        === CRITÈRES ACHETEUR (OPTIONNELS) ===
        budget_max (float, optional): Budget maximal en euros pour l'achat.
        ville_recherchee (str, optional): Ville principale recherchée.
        surface_min (int, optional): Surface minimale requise en m².
        type_bien_recherche (str, optional): Type de bien recherché (appartement, maison, terrain, etc.).
        nombre_pieces_min (int, optional): Nombre minimum de pièces.
        dpe_ideale (str, optional): Classe énergétique idéale (A-G).
    """

    __tablename__ = "utilisateurs"

    utilisateur_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    mot_de_passe_hash = db.Column(db.String(255), nullable=True)  # Nullable pour OAuth
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    telephone = db.Column(db.String(20), nullable=True)
    adresse_contact = db.Column(db.String(255), nullable=True)
    role = db.Column(db.Enum(RoleEnum), nullable=False, default=RoleEnum.UTILISATEUR)  # Enum: utilisateur, administrateur, notaire
    actif = db.Column(db.Boolean, default=True, index=True)
    date_inscription = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    date_derniere_connexion = db.Column(db.DateTime(timezone=True), nullable=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Colonnes OAuth
    google_id = db.Column(db.String(255), nullable=True, unique=True, index=True)
    facebook_id = db.Column(db.String(255), nullable=True, unique=True, index=True)
    apple_id = db.Column(db.String(255), nullable=True, unique=True, index=True)
    photo_url = db.Column(db.String(500), nullable=True)
    auth_method = db.Column(db.String(50), default="email")  # "email", "google", "facebook", "apple"

    # Colonnes vérification email (RGPD)
    email_verified = db.Column(db.Boolean, default=False, index=True)
    verification_token = db.Column(db.String(255), nullable=True, unique=True, index=True)
    verification_token_expires = db.Column(db.DateTime(timezone=True), nullable=True)

    # Colonnes réinitialisation mot de passe
    reset_token = db.Column(db.String(6), nullable=True)  # Code 6 chiffres
    reset_token_expires = db.Column(db.DateTime(timezone=True), nullable=True)

    # Colonnes 2FA
    requires_2fa = db.Column(db.Boolean, default=False)
    two_fa_code = db.Column(db.String(6), nullable=True)  # Code 6 chiffres
    two_fa_code_expires = db.Column(db.DateTime(timezone=True), nullable=True)

    # === CRITÈRES ACHETEUR (FUSIONNÉ - pas de table séparée) ===
    # Un utilisateur peut optionnellement définir ses critères de recherche acheteur
    budget_max = db.Column(db.Numeric(12, 2), nullable=True)  # Budget max en euros (optionnel)
    ville_recherchee = db.Column(db.String(100), nullable=True, index=True)  # Ville de recherche (optionnel)
    surface_min = db.Column(db.Integer, nullable=True)  # Surface min en m² (optionnel)
    type_bien_recherche = db.Column(db.String(50), nullable=True, index=True)  # Type bien recherché (optionnel)
    nombre_pieces_min = db.Column(db.Integer, nullable=True)  # Nb pièces min (optionnel)
    dpe_ideale = db.Column(db.String(1), nullable=True)  # Classe énergétique idéale A-G (optionnel)
    is_profil_acheteur_complet = db.Column(db.Boolean, default=False)  # True si le profil acheteur (étape 2) est rempli

    # === VENTE AVEC CONTRAT D'EXCLUSIVITÉ (IA future) ===
    has_exclusivity_contract = db.Column(db.Boolean, default=False)  # True si contrat d'exclusivité signé (préparation pour outils IA)

    # === RELATIONS PLANIFICATION DE VISITE ===
    # Créneaux de disponibilité pour les visites
    creneaux_disponibles = db.relationship(
        "CreneauDisponible",
        back_populates="utilisateur",
        cascade="all, delete-orphan",
        foreign_keys="CreneauDisponible.utilisateur_id"
    )

    # RDV où l'utilisateur est acheteur
    rdv_en_tant_que_acheteur = db.relationship(
        "RendezVous",
        back_populates="acheteur",
        foreign_keys="RendezVous.acheteur_id",
        cascade="all, delete-orphan"
    )

    # RDV où l'utilisateur est vendeur
    rdv_en_tant_que_vendeur = db.relationship(
        "RendezVous",
        back_populates="vendeur",
        foreign_keys="RendezVous.vendeur_id",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """Représentation lisible de l'utilisateur."""
        return f"<User {self.email} ({self.role})>"

    def set_password(self, password: str) -> None:
        """
        Hache et stocke le mot de passe avec bcrypt.

        Args:
            password (str): Mot de passe en clair.

        Note:
            N'appelle pas db.session.commit() automatiquement.
            À appeler avant commit/flush.
        """
        salt = bcrypt.gensalt(rounds=12)
        self.mot_de_passe_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def check_password(self, password: str) -> bool:
        """
        Vérifie si le mot de passe en clair correspond au hash stocké.

        Args:
            password (str): Mot de passe en clair à vérifier.

        Returns:
            bool: True si le mot de passe est correct, False sinon.

        Example:
            >>> user.check_password("monmotdepasse123")
            True
        """
        return bcrypt.checkpw(password.encode("utf-8"), self.mot_de_passe_hash.encode("utf-8"))

    def to_dict(self, include_email: bool = True) -> dict:
        """
        Convertit l'utilisateur en dictionnaire (sans le hash du mot de passe).

        Args:
            include_email (bool): Inclure l'email dans le dictionnaire.

        Returns:
            dict: Dictionnaire avec les données de l'utilisateur.

        Example:
            >>> user.to_dict()
            {
                "utilisateur_id": 1,
                "email": "user@example.com",
                "nom": "Dupont",
                "prenom": "Jean",
                "role": "user",
                "actif": True,
                "budget_max": None,
                "ville_recherchee": None,
                ...
            }
        """
        data = {
            "utilisateur_id": self.utilisateur_id,
            "nom": self.nom,
            "prenom": self.prenom,
            "role": self.role.value if isinstance(self.role, RoleEnum) else self.role,  # Convertir Enum en string
            "actif": self.actif,
            "email_verified": self.email_verified,
            "is_profil_acheteur_complet": self.is_profil_acheteur_complet,  # Nouveau champ
            "date_inscription": self.date_inscription.isoformat() if self.date_inscription else None,
            # Critères acheteur (optionnels)
            "budget_max": float(self.budget_max) if self.budget_max else None,
            "ville_recherchee": self.ville_recherchee,
            "surface_min": self.surface_min,
            "type_bien_recherche": self.type_bien_recherche,
            "nombre_pieces_min": self.nombre_pieces_min,
            "dpe_ideale": self.dpe_ideale,
        }

        if include_email:
            data["email"] = self.email

        return data

    @classmethod
    def find_by_email(cls, email: str):
        """
        Recherche un utilisateur par son email.

        Args:
            email (str): Email de l'utilisateur.

        Returns:
            User: L'utilisateur trouvé, ou None.
        """
        return cls.query.filter_by(email=email).first()

    @classmethod
    def find_by_id(cls, user_id: int):
        """
        Recherche un utilisateur par son ID.

        Args:
            user_id (int): ID de l'utilisateur.

        Returns:
            User: L'utilisateur trouvé, ou None.
        """
        return cls.query.get(user_id)
