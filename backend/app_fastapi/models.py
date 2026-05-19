"""
Modèles Pydantic pour la validation et la documentation des données FastAPI.

Ces modèles sont utilisés pour:
- Valider les requêtes entrantes (Request bodies)
- Documenter les réponses (Response bodies)
- Générer automatiquement la documentation Swagger/OpenAPI

Note: SQLAlchemy models restent dans backend/src/models/
"""

from pydantic import BaseModel, Field, EmailStr, HttpUrl, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============================================================================
# Énumérations (Statuts)
# ============================================================================

class StatutOffre(str, Enum):
    """Statuts possibles d'une offre."""
    PROPOSEE = "PROPOSEE"
    ACCEPTEE = "ACCEPTEE"
    REFUSEE = "REFUSEE"
    NEGOCIATION = "NEGOCIATION"
    RETIREE = "RETIREE"


class StatutTransaction(str, Enum):
    """Statuts possibles d'une transaction."""
    EN_ATTENTE_NOTAIRE = "EN_ATTENTE_NOTAIRE"
    NOTAIRE_SELECTIONNE = "NOTAIRE_SELECTIONNE"
    FRAIS_VALIDES = "FRAIS_VALIDES"
    COMPROMIS_SIGNE = "COMPROMIS_SIGNE"
    ACTE_SIGNE = "ACTE_SIGNE"
    PAIEMENT_DEPOT = "PAIEMENT_DEPOT"
    FINALISEE = "FINALISEE"
    ECHOUEE = "ECHOUEE"


class StatutPaiement(str, Enum):
    """Statuts possibles d'un paiement."""
    EN_ATTENTE = "EN_ATTENTE"
    EN_COURS = "EN_COURS"
    REUSSI = "REUSSI"
    ECHOUE = "ECHOUE"
    REMBOURSE = "REMBOURSE"


# ============================================================================
# Utilisateurs & Authentification
# ============================================================================

class UtilisateurBase(BaseModel):
    """Base pour les modèles utilisateur."""
    nom: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role: str = Field("utilisateur", description="Rôle: 'utilisateur', 'notaire', 'administrateur'")


class UtilisateurCreate(UtilisateurBase):
    """Modèle pour créer un utilisateur."""
    password: str = Field(..., min_length=8, max_length=100)


class UtilisateurResponse(UtilisateurBase):
    """Modèle pour répondre avec les données d'un utilisateur."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Modèle pour la réponse de token JWT."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# ============================================================================
# Offres
# ============================================================================

class OffreCreate(BaseModel):
    """Modèle pour créer une offre."""
    annonce_id: int = Field(..., gt=0, description="ID de l'annonce")
    montant: float = Field(..., gt=0, description="Montant de l'offre en euros")
    conditions_suspensives: Optional[str] = Field(
        None,
        max_length=500,
        description="Conditions suspensives (ex: obtention prêt)"
    )
    message: Optional[str] = Field(
        None,
        max_length=500,
        description="Message à l'intention du vendeur"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "annonce_id": 1,
                "montant": 300000.0,
                "conditions_suspensives": "Obtention d'un prêt bancaire",
                "message": "Offre sérieuse avec dossier complet."
            }
        }


class OffreResponse(BaseModel):
    """Modèle pour répondre avec les données d'une offre."""
    id: int
    annonce_id: int
    acheteur_id: int
    vendeur_id: int
    montant: float
    statut: StatutOffre
    conditions_suspensives: Optional[str]
    message: Optional[str]
    contre_proposition: Optional[float]
    date_creation: datetime
    date_expiration: Optional[datetime]
    transaction_id: Optional[int]

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "annonce_id": 1,
                "acheteur_id": 2,
                "vendeur_id": 1,
                "montant": 300000.0,
                "statut": "PROPOSEE",
                "conditions_suspensives": "Obtention prêt",
                "message": "Offre sérieuse",
                "contre_proposition": None,
                "date_creation": "2026-05-19T10:00:00",
                "date_expiration": "2026-05-26T10:00:00",
                "transaction_id": None
            }
        }


class OffreUpdate(BaseModel):
    """Modèle pour mettre à jour une offre."""
    message: Optional[str] = Field(None, max_length=500)


class OffreRepondre(BaseModel):
    """Modèle pour répondre à une offre (accepter/refuser/négocier)."""
    action: str = Field(..., description="Action: 'accepter', 'refuser' ou 'negocier'")
    contre_proposition: Optional[float] = Field(
        None,
        gt=0,
        description="Montant pour la contre-proposition (si action='negocier')"
    )

    @validator("action")
    def action_valide(cls, v):
        if v not in ["accepter", "refuser", "negocier"]:
            raise ValueError("Action doit être: 'accepter', 'refuser' ou 'negocier'")
        return v


