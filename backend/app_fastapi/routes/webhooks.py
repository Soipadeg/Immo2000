"""
Webhooks routes pour FastAPI - Phase 6g
Gère les webhooks DocuSign, notifications et audit trail
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
import logging
import json
import hmac
import hashlib

from shared.database import get_db
from app_fastapi.utils.integrations import get_docusign_client, get_sendgrid_client
from src.models.notaires import TransactionNotaire

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


# ============================================================================
# DocuSign Webhooks
# ============================================================================

@router.post("/docusign/envelope-status")
async def handle_docusign_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Webhook DocuSign pour les changements de statut d'enveloppe.

    Statuts possibles:
    - sent: Enveloppe envoyée aux signataires
    - delivered: Enveloppe livrée aux signataires
    - signed: Au moins un signataire a signé
    - completed: Tous les signataires ont signé
    - declined: Un signataire a refusé
    - voided: Enveloppe annulée

    Payload DocuSign:
    {
        "envelopeId": "...",
        "status": "completed",
        "completedDateTime": "2026-05-19T12:00:00Z",
        "recipientStatuses": [
            {
                "type": "signer",
                "email": "...",
                "status": "completed",
                "signedDateTime": "2026-05-19T12:00:00Z"
            }
        ]
    }
    """

    try:
        payload = await request.json()
        logger.info(f"📨 DocuSign webhook reçu: {payload.get('envelopeId')}")

        envelope_id = payload.get("envelopeId")
        status = payload.get("status")
        recipient_statuses = payload.get("recipientStatuses", [])

        # Valider que l'enveloppe existe
        transaction = db.query(TransactionNotaire).filter(
            TransactionNotaire.docusign_envelope_id == envelope_id
        ).first()

        if not transaction:
            logger.warning(f"⚠️ Envelope introuvable: {envelope_id}")
            return {"status": "ignored", "reason": "envelope_not_found"}

        logger.info(f"📄 Transaction trouvée: {transaction.transaction_notaire_id}, Status: {status}")

        # Traiter selon le statut
        if status == "completed":
            await _handle_completed(transaction, payload, db)
        elif status == "declined":
            await _handle_declined(transaction, payload, db)
        elif status == "sent":
            await _handle_sent(transaction, payload, db)
        elif status == "voided":
            await _handle_voided(transaction, payload, db)

        # Commit les changements
        db.commit()

        return {
            "status": "processed",
            "envelope_id": envelope_id,
            "transaction_id": transaction.transaction_notaire_id
        }

    except Exception as e:
        logger.error(f"❌ Erreur webhook DocuSign: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


async def _handle_completed(transaction: TransactionNotaire, payload: dict, db: Session):
    """Traiter l'enveloppe complètement signée."""
    logger.info(f"✅ Enveloppe complétée: {transaction.transaction_notaire_id}")

    transaction.statut = "finalisee"
    transaction.date_completion = datetime.utcnow()

    # Créer audit trail
    _create_audit_log(transaction, "SIGNATURE_COMPLETE", payload, db)

    # Envoyer notifications
    await _send_completion_emails(transaction, db)

    logger.info(f"✅ Transaction finalisée: {transaction.transaction_notaire_id}")


async def _handle_declined(transaction: TransactionNotaire, payload: dict, db: Session):
    """Traiter le refus de signature."""
    logger.warning(f"❌ Enveloppe refusée: {transaction.transaction_notaire_id}")

    declined_by = None
    for recipient in payload.get("recipientStatuses", []):
        if recipient.get("status") == "declined":
            declined_by = recipient.get("email")
            break

    transaction.statut = "signature_refusee"
    transaction.notes_internes = f"Signature refusée par: {declined_by}"

    # Créer audit trail
    _create_audit_log(transaction, "SIGNATURE_DECLINED", payload, db)

    # Envoyer notifications
    await _send_declined_emails(transaction, declined_by, db)

    logger.warning(f"❌ Signature refusée par {declined_by}: {transaction.transaction_notaire_id}")


async def _handle_sent(transaction: TransactionNotaire, payload: dict, db: Session):
    """Traiter l'envoi de l'enveloppe."""
    logger.info(f"📤 Enveloppe envoyée: {transaction.transaction_notaire_id}")

    transaction.statut = "compromis_envoye_confirme"

    # Créer audit trail
    _create_audit_log(transaction, "ENVELOPE_SENT", payload, db)


async def _handle_voided(transaction: TransactionNotaire, payload: dict, db: Session):
    """Traiter l'annulation de l'enveloppe."""
    logger.warning(f"⛔ Enveloppe annulée: {transaction.transaction_notaire_id}")

    transaction.statut = "compromis_annule"

    # Créer audit trail
    _create_audit_log(transaction, "ENVELOPE_VOIDED", payload, db)


# ============================================================================
# Email Notifications
# ============================================================================

async def _send_completion_emails(transaction: TransactionNotaire, db: Session):
    """Envoyer les emails de confirmation de signature."""
    try:
        # Récupérer les informations des parties
        from src.models.utilisateurs import User

        vendeur = db.query(User).filter(User.utilisateur_id == transaction.vendeur_id).first()
        acheteur = db.query(User).filter(User.utilisateur_id == transaction.acheteur_id).first()
        notaire = db.query(User).filter(User.utilisateur_id == transaction.notaire_id).first()

        if not vendeur or not acheteur or not notaire:
            logger.warning(f"⚠️ Utilisateurs manquants pour la transaction {transaction.transaction_notaire_id}")
            return

        sendgrid = get_sendgrid_client()

        # Email au vendeur
        subject_vendeur = "✅ Compromis de vente signé - Transaction finalisée"
        message_vendeur = f"""
Bonjour {vendeur.prenom},

Nous vous confirmons que le compromis de vente a été signé par toutes les parties.

Détails de la transaction:
- Bien: {transaction.prix_compromis} €
- Notaire: {notaire.prenom} {notaire.nom}
- Acheteur: {acheteur.prenom} {acheteur.nom}

Votre dossier est maintenant finalisé. Notre équipe vous contactera pour les prochaines étapes.

Cordialement,
Immo2000
"""

        # Email à l'acheteur
        subject_acheteur = "✅ Compromis de vente signé - Félicitations!"
        message_acheteur = f"""
Bonjour {acheteur.prenom},

Nous vous confirmons que le compromis de vente a été signé par toutes les parties.

Détails de la transaction:
- Bien: {transaction.prix_compromis} €
- Notaire: {notaire.prenom} {notaire.nom}
- Vendeur: {vendeur.prenom} {vendeur.nom}

Vous pouvez maintenant procéder aux démarches suivantes avec le notaire.

Cordialement,
Immo2000
"""

        # Email au notaire
        subject_notaire = "✅ Compromis signé - Action requise"
        message_notaire = f"""
Bonjour {notaire.prenom},

Le compromis de vente a été signé par toutes les parties.

Transaction finalisée:
- Bien: {transaction.prix_compromis} €
- Vendeur: {vendeur.prenom} {vendeur.nom}
- Acheteur: {acheteur.prenom} {acheteur.nom}

Veuillez procéder à la finalisation du dossier.

Cordialement,
Immo2000 Admin
"""

        # Envoyer les emails (async)
        await sendgrid.send_email(vendeur.email, subject_vendeur, message_vendeur)
        await sendgrid.send_email(acheteur.email, subject_acheteur, message_acheteur)
        await sendgrid.send_email(notaire.email, subject_notaire, message_notaire)

        logger.info(f"✅ Emails envoyés pour transaction {transaction.transaction_notaire_id}")

    except Exception as e:
        logger.error(f"❌ Erreur envoi emails: {str(e)}", exc_info=True)


async def _send_declined_emails(transaction: TransactionNotaire, declined_by: str, db: Session):
    """Envoyer les emails de refus de signature."""
    try:
        from src.models.utilisateurs import User

        vendeur = db.query(User).filter(User.utilisateur_id == transaction.vendeur_id).first()
        acheteur = db.query(User).filter(User.utilisateur_id == transaction.acheteur_id).first()
        notaire = db.query(User).filter(User.utilisateur_id == transaction.notaire_id).first()

        if not vendeur or not acheteur or not notaire:
            return

        sendgrid = get_sendgrid_client()

        subject = "⚠️ Signature refusée - Action requise"
        message = f"""
Nous regrettons de vous informer que le compromis de vente a été refusé.

Détails:
- Transaction: {transaction.transaction_notaire_id}
- Refusé par: {declined_by}
- Bien: {transaction.prix_compromis} €

Veuillez contacter le notaire pour discuter des prochaines étapes.

Cordialement,
Immo2000
"""

        # Envoyer aux trois parties
        await sendgrid.send_email(vendeur.email, subject, message)
        await sendgrid.send_email(acheteur.email, subject, message)
        await sendgrid.send_email(notaire.email, subject, message)

        logger.info(f"✅ Emails de refus envoyés pour transaction {transaction.transaction_notaire_id}")

    except Exception as e:
        logger.error(f"❌ Erreur envoi emails de refus: {str(e)}", exc_info=True)


# ============================================================================
# Audit Trail
# ============================================================================

def _create_audit_log(transaction: TransactionNotaire, action: str, payload: dict, db: Session):
    """Créer une entrée d'audit trail."""
    try:
        from src.models.notaires import HistoriqueNotaire

        # Créer entrée historique
        historique = HistoriqueNotaire(
            transaction_notaire_id=transaction.transaction_notaire_id,
            notaire_id=transaction.notaire_id,
            action=action,
            description=f"Webhook DocuSign: {action}",
            details_json=json.dumps(payload),
            date_action=datetime.utcnow()
        )

        db.add(historique)
        logger.info(f"📝 Audit log créé: {action} pour transaction {transaction.transaction_notaire_id}")

    except Exception as e:
        logger.error(f"❌ Erreur création audit log: {str(e)}", exc_info=True)


# ============================================================================
# Health Check
# ============================================================================

@router.get("/docusign/health")
async def webhook_health():
    """Vérifier que le webhook DocuSign est accessible."""
    return {
        "status": "ok",
        "service": "DocuSign Webhooks",
        "timestamp": datetime.utcnow().isoformat()
    }
