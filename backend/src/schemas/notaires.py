"""
Schémas Pydantic pour validation des données notaires.

Fournit :
- NotaireCreate : Création profil notaire
- NotaireUpdate : Mise à jour profil
- NotaireResponse : Réponse simple
- NotaireDetailResponse : Réponse détaillée
- TransactionNotaireCreate : Création transaction
- TransactionNotaireUpdate : Mise à jour transaction
- DocumentNotaireCreate : Upload document
"""

from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


# ===== ENUMS =====

class SpecialisationEnum(str, Enum):
    """Types de spécialisations notaire."""
    VENTE = "vente"
    SUCCESSION = "succession"
    DONATION = "donation"
    DIVORCE = "divorce"
    HYPOTHEQUE = "hypotheque"
    TESTAMENT = "testament"


class TypeDocumentEnum(str, Enum):
    """Types de documents notaire."""
    COMPROMIS = "compromis"
    DPE = "dpe"
    DIAGNOSTICS = "diagnostics"
    ETAT_PARASITAIRE = "etat_parasitaire"
    IDENTITE_VENDEUR = "identite_vendeur"
    IDENTITE_ACHETEUR = "identite_acheteur"
    JUSTIFICATIF_DOMICILE = "justificatif_domicile"
    AUTRES = "autres"


class StatutTransactionEnum(str, Enum):
    """Statuts d'une transaction notaire."""
    EN_ATTENTE_SELECTION = "en_attente_selection"
    EN_ATTENTE_VALIDATION = "en_attente_validation"
    MODIFICATIONS_DEMANDEES = "modifications_demandees"
    VALIDEE = "validee"
    REFUSEE = "refusee"
    REJETEE = "rejetee"
    FINALISEE = "finalisee"


# ===== NOTAIRE SCHEMAS =====

class NotaireCreate(BaseModel):
    """Schéma pour créer un profil notaire."""

    etude_notariale: str = Field(..., min_length=3, max_length=255, description="Nom de l'étude")
    numero_rpps: str = Field(..., min_length=5, max_length=20, description="Numéro RPPS (unique)")
    adresse_etude: str = Field(..., min_length=5, max_length=500)
    code_postal_etude: str = Field(..., pattern=r"^\d{5}$", description="Code postal français")
    ville_etude: str = Field(..., min_length=2, max_length=100)

    telephone: str = Field(..., pattern=r"^\+?[0-9\s\-\.]{9,20}$")
    email_professionnel: EmailStr

    # Zone géographique: {"villes": ["Paris", "Lyon"], "codes_postaux": ["75000", "69000"]}
    zone_geographique: Dict = Field(..., description="Zone de couverture")

    specialisations: Optional[List[str]] = Field(default=None, description="Types de spécialisation")
    disponibilites: Optional[Dict] = Field(default=None, description="Horaires: {'lundi': '09:00-17:00'}")

    max_dossiers_simultanees: int = Field(default=10, ge=1, le=50)
    delai_traitement_jours: int = Field(default=5, ge=1, le=30)

    class Config:
        json_schema_extra = {
            "example": {
                "etude_notariale": "Étude Dupont & Associés",
                "numero_rpps": "12345678901",
                "adresse_etude": "123 Rue de Paris",
                "code_postal_etude": "75000",
                "ville_etude": "Paris",
                "telephone": "+33612345678",
                "email_professionnel": "contact@etude-dupont.fr",
                "zone_geographique": {
                    "villes": ["Paris", "Boulogne"],
                    "codes_postaux": ["75000", "75015", "92100"]
                },
                "specialisations": ["vente", "succession"],
                "max_dossiers_simultanees": 15,
                "delai_traitement_jours": 7
            }
        }


class NotaireUpdate(BaseModel):
    """Schéma pour mettre à jour un profil notaire."""

    etude_notariale: Optional[str] = Field(None, max_length=255)
    adresse_etude: Optional[str] = Field(None, max_length=500)
    telephone: Optional[str] = None
    zone_geographique: Optional[Dict] = None
    disponibilites: Optional[Dict] = None
    max_dossiers_simultanees: Optional[int] = Field(None, ge=1, le=50)
    delai_traitement_jours: Optional[int] = Field(None, ge=1, le=30)
    partenaire_actif: Optional[bool] = None


class NotaireResponse(BaseModel):
    """Réponse simple pour notaire."""

    notaire_id: int
    etude_notariale: str
    numero_rpps: str
    ville_etude: str
    telephone: str
    email_professionnel: str
    partenaire_actif: bool
    note_moyenne: float
    dossiers_traites: int
    delai_traitement_jours: int

    class Config:
        from_attributes = True


class NotaireDetailResponse(BaseModel):
    """Réponse détaillée pour notaire."""

    notaire_id: int
    etude_notariale: str
    numero_rpps: str
    adresse_etude: str
    code_postal_etude: str
    ville_etude: str
    latitude: Optional[float]
    longitude: Optional[float]

    telephone: str
    email_professionnel: str

    zone_geographique: Dict
    partenaire_actif: bool
    date_activation_partenaire: datetime

    note_moyenne: float
    dossiers_traites: int
    max_dossiers_simultanees: int
    delai_traitement_jours: int

    date_creation: datetime

    class Config:
        from_attributes = True


