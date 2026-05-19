"""Routes FastAPI pour les transactions immobilières."""
from fastapi import APIRouter, status, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app_fastapi.models import TransactionResponse, SelectNotaireRequest
from app_fastapi.utils.auth import get_current_user, get_current_notaire
from app_fastapi.utils.errors import NotFoundError
from app_fastapi.utils.pdf import generer_compromis_pdf
from app_fastapi.utils.integrations import get_docusign_client
from shared.database import get_db
from src.models.notaires import TransactionNotaire, Notaire
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Models
# ============================================================================

class ValiderFraisRequest(BaseModel):
    """Requête pour valider les frais."""
    montant_frais: float
    detail: Optional[str] = None
    action: str = "valider"  # "valider" ou "refuser"


class GenererCompromisRequest(BaseModel):
    """Requête pour générer le compromis."""
    titre: Optional[str] = None


class EnvoyerCompromisRequest(BaseModel):
    """Requête pour envoyer le compromis à DocuSign."""
    message: Optional[str] = None


# ============================================================================
# Routes
# ============================================================================

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

@router.post("/{transaction_id}/frais/valider", response_model=dict, summary="Valider les frais de notaire")
async def valider_frais(
    transaction_id: int,
    data: ValiderFraisRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_notaire)
):
    """
    Valider ou refuser les frais de notaire pour une transaction.

    Seul le notaire assigné peut valider les frais.
    Calcul automatique: Commission Immo2000 = 2% du prix final.
    """
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

    if data.montant_frais <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les frais doivent être supérieurs à 0"
        )

    if data.action == "valider":
        # Calculer les frais Immo2000 (2% du prix final)
        frais_immo2000 = transaction.prix_compromis * 0.02

        transaction.frais_notaire = data.montant_frais
        transaction.frais_immo2000 = frais_immo2000
        transaction.statut = "frais_valides"
        transaction.date_validation_frais = datetime.utcnow()

        logger.info(
            f"✅ Frais validés pour transaction {transaction_id}: "
            f"Notaire={data.montant_frais}€, Immo2000={frais_immo2000}€"
        )

        return {
            "message": "Frais validés avec succès",
            "transaction_id": transaction_id,
            "frais_notaire": data.montant_frais,
            "frais_immo2000": frais_immo2000,
            "total": transaction.prix_compromis + data.montant_frais + frais_immo2000
        }
    else:
        # Refuser les frais
        transaction.statut = "frais_refuses"
        transaction.date_validation_frais = datetime.utcnow()

        logger.info(f"❌ Frais refusés pour transaction {transaction_id}")

        return {
            "message": "Frais refusés",
            "transaction_id": transaction_id,
            "statut": "frais_refuses"
        }

    db.commit()

@router.post("/{transaction_id}/compromis/generer", response_model=dict, summary="Générer le compromis PDF")
async def generer_compromis(
    transaction_id: int,
    data: GenererCompromisRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_notaire)
):
    """
    Générer un PDF du compromis de vente pour une transaction.

    Seul le notaire assigné peut générer le compromis.
    """
    from src.auth.models import User
    from src.models.annonces import Annonce
    from app_fastapi.utils.integrations import get_aws_client

    transaction = db.query(TransactionNotaire).filter(
        TransactionNotaire.transaction_notaire_id == transaction_id
    ).first()

    if not transaction:
        raise NotFoundError("Transaction", transaction_id)

    notaire = db.query(Notaire).filter(Notaire.notaire_id == transaction.notaire_id).first()
    if not notaire or notaire.utilisateur_id != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le notaire assigné peut générer le compromis"
        )

    if transaction.statut != "frais_valides":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les frais doivent être validés avant de générer le compromis"
        )

    try:
        # Récupérer les infos nécessaires
        vendeur = db.query(User).filter(User.utilisateur_id == transaction.vendeur_id).first()
        acheteur = db.query(User).filter(User.utilisateur_id == transaction.acheteur_id).first()
        notaire_user = db.query(User).filter(User.utilisateur_id == notaire.utilisateur_id).first()
        annonce = db.query(Annonce).filter(Annonce.annonce_id == transaction.annonce_id).first()

        # Préparer les données pour le PDF
        transaction_data = {
            "prix_final": transaction.prix_compromis,
            "frais_notaire": transaction.frais_notaire or 0,
            "frais_immo2000": transaction.frais_immo2000 or 0,
            "date_creation": transaction.date_creation,
            "bien_titre": annonce.titre if annonce else "Bien immobilier",
            "bien_adresse": annonce.adresse if annonce else "",
            "bien_surface": annonce.surface if annonce else 0,
            "conditions_suspensives": transaction.conditions_suspensives or "Aucune"
        }

        vendeur_data = {
            "nom": vendeur.nom if vendeur else "Vendeur",
            "email": vendeur.email if vendeur else "",
            "adresse": vendeur.adresse_contact if vendeur else ""
        }

        acheteur_data = {
            "nom": acheteur.nom if acheteur else "Acheteur",
            "email": acheteur.email if acheteur else "",
            "adresse": acheteur.adresse_contact if acheteur else ""
        }

        notaire_data = {
            "nom": notaire_user.nom if notaire_user else "Notaire",
            "email": notaire_user.email if notaire_user else "",
            "adresse": notaire.adresse if notaire else ""
        }

        # Générer le PDF
        pdf_bytes = generer_compromis_pdf(
            transaction_data,
            notaire_data,
            vendeur_data,
            acheteur_data
        )

        # Uploader sur AWS S3
        aws_client = get_aws_client()
        if aws_client:
            fichier_s3 = f"transactions/{transaction_id}/compromis_{transaction_id}.pdf"
            url_s3 = await aws_client.upload_document(pdf_bytes, fichier_s3, "application/pdf")

            transaction.compromis_url = url_s3
            transaction.compromis_genere_le = datetime.utcnow()
            db.commit()

            logger.info(f"✅ Compromis généré et uploadé: {url_s3}")

            return {
                "message": "Compromis généré avec succès",
                "transaction_id": transaction_id,
                "compromis_url": url_s3,
                "pdf_size": len(pdf_bytes)
            }
        else:
            # Fallback: retourner le PDF en base64
            import base64
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')

            return {
                "message": "Compromis généré (stockage S3 non disponible)",
                "transaction_id": transaction_id,
                "pdf_base64": pdf_base64,
                "pdf_size": len(pdf_bytes)
            }

    except Exception as e:
        logger.error(f"❌ Erreur génération compromis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération: {str(e)}"
        )

