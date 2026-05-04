"""
Module d'authentification pour Immo2000.

Fournit :
- Modèle SQLAlchemy pour les utilisateurs
- Utilitaires JWT et hachage de mot de passe
- Décorateurs pour protéger les routes
- Endpoints d'authentification
"""

from .models import User
from .decorators import token_required, role_required

__all__ = ["User", "token_required", "role_required"]
