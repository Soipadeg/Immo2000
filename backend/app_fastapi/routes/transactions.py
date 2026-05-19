"""Routes FastAPI pour les transactions immobilières."""
from fastapi import APIRouter, status, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app_fastapi.models import TransactionResponse, SelectNotaireRequest
from app_fastapi.utils.auth import get_current_user
from app_fastapi.utils.errors import NotFoundError
from shared.database import get_db
from src.models.notaires import TransactionNotaire

router = APIRouter()

@router.get("/{transaction_id}", response_model=TransactionResponse, summary="Récupérer une transaction")
async def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Récupérer les détails d'une transaction."""
    transaction = db.query(TransactionNotaire).filter(
        TransactionNotaire.transaction_notaire_id == transaction_id
    ).first()

    if not transaction:
        raise NotFoundError("Transaction", transaction_id)

    user_id = user["user_id"]
    if transaction.acheteur_id != user_id and transaction.vendeur_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à cette transaction"
        )

    return transaction

@router.get("/", response_model=List[TransactionResponse], summary="Lister les transactions")
async def lister_transactions(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Lister toutes les transactions de l'utilisateur."""
    user_id = user["user_id"]
    transactions = db.query(TransactionNotaire).filter(
        (TransactionNotaire.acheteur_id == user_id) | (TransactionNotaire.vendeur_id == user_id)
    ).all()
    return transactions

@router.post("/{transaction_id}/select-notaire", response_model=TransactionResponse, summary="Sélectionner un notaire")
async def select_notaire(
    transaction_id: int,
    data: SelectNotaireRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Sélectionner un notaire pour une transaction."""
    from src.models.notaires import Notaire

    transaction = db.query(TransactionNotaire).filter(
        TransactionNotaire.transaction_notaire_id == transaction_id
    ).first()

    if not transaction:
        raise NotFoundError("Transaction", transaction_id)

    if transaction.acheteur_id != user["user_id"] and transaction.vendeur_id != user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    notaire = db.query(Notaire).filter(Notaire.notaire_id == data.notaire_id).first()
    if not notaire:
        raise NotFoundError("Notaire", data.notaire_id)

    transaction.notaire_id = data.notaire_id
    transaction.statut = "notaire_selectionne"
    transaction.date_assignation_notaire = datetime.utcnow()

    db.commit()
    db.refresh(transaction)

    return transaction

@router.post("/{transaction_id}/validate-fees", response_model=TransactionResponse, summary="Valider les frais")
async def validate_fees(
    transaction_id: int,
    montant_frais: float,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Valider les frais de notaire."""
    from src.models.notaires import Notaire

    transaction = db.query(TransactionNotaire).filter(
        TransactionNotaire.transaction_notaire_id == transaction_id
    ).first()

    if not transaction:
        raise NotFoundError("Transaction", transaction_id)

    notaire = db.query(Notaire).filter(Notaire.notaire_id == transaction.notaire_id).first()
    if not notaire or notaire.utilisateur_id != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le notaire assigné peut valider les frais"
        )

    transaction.statut = "frais_valides"
    transaction.date_validation = datetime.utcnow()

    db.commit()
    db.refresh(transaction)

    return transaction
