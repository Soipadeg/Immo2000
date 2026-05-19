"""
Routes FastAPI pour les offres immobilières.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app_fastapi.models import OffreCreate, OffreResponse, OffreUpdate, OffreRepondre
from app_fastapi.config import settings
from app_fastapi.utils.auth import get_current_user
from app_fastapi.utils.errors import NotFoundError
from shared.database import get_db
from src.models.offres import Offre

router = APIRouter()


@router.post(
    "/",
    response_model=OffreResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une offre"
)
async def creer_offre(
    offre: OffreCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Créer une nouvelle offre sur une annonce.

    - **annonce_id**: ID de l'annonce
    - **montant**: Montant proposé en euros
    - **conditions_suspensives**: Conditions spéciales (optionnel)
    - **message**: Message au vendeur (optionnel)
    """
    from src.models.annonces import Annonce

    # Vérifier que l'annonce existe et récupérer le vendeur
    annonce = db.query(Annonce).filter(Annonce.annonce_id == offre.annonce_id).first()
    if not annonce:
        raise NotFoundError("Annonce", offre.annonce_id)

    # Créer l'offre
    nouvelle_offre = Offre(
        annonce_id=offre.annonce_id,
        acheteur_id=user["user_id"],
        vendeur_id=annonce.utilisateur_id,  # Le vendeur de l'annonce
        prix_propose=offre.montant,
        statut="proposee",
        message=offre.message,
        conditions_suspensives=offre.conditions_suspensives,
        date_offre=datetime.utcnow(),
        date_expiration=datetime.utcnow() + timedelta(days=7)  # Expire après 7 jours
    )

    db.add(nouvelle_offre)
    db.commit()
    db.refresh(nouvelle_offre)

    return nouvelle_offre


@router.get(
    "/{offre_id}",
    response_model=OffreResponse,
    summary="Récupérer une offre"
)
async def get_offre(
    offre_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Récupérer les détails d'une offre par son ID.

    L'utilisateur ne peut voir que :
    - Ses propres offres (acheteur)
    - Les offres reçues sur ses annonces (vendeur)
    """
    offre = db.query(Offre).filter(Offre.offre_id == offre_id).first()

    if not offre:
        raise NotFoundError("Offre", offre_id)

    # Vérifier les permissions
    user_id = user["user_id"]
    if offre.acheteur_id != user_id and offre.vendeur_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à cette offre"
        )

    return offre


@router.get(
    "/annonce/{annonce_id}",
    response_model=List[OffreResponse],
    summary="Lister les offres pour une annonce"
)
async def lister_offres_annonce(
    annonce_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Lister toutes les offres reçues pour une annonce."""
    offres = db.query(Offre).filter(Offre.annonce_id == annonce_id).all()
    return offres


@router.post(
    "/{offre_id}/repondre",
    response_model=OffreResponse,
    summary="Répondre à une offre"
)
async def repondre_offre(
    offre_id: int,
    reponse: OffreRepondre,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Répondre à une offre (accepter, refuser ou négocier).

    - **action**: 'accepter', 'refuser' ou 'negocier'
    - **contre_proposition**: Montant de la contre-offre (si action='negocier')
    """
    offre = db.query(Offre).filter(Offre.offre_id == offre_id).first()

    if not offre:
        raise NotFoundError("Offre", offre_id)

    if offre.vendeur_id != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le vendeur peut répondre à cette offre"
        )

    # Traiter la réponse
    if reponse.action == "accepter":
        offre.statut = "acceptee"
        offre.date_reponse = datetime.utcnow()
        offre.date_acceptation = datetime.utcnow()

    elif reponse.action == "refuser":
        offre.statut = "refusee"
        offre.date_reponse = datetime.utcnow()

    elif reponse.action == "negocier":
        if reponse.contre_proposition is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Veuillez fournir un montant pour la contre-proposition"
            )
        offre.statut = "negociation"
        offre.contre_proposition = reponse.contre_proposition
        offre.date_reponse = datetime.utcnow()

    db.commit()
    db.refresh(offre)

    return offre


@router.put(
    "/{offre_id}",
    response_model=OffreResponse,
    summary="Mettre à jour une offre"
)
async def update_offre(
    offre_id: int,
    offre: OffreUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Mettre à jour les détails d'une offre."""
    offre_obj = db.query(Offre).filter(Offre.offre_id == offre_id).first()

    if not offre_obj:
        raise NotFoundError("Offre", offre_id)

    if offre_obj.acheteur_id != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul l'acheteur peut modifier son offre"
        )

    # Mettre à jour les champs fournis
    if offre.message is not None:
        offre_obj.message = offre.message

    db.commit()
    db.refresh(offre_obj)

    return offre_obj
