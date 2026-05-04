"""
Schémas Pydantic pour validation des annonces.

Fournit :
- CreateAnnonce : Schéma pour la création (POST)
- UpdateAnnonce : Schéma pour la mise à jour (PUT)
- AnnoncesResponse : Schéma de réponse single
- AnnoncesListResponse : Schéma de réponse paginated
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re


class TypeBienEnum(str, Enum):
    """Énumération des types de biens autorisés."""
    MAISON = "maison"
    APPARTEMENT = "appartement"
    TERRAIN = "terrain"
    LOCAL_COMMERCIAL = "local commercial"


class StatutEnum(str, Enum):
    """Énumération des statuts d'annonce."""
    BROUILLON = "brouillon"
    PUBLIEE = "publiée"
    VENDUE = "vendue"
    ARCHIVEE = "archivée"


class DPEEnum(str, Enum):
    """Énumération des classes énergétiques DPE."""
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"


class CreateAnnonce(BaseModel):
    """
    Schéma pour la création d'une annonce (POST /annonces).

    Tous les champs obligatoires doivent être présents.
    Les champs optionnels peuvent être omis.
    """

    # Champs obligatoires
    titre: str = Field(..., min_length=1, max_length=100, description="Titre de l'annonce")
    description: str = Field(..., min_length=1, max_length=2000, description="Description détaillée")
    prix: float = Field(..., gt=0, description="Prix en euros (> 0)")
    surface: float = Field(..., gt=0, description="Surface en m² (> 0)")
    adresse: str = Field(..., min_length=1, max_length=255, description="Adresse complète")
    code_postal: str = Field(..., description="Code postal (5 chiffres)")
    ville: str = Field(..., min_length=1, max_length=100, description="Ville")
    type_bien: TypeBienEnum = Field(..., description="Type de bien")
    nombre_pieces: int = Field(..., ge=1, description="Nombre de pièces (>= 1)")

    # Champs optionnels
    photos: Optional[List[str]] = Field(default=None, description="URLs des photos")
    etage: Optional[int] = Field(default=None, description="Numéro d'étage")
    ascenseur: bool = Field(default=False, description="Présence ascenseur")
    balcon: bool = Field(default=False, description="Présence balcon")
    terrasse: bool = Field(default=False, description="Présence terrasse")
    jardin: bool = Field(default=False, description="Présence jardin")
    piscine: bool = Field(default=False, description="Présence piscine")
    parking: bool = Field(default=False, description="Présence parking")
    dpe: Optional[DPEEnum] = Field(default=None, description="Classe énergétique (A-G)")
    annee_construction: Optional[int] = Field(default=None, ge=1800, le=2100, description="Année de construction")

    class Config:
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "titre": "Maison 4 pièces à Paris",
                "description": "Belle maison lumineuse avec jardin...",
                "prix": 500000.0,
                "surface": 120.5,
                "adresse": "12 rue de la Paix",
                "code_postal": "75002",
                "ville": "Paris",
                "type_bien": "maison",
                "nombre_pieces": 4,
                "photos": ["url1", "url2"],
                "jardin": True,
                "dpe": "C",
                "annee_construction": 2010,
            }
        }

    @validator("code_postal")
    def validate_code_postal(cls, v):
        """Valide que le code postal est au format français (5 chiffres)."""
        if not re.match(r"^\d{5}$", v):
            raise ValueError("Code postal invalide (doit être 5 chiffres)")
        return v

    @validator("photos", pre=True, always=True)
    def validate_photos(cls, v):
        """Valide et nettoie la liste des photos."""
        if v is None:
            return []
        if not isinstance(v, list):
            raise ValueError("photos doit être une liste d'URLs")
        return [str(url) for url in v if url]


class UpdateAnnonce(BaseModel):
    """
    Schéma pour la mise à jour d'une annonce (PUT /annonces/{id}).

    Tous les champs sont optionnels. Seuls les champs fournis sont mis à jour.
    """

    titre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, min_length=1, max_length=2000)
    prix: Optional[float] = Field(default=None, gt=0)
    surface: Optional[float] = Field(default=None, gt=0)
    adresse: Optional[str] = Field(default=None, min_length=1, max_length=255)
    code_postal: Optional[str] = Field(default=None)
    ville: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type_bien: Optional[TypeBienEnum] = Field(default=None)
    nombre_pieces: Optional[int] = Field(default=None, ge=1)
    photos: Optional[List[str]] = Field(default=None)
    etage: Optional[int] = Field(default=None)
    ascenseur: Optional[bool] = Field(default=None)
    balcon: Optional[bool] = Field(default=None)
    terrasse: Optional[bool] = Field(default=None)
    jardin: Optional[bool] = Field(default=None)
    piscine: Optional[bool] = Field(default=None)
    parking: Optional[bool] = Field(default=None)
    dpe: Optional[DPEEnum] = Field(default=None)
    annee_construction: Optional[int] = Field(default=None, ge=1800, le=2100)
    statut: Optional[StatutEnum] = Field(default=None)

    class Config:
        use_enum_values = True

    @validator("code_postal", pre=True, always=True)
    def validate_code_postal(cls, v):
        """Valide le code postal s'il est fourni."""
        if v is not None and not re.match(r"^\d{5}$", v):
            raise ValueError("Code postal invalide (doit être 5 chiffres)")
        return v


class AnnoncesResponse(BaseModel):
    """
    Schéma de réponse pour une annonce unique.

    Utilisé pour les réponses GET /annonces/{id}, POST /annonces, PUT /annonces/{id}.
    """

    annonce_id: int
    titre: str
    description: str
    prix: float
    surface: float
    adresse: str
    code_postal: str
    ville: str
    type_bien: str
    nombre_pieces: int
    utilisateur_id: int
    photos: List[str] = []
    etage: Optional[int] = None
    ascenseur: bool = False
    balcon: bool = False
    terrasse: bool = False
    jardin: bool = False
    piscine: bool = False
    parking: bool = False
    dpe: Optional[str] = None
    annee_construction: Optional[int] = None
    statut: str = "brouillon"
    date_creation: datetime
    date_modification: datetime
    date_statut: datetime
    date_vente: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "annonce_id": 1,
                "titre": "Maison 4 pièces à Paris",
                "description": "Belle maison lumineuse...",
                "prix": 500000.0,
                "surface": 120.5,
                "adresse": "12 rue de la Paix",
                "code_postal": "75002",
                "ville": "Paris",
                "type_bien": "maison",
                "nombre_pieces": 4,
                "utilisateur_id": 123,
                "photos": ["url1", "url2"],
                "statut": "publiée",
                "date_creation": "2026-05-04T10:00:00",
                "date_modification": "2026-05-04T10:00:00",
                "date_statut": "2026-05-04T10:00:00",
                "date_vente": None,
            }
        }


class AnnoncesListResponse(BaseModel):
    """
    Schéma de réponse pour la liste paginated d'annonces.

    Utilisé pour GET /annonces?skip=0&limit=20
    """

    items: List[AnnoncesResponse]
    total: int
    skip: int
    limit: int

    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 0,
                "skip": 0,
                "limit": 20,
            }
        }


class ErrorResponse(BaseModel):
    """Schéma pour les réponses d'erreur."""

    error: str
    code: int
    details: Optional[dict] = None

    class Config:
        json_schema_extra = {
            "example": {
                "error": "Annonce non trouvée",
                "code": 404,
                "details": {"annonce_id": 999}
            }
        }
