"""Routes FastAPI pour les notaires."""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app_fastapi.models import NotaireResponse, DashboardNotaireResponse
from app_fastapi.utils.auth import get_current_notaire
from app_fastapi.utils.errors import NotFoundError
from shared.database import get_db
from src.models.notaires import Notaire, TransactionNotaire

router = APIRouter()

@router.get("/", response_model=List[NotaireResponse], summary="Lister les notaires")
async def lister_notaires(db: Session = Depends(get_db)):
    """Lister tous les notaires disponibles."""
    notaires = db.query(Notaire).all()
    return notaires

@router.get("/{notaire_id}", response_model=NotaireResponse, summary="Récupérer un notaire")
async def get_notaire(
    notaire_id: int,
    db: Session = Depends(get_db)
):
    """Récupérer les détails d'un notaire."""
    notaire = db.query(Notaire).filter(Notaire.notaire_id == notaire_id).first()

    if not notaire:
        raise NotFoundError("Notaire", notaire_id)

    return notaire

@router.get("/{notaire_id}/dashboard", response_model=List[DashboardNotaireResponse], summary="Dashboard notaire")
async def dashboard_notaire(
    notaire_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_notaire)
):
    """
    Afficher le dashboard du notaire (transactions en cours).

    Seul le notaire lui-même peut voir son dashboard.
    """
    from src.models.notaires import Notaire as NotaireModel
    from src.models.annonces import Annonce

    # Vérifier que c'est le notaire demandé
    notaire = db.query(NotaireModel).filter(NotaireModel.notaire_id == notaire_id).first()
    if not notaire or notaire.utilisateur_id != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ce dashboard"
        )

    # Récupérer les transactions en cours
    transactions_en_cours = db.query(TransactionNotaire).filter(
        (TransactionNotaire.notaire_id == notaire_id) &
        (TransactionNotaire.statut.notin_(["finalisee", "echouee"]))
    ).all()

    # Construire les réponses du dashboard
    dashboard_items = []
    for transaction in transactions_en_cours:
        annonce = db.query(Annonce).filter(
            Annonce.annonce_id == transaction.annonce_id
        ).first()

        if annonce:
            item = DashboardNotaireResponse(
                id=transaction.transaction_notaire_id,
                titre_annonce=annonce.titre,
                montant_bien=float(transaction.prix_compromis),
                frais_estimés=0.0,  # TODO: Calculer les frais à partir des frais_notaire
                statut=transaction.statut,
                date_creation=transaction.date_creation,
                notaire=notaire
            )
            dashboard_items.append(item)

    return dashboard_items
