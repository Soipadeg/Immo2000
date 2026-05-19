"""
Modèles SQLAlchemy pour les paiements (Stripe, dépôt, solde, frais).

Gère :
- Paiements des dépôts de garantie
- Paiements du solde
- Frais Immo2000 et frais notaire
- Intégration Stripe avec PaymentIntent
"""

from datetime import datetime
from decimal import Decimal
from sqlalchemy import Index, ForeignKey, JSON, Text, CheckConstraint, Enum as SQLEnum
from src.auth.models import db
import enum


class TypePaiement(str, enum.Enum):
    """Types de paiements possibles."""
    DEPOT_GARANTIE = "depot_garantie"
    SOLDE = "solde"
    FRAIS_NOTAIRE = "frais_notaire"
    COMMISSION_IMMO2000 = "commission_immo2000"
    REMBOURSEMENT = "remboursement"


class StatutPaiement(str, enum.Enum):
    """Statuts possibles d'un paiement."""
    EN_ATTENTE = "en_attente"
    EN_COURS = "en_cours"
    REUSSI = "reussi"
    ECHOUE = "echoue"
    REMBOURSE = "rembourse"
    ANNULE = "annule"


class Paiement(db.Model):
    """
    Modèle pour un paiement via Stripe.

    Attributes:
        paiement_id (int): Identifiant unique (PK).
        transaction_notaire_id (int): FK vers transaction_notaire.
        montant (Decimal): Montant en euros.
        devise (str): Devise (EUR, USD, etc.)
        type (Enum): Type de paiement (DEPOT_GARANTIE, SOLDE, etc.)
        statut (Enum): Statut du paiement (EN_ATTENTE, REUSSI, ECHOUE, etc.)
        stripe_payment_intent_id (str): ID du PaymentIntent Stripe.
        stripe_charge_id (str): ID de la charge Stripe (après succès).
        description (str): Description du paiement.
        date_creation (datetime): Date de création.
        date_paiement (datetime): Date du paiement réussi.
        reponse_stripe (JSON): Réponse complète de Stripe.
    """

    __tablename__ = "paiements"

    paiement_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # FK vers transaction notaire
    transaction_notaire_id = db.Column(
        db.Integer,
        ForeignKey("transaction_notaire.transaction_notaire_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Montant et devise
    montant = db.Column(db.Numeric(12, 2), nullable=False)
    devise = db.Column(db.String(3), default="EUR", nullable=False)

    # Type et statut
    type = db.Column(
        db.String(50),
        nullable=False,
        index=True,
        default="depot_garantie"
    )
    statut = db.Column(
        db.String(50),
        nullable=False,
        index=True,
        default="en_attente"
    )

    # Intégration Stripe
    stripe_payment_intent_id = db.Column(db.String(255), nullable=True, unique=True, index=True)
    stripe_charge_id = db.Column(db.String(255), nullable=True, unique=True, index=True)
    stripe_client_secret = db.Column(db.String(255), nullable=True)

    # Description et métadonnées
    description = db.Column(db.String(500), nullable=True)
    metadata = db.Column(JSON, nullable=True, default={})

    # Dates clés
    date_creation = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    date_paiement = db.Column(db.DateTime(timezone=True), nullable=True)

    # Réponse Stripe (JSON complet pour audit)
    reponse_stripe = db.Column(JSON, nullable=True)

    # Message d'erreur (si échoué)
    message_erreur = db.Column(Text, nullable=True)

    # Relation
    transaction = db.relationship("TransactionNotaire", backref="paiements")

    # Indices
    __table_args__ = (
        Index("idx_paiements_transaction_statut", "transaction_notaire_id", "statut"),
        Index("idx_paiements_type_statut", "type", "statut"),
        Index("idx_paiements_date_creation", "date_creation"),
        CheckConstraint("montant > 0", name="check_paiement_montant_positif"),
    )

    def __repr__(self) -> str:
        """Représentation lisible du paiement."""
        return f"<Paiement {self.paiement_id} {self.type} {self.montant}€ {self.statut}>"

    def to_dict(self) -> dict:
        """Sérialisation pour API."""
        return {
            "paiement_id": self.paiement_id,
            "transaction_notaire_id": self.transaction_notaire_id,
            "montant": float(self.montant),
            "devise": self.devise,
            "type": self.type,
            "statut": self.statut,
            "stripe_payment_intent_id": self.stripe_payment_intent_id,
            "description": self.description,
            "date_creation": self.date_creation.isoformat() if self.date_creation else None,
            "date_paiement": self.date_paiement.isoformat() if self.date_paiement else None,
        }


class FraisNotaire(db.Model):
    """
    Modèle pour les frais notaire validés.

    Attributes:
        frais_notaire_id (int): Identifiant unique (PK).
        transaction_notaire_id (int): FK vers transaction_notaire.
        notaire_id (int): FK vers notaire.
        montant_frais (Decimal): Montant des frais en euros.
        detail (str): Détail des frais (droits, émoluments, etc.)
        statut (str): Statut (EN_ATTENTE, VALIDE, REFUSE).
        date_creation (datetime): Date de création.
        date_validation (datetime): Date de validation/refus.
        raison_refus (str): Raison du refus (si refusé).
    """

    __tablename__ = "frais_notaire"

    frais_notaire_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # FK vers transaction et notaire
    transaction_notaire_id = db.Column(
        db.Integer,
        ForeignKey("transaction_notaire.transaction_notaire_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    notaire_id = db.Column(
        db.Integer,
        ForeignKey("notaires.notaire_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Montant et détails
    montant_frais = db.Column(db.Numeric(12, 2), nullable=False)
    detail = db.Column(Text, nullable=True)

    # Statut validation
    statut = db.Column(
        db.String(50),
        nullable=False,
        default="en_attente",
        index=True
    )

    # Dates
    date_creation = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    date_validation = db.Column(db.DateTime(timezone=True), nullable=True)

    # En cas de refus
    raison_refus = db.Column(Text, nullable=True)

    # Relations
    transaction = db.relationship("TransactionNotaire", backref="frais_notaires")
    notaire = db.relationship("Notaire", backref="frais_valides")

    # Indices
    __table_args__ = (
        Index("idx_frais_transaction_statut", "transaction_notaire_id", "statut"),
        Index("idx_frais_notaire_statut", "notaire_id", "statut"),
        CheckConstraint("montant_frais > 0", name="check_frais_montant_positif"),
    )

    def __repr__(self) -> str:
        """Représentation lisible des frais."""
        return f"<FraisNotaire {self.frais_notaire_id} {self.montant_frais}€ {self.statut}>"

    def to_dict(self) -> dict:
        """Sérialisation pour API."""
        return {
            "frais_notaire_id": self.frais_notaire_id,
            "transaction_notaire_id": self.transaction_notaire_id,
            "notaire_id": self.notaire_id,
            "montant_frais": float(self.montant_frais),
            "detail": self.detail,
            "statut": self.statut,
            "date_creation": self.date_creation.isoformat() if self.date_creation else None,
            "date_validation": self.date_validation.isoformat() if self.date_validation else None,
        }


class CommissionImmo2000(db.Model):
    """
    Modèle pour les commissions Immo2000 (2% du prix de vente).

    Attributes:
        commission_id (int): Identifiant unique.
        transaction_notaire_id (int): FK vers transaction_notaire.
        prix_vente (Decimal): Prix de vente (base de calcul).
        taux_commission (float): Taux de commission (défaut: 0.02 = 2%).
        montant_commission (Decimal): Montant calculé.
        statut (str): Statut de la commission (CALCULEE, PAIEE, REMBOURSEE).
        date_calcul (datetime): Date du calcul.
        date_paiement (datetime): Date du paiement.
    """

    __tablename__ = "commission_immo2000"

    commission_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # FK vers transaction
    transaction_notaire_id = db.Column(
        db.Integer,
        ForeignKey("transaction_notaire.transaction_notaire_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True
    )

    # Calcul de la commission
    prix_vente = db.Column(db.Numeric(12, 2), nullable=False)
    taux_commission = db.Column(db.Float, default=0.02, nullable=False)
    montant_commission = db.Column(db.Numeric(12, 2), nullable=False)

    # Statut et dates
    statut = db.Column(
        db.String(50),
        default="calculee",
        nullable=False,
        index=True
    )
    date_calcul = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    date_paiement = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relation
    transaction = db.relationship("TransactionNotaire", backref="commission_immo2000")

    # Indices
    __table_args__ = (
        CheckConstraint("montant_commission > 0", name="check_commission_montant_positif"),
        CheckConstraint("taux_commission >= 0 AND taux_commission <= 1", name="check_taux_commission"),
    )

    def __repr__(self) -> str:
        """Représentation lisible de la commission."""
        return f"<CommissionImmo2000 {self.commission_id} {self.montant_commission}€ {self.statut}>"

    def to_dict(self) -> dict:
        """Sérialisation pour API."""
        return {
            "commission_id": self.commission_id,
            "transaction_notaire_id": self.transaction_notaire_id,
            "prix_vente": float(self.prix_vente),
            "taux_commission": self.taux_commission,
            "montant_commission": float(self.montant_commission),
            "statut": self.statut,
            "date_calcul": self.date_calcul.isoformat() if self.date_calcul else None,
            "date_paiement": self.date_paiement.isoformat() if self.date_paiement else None,
        }
