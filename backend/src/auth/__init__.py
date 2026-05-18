"""
Module d'authentification pour Immo2000.

Fournit :
- Modèle SQLAlchemy pour les utilisateurs
- Utilitaires JWT et hachage de mot de passe
- Décorateurs pour protéger les routes
- Blueprints d'authentification séparés par responsabilité

Blueprints:
- register_bp : Enregistrement et profil acheteur
- login_bp : Connexion, vérification email, 2FA
- password_bp : Réinitialisation de mot de passe
- tokens_bp : Gestion des tokens JWT
"""

from .models import User
from .decorators import token_required, role_required
from .register import register_bp
from .login import login_bp
from .password import password_bp
from .tokens import tokens_bp

__all__ = ["User", "token_required", "role_required", "register_bp", "login_bp", "password_bp", "tokens_bp"]
