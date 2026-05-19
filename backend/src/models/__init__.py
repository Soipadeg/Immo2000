"""Modèles SQLAlchemy pour Immo2000."""

from .annonces import Annonce
from src.auth.models import db
from .biens import Bien
from .messages import Message
from .documents import Document
from .annonce_views import AnnonceView
from .search_history import SearchHistory
from .favoris import Favori
from .offres import Offre
from .alertes import AlerteAnnonce
from .visites import Visite
from .feedbacks import Feedback
from .notifications import Notification, NotificationType
from .notaires import (
    Notaire,
    NotaireSpecialisation,
    TransactionNotaire,
    DocumentNotaire,
    HistoriqueNotaire,
    DisponibiliteNotaire
)
from .paiements import (
    Paiement,
    FraisNotaire,
    CommissionImmo2000,
    TypePaiement,
    StatutPaiement
)

__all__ = [
    "db",
    "Annonce",
    "Bien",
    "Message",
    "Document",
    "AnnonceView",
    "SearchHistory",
    "Favori",
    "Offre",
    "Acheteur",
    "AlerteAnnonce",
    "Visite",
    "Feedback",
    "Notification",
    "NotificationType",
    "Notaire",
    "NotaireSpecialisation",
    "TransactionNotaire",
    "DocumentNotaire",
    "HistoriqueNotaire",
    "DisponibiliteNotaire",
    "Paiement",
    "FraisNotaire",
    "CommissionImmo2000",
    "TypePaiement",
    "StatutPaiement"
]