# ============================================================================
# Transactions
# ============================================================================

class TransactionCreate(BaseModel):
    """Modèle pour créer une transaction (via acceptation d'offre)."""
    offre_id: int = Field(..., gt=0)


class SelectNotaireRequest(BaseModel):
    """Modèle pour sélectionner un notaire pour une transaction."""
    notaire_id: int = Field(..., gt=0)


class TransactionResponse(BaseModel):
    """Modèle pour répondre avec les données d'une transaction."""
    id: int
    offre_id: int
    notaire_id: Optional[int]
    statut: StatutTransaction
    prix_final: float
    frais_immo2000: Optional[float]
    frais_notaire: Optional[float]
    compromis_url: Optional[str]
    acte_authentique_url: Optional[str]
    depot_garantie_paye: bool
    solde_paye: bool
    docusign_envelope_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "offre_id": 1,
                "notaire_id": 1,
                "statut": "NOTAIRE_SELECTIONNE",
                "prix_final": 300000.0,
                "frais_immo2000": 6000.0,
                "frais_notaire": 8000.0,
                "compromis_url": "https://s3.amazonaws.com/.../compromis.pdf",
                "acte_authentique_url": None,
                "depot_garantie_paye": False,
                "solde_paye": False,
                "docusign_envelope_id": None,
                "created_at": "2026-05-19T10:00:00",
                "updated_at": "2026-05-19T10:05:00"
            }
        }


# ============================================================================
# Notaires
# ============================================================================

class NotaireResponse(BaseModel):
    """Modèle pour répondre avec les données d'un notaire."""
    id: int
    nom: str
    email: EmailStr
    adresse: Optional[str]
    telephone: Optional[str]
    tarif_base: float
    est_partenaire: bool
    est_disponible: bool

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "nom": "Jean Dupont",
                "email": "jean@notaire.fr",
                "adresse": "1 Rue de Paris, 75001 Paris",
                "telephone": "+33612345678",
                "tarif_base": 2.5,
                "est_partenaire": True,
                "est_disponible": True
            }
        }


class DashboardNotaireResponse(BaseModel):
    """Modèle pour le dashboard du notaire (transactions en cours)."""
    id: int
    titre_annonce: str
    montant_bien: float
    frais_estimés: float
    statut: StatutTransaction
    date_creation: datetime
    notaire: NotaireResponse


# ============================================================================
# Paiements
# ============================================================================

class PaiementIntentRequest(BaseModel):
    """Modèle pour créer un payment intent (Stripe)."""
    transaction_id: int = Field(..., gt=0)
    montant: float = Field(..., gt=0)
    type_paiement: str = Field(..., description="'depot' ou 'solde'")


class PaiementConfirmRequest(BaseModel):
    """Modèle pour confirmer un paiement."""
    payment_intent_id: str


class PaiementResponse(BaseModel):
    """Modèle pour répondre avec les données d'un paiement."""
    id: int
    transaction_id: int
    montant: float
    statut: StatutPaiement
    stripe_payment_intent_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Documents
# ============================================================================

class DocumentUploadRequest(BaseModel):
    """Modèle pour uploader un document."""
    transaction_id: int = Field(..., gt=0)
    type_document: str = Field(..., description="'compromis' ou 'acte'")
    url_s3: str = Field(..., description="URL du document sur S3")


class DocumentSignRequest(BaseModel):
    """Modèle pour signer un document (DocuSign)."""
    document_id: int = Field(..., gt=0)
    signature: str = Field(..., description="Signature encodée en base64 ou URL docusign")


class DocumentResponse(BaseModel):
    """Modèle pour répondre avec les données d'un document."""
    id: int
    transaction_id: int
    type_document: str
    url_s3: str
    statut_signature: str
    docusign_envelope_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Réponses génériques
# ============================================================================

class ErrorResponse(BaseModel):
    """Modèle pour les réponses d'erreur."""
    status: str = "error"
    error: str = Field(..., description="Code d'erreur unique")
    message: str = Field(..., description="Message d'erreur lisible")
    details: Optional[dict] = None


class SuccessResponse(BaseModel):
    """Modèle pour les réponses de succès."""
    status: str = "success"
    data: dict
    message: Optional[str] = None


class ListResponse(BaseModel):
    """Modèle pour les réponses de listes paginées."""
    status: str = "success"
    data: List
    total: int
    page: int
    page_size: int
    total_pages: int
