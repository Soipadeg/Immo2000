"""
Modèle SQLAlchemy pour la table utilisateurs.

Représente les utilisateurs de la plateforme Immo2000.
Un utilisateur peut naturellement vendre (créer annonce) et acheter (contacter utilisateurs).
Rôles: user (standard) ou admin (modérateur).
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import bcrypt

db = SQLAlchemy()


class User(db.Model):
    """
    Modèle utilisateur mappé à la table 'utilisateurs' de PostgreSQL.

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
    """

    __tablename__ = "utilisateurs"

    utilisateur_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    mot_de_passe_hash = db.Column(db.String(255), nullable=True)  # Nullable pour OAuth
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    telephone = db.Column(db.String(20), nullable=True)
    adresse_contact = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(50), nullable=False, default="user")  # 'user' ou 'admin'
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
                "actif": True
            }
        """
        data = {
            "utilisateur_id": self.utilisateur_id,
            "nom": self.nom,
            "prenom": self.prenom,
            "role": self.role,
            "actif": self.actif,
            "date_inscription": self.date_inscription.isoformat() if self.date_inscription else None,
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