# ===== TRANSACTION NOTAIRE SCHEMAS =====

class TransactionNotaireCreate(BaseModel):
    """Schéma pour créer une transaction notaire (assignation)."""

    offre_id: int
    annonce_id: int
    notaire_id: Optional[int] = None
    vendeur_id: int
    acheteur_id: int
    prix_compromis: float = Field(..., gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "offre_id": 1,
                "annonce_id": 5,
                "notaire_id": 1,
                "vendeur_id": 10,
                "acheteur_id": 11,
                "prix_compromis": 350000.00
            }
        }


class TransactionNotaireValidate(BaseModel):
    """Schéma pour valider un compromis (action notaire)."""

    commentaires: Optional[str] = Field(None, max_length=1000, description="Commentaires du notaire")


class TransactionNotaireModifications(BaseModel):
    """Schéma pour demander des modifications (action notaire)."""

    modifications_demandees: str = Field(..., min_length=10, max_length=2000, description="Détail des modifications")
    delai_jours: int = Field(default=5, ge=1, le=30, description="Délai pour apporter modifications")


class TransactionNotaireRejet(BaseModel):
    """Schéma pour refuser un compromis (action notaire)."""

    raison_refus: str = Field(..., min_length=10, max_length=2000, description="Raison du refus")


class TransactionNotaireAssign(BaseModel):
    """Assigner une transaction notaire à un notaire."""
    notaire_id: int = Field(..., gt=0, description="ID du notaire assigné")


class TransactionNotaireResponse(BaseModel):
    """Réponse simple pour transaction notaire."""

    transaction_notaire_id: int
    offre_id: int
    annonce_id: int
    notaire_id: Optional[int]
    statut: str
    prix_compromis: float
    date_creation: datetime
    date_validation: Optional[datetime]

    class Config:
        from_attributes = True


class TransactionNotaireDetailResponse(BaseModel):
    """Réponse détaillée pour transaction notaire."""

    transaction_notaire_id: int
    offre_id: int
    annonce_id: int
    notaire_id: Optional[int]
    vendeur_id: int
    acheteur_id: int

    statut: str
    prix_compromis: float

    date_creation: datetime
    date_assignation_notaire: Optional[datetime]
    date_validation: Optional[datetime]
    date_completion: Optional[datetime]

    delai_demande: Optional[datetime]
    delai_validation: Optional[datetime]

    raison_refus: Optional[str]
    modifications_demandees: Optional[str]

    class Config:
        from_attributes = True


# ===== DOCUMENT NOTAIRE SCHEMAS =====

class DocumentNotaireCreate(BaseModel):
    """Schéma pour upload document notaire."""

    type_document: str = Field(..., description="Type de document")
    nom_original: str = Field(..., max_length=255)
    # fichier fourni en multipart/form-data


class DocumentNotaireResponse(BaseModel):
    """Réponse pour document notaire."""

    document_notaire_id: int
    transaction_notaire_id: int
    type_document: str
    nom_original: str
    taille_bytes: int
    validé_par_notaire: bool
    date_upload: datetime

    class Config:
        from_attributes = True


# ===== HISTORIQUE SCHEMAS =====

class HistoriqueNotaireResponse(BaseModel):
    """Réponse pour historique notaire."""

    historique_id: int
    type_action: str
    description: str
    ancien_statut: Optional[str]
    nouveau_statut: Optional[str]
    date_action: datetime

    class Config:
        from_attributes = True


# ===== LISTES PAGINÉES =====

class NotaireListResponse(BaseModel):
    """Réponse paginée pour liste notaires."""

    items: List[NotaireResponse]
    total: int
    skip: int
    limit: int


class TransactionNotaireListResponse(BaseModel):
    """Réponse paginée pour transactions notaires."""

    items: List[TransactionNotaireResponse]
    total: int
    skip: int
    limit: int


class DocumentNotaireListResponse(BaseModel):
    """Réponse paginée pour documents notaires."""

    items: List[DocumentNotaireResponse]
    total: int


# ===== RECHERCHE NOTAIRES =====

class SearchNotairesRequest(BaseModel):
    """Schéma pour rechercher notaires."""

    ville: Optional[str] = None
    code_postal: Optional[str] = None
    specialisation: Optional[str] = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=10, ge=1, le=50)

    class Config:
        json_schema_extra = {
            "example": {
                "ville": "Paris",
                "code_postal": "75000",
                "specialisation": "vente",
                "skip": 0,
                "limit": 10
            }
        }


# ===== DISPONIBILITES =====

class DisponibiliteNotaireCreate(BaseModel):
    """Schéma pour créer créneau disponibilité."""

    date_debut: datetime
    date_fin: datetime
    type_creneau: str = Field(default="disponible", description="disponible, indisponible, conge, formation")
    description: Optional[str] = None

    @validator('date_fin')
    def validate_dates(cls, v, values):
        if 'date_debut' in values and v <= values['date_debut']:
            raise ValueError('date_fin doit être après date_debut')
        return v


class DisponibiliteNotaireResponse(BaseModel):
    """Réponse pour créneau disponibilité."""

    disponibilite_id: int
    notaire_id: int
    date_debut: datetime
    date_fin: datetime
    type_creneau: str
    description: Optional[str]

    class Config:
        from_attributes = True
