"""Routes FastAPI pour les paiements."""
from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app_fastapi.models import PaiementResponse, PaiementIntentRequest, PaiementConfirmRequest
from app_fastapi.utils.auth import get_current_user
from app_fastapi.utils.errors import NotFoundError
from app_fastapi.utils.integrations import get_stripe_client, get_sendgrid_client
from shared.database import get_db
from src.models.paiements import Paiement
from src.models.notaires import TransactionNotaire

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/create-intent", response_model=dict, summary="Créer un payment intent")
async def create_payment_intent(
    data: PaiementIntentRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Créer un payment intent (Stripe).

    Retourne un client_secret à utiliser côté frontend pour 3D Secure.
    """
    try:
        stripe = get_stripe_client()

        # Vérifier que la transaction existe
        transaction = db.query(TransactionNotaire).filter(
            TransactionNotaire.transaction_notaire_id == data.transaction_id
        ).first()

        if not transaction:
            raise NotFoundError("Transaction", data.transaction_id)

        # Vérifier les permissions (acheteur seulement)
        if transaction.acheteur_id != user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul l'acheteur peut créer un paiement"
            )

        # Créer l'intent avec Stripe
        intent_response = {
            "status": "success",
            "client_secret": f"pi_test_{data.transaction_id}",  # Placeholder
            "payment_intent_id": f"pi_{data.transaction_id}",
            "amount": data.montant,
            "currency": "EUR"
        }

        return intent_response

    except Exception as e:
        logger.error(f"Erreur création payment intent: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur Stripe: {str(e)}"
        )

@router.post("/confirm", response_model=PaiementResponse, summary="Confirmer un paiement")
async def confirm_payment(
    data: PaiementConfirmRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Confirmer un paiement après authentification 3D Secure."""
    try:
        stripe = get_stripe_client()
        sendgrid = get_sendgrid_client()

        # Créer une entrée Paiement en BD
        paiement = Paiement(
            transaction_notaire_id=int(data.payment_intent_id.split("_")[-1]),  # Parse transaction ID
            utilisateur_id=user["user_id"],
            montant=data.amount,
            type_paiement="depot",
            stripe_payment_intent_id=data.payment_intent_id,
            statut="reussi",
            date_paiement=datetime.utcnow()
        )

        db.add(paiement)
        db.commit()
        db.refresh(paiement)

        # Envoyer une notification via SendGrid en background
        user_email = user.get("email", "user@example.com")
        background_tasks.add_task(
            sendgrid.send_transaction_notification,
            user_email,
            paiement.transaction_notaire_id,
            "payment_confirmed"
        )

        logger.info(f"Paiement confirmé: {paiement.paiement_id}")

        return paiement

    except Exception as e:
        logger.error(f"Erreur confirmation paiement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.get("/{paiement_id}", response_model=PaiementResponse, summary="Récupérer un paiement")
async def get_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Récupérer les détails d'un paiement."""
    paiement = db.query(Paiement).filter(Paiement.paiement_id == paiement_id).first()

    if not paiement:
        raise NotFoundError("Paiement", paiement_id)

    # Vérifier les permissions
    if paiement.utilisateur_id != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ce paiement"
        )

    return paiement

@router.post("/webhook/stripe", summary="Webhook Stripe")
async def stripe_webhook(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Webhook pour les événements Stripe.

    Gère les événements: payment_intent.succeeded, charge.failed, charge.refunded
    """
    import stripe
    from app_fastapi.config import settings
    import hmac
    import json

    stripe.api_key = settings.STRIPE_SECRET_KEY

    # Récupérer la signature du header
    sig_header = request.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Signature manquante")

    try:
        # Vérifier l'authenticité de la requête (TODO: utiliser le body brut)
        event_data = request
        event_type = event_data.get("type")

        if event_type == "payment_intent.succeeded":
            payment_intent = event_data.get("data", {}).get("object", {})
            payment_intent_id = payment_intent.get("id")

            # Trouver le paiement correspondant
            paiement = db.query(Paiement).filter(
                Paiement.stripe_payment_intent_id == payment_intent_id
            ).first()

            if paiement:
                paiement.statut = "reussi"
                db.commit()

        elif event_type == "charge.failed":
            charge = event_data.get("data", {}).get("object", {})
            payment_intent_id = charge.get("payment_intent")

            # Trouver le paiement correspondant
            paiement = db.query(Paiement).filter(
                Paiement.stripe_payment_intent_id == payment_intent_id
            ).first()

            if paiement:
                paiement.statut = "echoue"
                db.commit()

        elif event_type == "charge.refunded":
            charge = event_data.get("data", {}).get("object", {})
            payment_intent_id = charge.get("payment_intent")

            # Trouver le paiement correspondant
            paiement = db.query(Paiement).filter(
                Paiement.stripe_payment_intent_id == payment_intent_id
            ).first()

            if paiement:
                paiement.statut = "remboursé"
                db.commit()

        return {"status": "success", "event": event_type}

    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=401, detail="Signature invalide")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur webhook: {str(e)}")
