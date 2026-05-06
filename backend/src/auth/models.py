"""
Modèle SQLAlchemy pour la table utilisateurs.

Représente les utilisateurs de la plateforme Immo2000 avec leurs rôles
(vendeur, acheteur, agent) et leurs données personnelles.
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
        role (str): Rôle héritée (ancien système, pour compatibilité).
        role_actif (str): Rôle actuellement actif ('acheteur' ou 'vendeur').
        est_acheteur (bool): Utilisateur peut agir comme acheteur.
        est_vendeur (bool): Utilisateur peut agir comme vendeur.
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
    role = db.Column(db.String(50), nullable=False, default="acheteur")
    actif = db.Column(db.Boolean, default=True, index=True)
    date_inscription = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    date_derniere_connexion = db.Column(db.DateTime(timezone=True), nullable=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Colonnes rôles multiples (système unifié)
    est_acheteur = db.Column(db.Boolean, default=True, index=True)  # Tous les utilisateurs sont acheteurs par défaut
    est_vendeur = db.Column(db.Boolean, default=False, index=True)  # Optionnel : peut devenir vendeur
    role_actif = db.Column(db.String(50), default="acheteur")  # 'acheteur' ou 'vendeur' - rôle actuellement actif

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
                "role": "vendeur",
                "actif": True
            }
        """
        data = {
            "utilisateur_id": self.utilisateur_id,
            "nom": self.nom,
            "prenom": self.prenom,
            "role": self.role,
            "role_actif": self.role_actif,
            "est_acheteur": self.est_acheteur,
            "est_vendeur": self.est_vendeur,
            "actif": self.actif,
            "date_inscription": self.date_inscription.isoformat() if self.date_inscription else None,
        }

        if include_email:
            data["email"] = self.email

        return data

    def switch_role(self, new_role: str) -> bool:
        """
        Change le rôle actif de l'utilisateur.

        Args:
            new_role (str): Nouveau rôle ('acheteur' ou 'vendeur').

        Returns:
            bool: True si le switch est réussi, False sinon.

        Example:
            >>> user.switch_role('vendeur')
            True
        """
        if new_role == 'acheteur' and self.est_acheteur:
            self.role_actif = 'acheteur'
            return True
        elif new_role == 'vendeur' and self.est_vendeur:
            self.role_actif = 'vendeur'
            return True
        return False

    def enable_vendor_role(self) -> bool:
        """
        Active le rôle vendeur pour l'utilisateur.

        Returns:
            bool: True si l'activation est réussie, False sinon.

        Example:
            >>> user.enable_vendor_role()
            True
        """
        if not self.est_vendeur:
            self.est_vendeur = True
            # Si l'utilisateur devient vendeur, le rendre actif
            if self.role_actif == 'acheteur':
                pass  # Garder l'acheteur actif, l'utilisateur peut switcher manuellement
            return True
        return False

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
