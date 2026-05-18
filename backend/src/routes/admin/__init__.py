"""
Blueprints administrateur pour les routes Flask.

Exports:
- dashboard_bp: Routes pour le dashboard et les analytics
- users_bp: Routes pour la gestion des utilisateurs
- listings_bp: Routes pour la modération des annonces
- transactions_bp: Routes pour la gestion des transactions
"""

from .dashboard import dashboard_bp
from .users import users_bp
from .listings import listings_bp
from .transactions import transactions_bp

__all__ = [
    'dashboard_bp',
    'users_bp',
    'listings_bp',
    'transactions_bp',
]