@router.post("/{transaction_id}/compromis/envoyer", response_model=dict, summary="Envoyer le compromis à DocuSign")
async def envoyer_compromis_signature(
    transaction_id: int,
    data: EnvoyerCompromisRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_notaire)
):
    """
    Envoyer le compromis généré à DocuSign pour signature.

    Seul le notaire assigné peut envoyer le compromis.
    Le compromis doit avoir été généré auparavant.
    """
    from src.auth.models import User

    transaction = db.query(TransactionNotaire).filter(
        TransactionNotaire.transaction_notaire_id == transaction_id
    ).first()

    if not transaction:
        raise NotFoundError("Transaction", transaction_id)

    notaire = db.query(Notaire).filter(Notaire.notaire_id == transaction.notaire_id).first()
    if not notaire or notaire.utilisateur_id != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le notaire assigné peut envoyer le compromis"
        )

    if not transaction.compromis_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun compromis n'a été généré pour cette transaction"
        )

    try:
        # Récupérer le client DocuSign
        docusign_client = get_docusign_client()
        if not docusign_client:
            raise Exception("Client DocuSign non configuré")

        # Récupérer le PDF depuis S3
        from app_fastapi.utils.integrations import get_aws_client
        aws_client = get_aws_client()

        if aws_client and transaction.compromis_url.startswith("s3://"):
            # TODO: Implémenter téléchargement depuis S3
            pdf_bytes = b"PDF_PLACEHOLDER"  # Placeholder
        else:
            # Le compromis_url est peut-être une URL HTTP
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(transaction.compromis_url)
                pdf_bytes = response.content

        # Récupérer les infos des signataires
        vendeur = db.query(User).filter(User.utilisateur_id == transaction.vendeur_id).first()
        acheteur = db.query(User).filter(User.utilisateur_id == transaction.acheteur_id).first()
        notaire_user = db.query(User).filter(User.utilisateur_id == notaire.utilisateur_id).first()

        # Préparer les signataires
        signers = [
            {
                "email": vendeur.email if vendeur else "vendeur@example.com",
                "name": vendeur.nom if vendeur else "Vendeur",
                "role": "vendeur",
                "order": 1
            },
            {
                "email": acheteur.email if acheteur else "acheteur@example.com",
                "name": acheteur.nom if acheteur else "Acheteur",
                "role": "acheteur",
                "order": 2
            },
            {
                "email": notaire_user.email if notaire_user else "notaire@example.com",
                "name": notaire_user.nom if notaire_user else "Notaire",
                "role": "notaire",
                "order": 3
            }
        ]

        # Envoyer à DocuSign
        message = data.message or f"Veuillez signer le compromis de vente pour la transaction #{transaction_id}"
        subject = f"Signature du compromis de vente - Transaction #{transaction_id}"

        result = await docusign_client.send_envelope(
            document_bytes=pdf_bytes,
            signers=signers,
            subject=subject,
            message=message,
            document_name="Compromis_de_vente.pdf"
        )

        # Mettre à jour la transaction
        transaction.docusign_envelope_id = result.get("envelopeId")
        transaction.statut = "compromis_envoye"
        transaction.date_envoi_signature = datetime.utcnow()
        db.commit()

        logger.info(
            f"✅ Compromis envoyé à DocuSign: "
            f"envelope_id={result.get('envelopeId')}"
        )

        return {
            "message": "Compromis envoyé à DocuSign avec succès",
            "transaction_id": transaction_id,
            "envelope_id": result.get("envelopeId"),
            "statut": "compromis_envoye"
        }

    except Exception as e:
        logger.error(f"❌ Erreur envoi DocuSign: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'envoi: {str(e)}"
        )
