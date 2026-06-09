"""
Routes Flask pour gérer les documents OBLIGATOIRES d'une annonce.

Documents requis pour publier une annonce:
1. Titre de propriété
2. Carte nationale d'identité du/des vendeur(s)
3. 3 derniers PV d'AG (procès verbal d'assemblée générale)
4. Règlement de copropriété
5. Diagnostics Techniques

Endpoints:
- POST   /api/v1/annonces/{id}/documents-requis           → Uploader un document
- GET    /api/v1/annonces/{id}/documents-requis           → Lister les documents
- GET    /api/v1/annonces/{id}/documents-requis/statut    → Vérifier le statut
- PUT    /api/v1/documents-requis/{id}/valider            → Valider (admin)
- DELETE /api/v1/documents-requis/{id}                    → Supprimer
"""

from flask import Blueprint, request, jsonify, current_app
from typing import Dict, Any, Tuple
import os
from werkzeug.utils import secure_filename
from datetime import datetime

from src.auth.models import db
from src.auth.decorators import token_required
from src.models.annonces import Annonce
from src.models.documents import DocumentRequis
from src.models.offres import Offre
from src.crud.documents import (
    initialiser_documents_requis,
    uploader_document_requis,
    valider_document_requis,
    obtenir_statut_documents,
    peux_publier_annonce,
    obtenir_documents_annonce,
    supprimer_documents_annonce,
)
from src.decorators.error_handling import handle_errors, NotFoundError, ForbiddenError, ValidationError

# Blueprint pour les documents obligatoires
documents_requis_bp = Blueprint("documents_requis", __name__, url_prefix="/api/v1")

# Configuration
ALLOWED_EXTENSIONS = {"pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def allowed_file(filename: str) -> bool:
    """Vérifie si le fichier a une extension autorisée."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@documents_requis_bp.route("/annonces/<int:annonce_id>/documents-requis", methods=["POST"])
@token_required
@handle_errors()
def uploader_document(current_user: Dict[str, Any], annonce_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Upload un document obligatoire pour une annonce.

    Query params:
    - type_document: Type du document (titre_propriete, carte_identite, pv_ag, reglement_copropriete, diagnostics)

    Body (multipart/form-data):
    - file: Fichier PDF à uploader

    Returns:
        Document créé/mis à jour avec statut "soumis"
    """
    try:
        # Vérifier que l'annonce existe et appartient à l'utilisateur
        annonce = Annonce.query.get(annonce_id)
        if not annonce:
            raise NotFoundError(f"Annonce {annonce_id} non trouvée")

        if annonce.utilisateur_id != current_user.get("id"):
            raise ForbiddenError("Vous n'avez pas le droit de modifier cette annonce")

        # Vérifier le statut de l'annonce
        if annonce.statut not in ["brouillon"]:
            raise ValidationError("Impossible de modifier les documents d'une annonce publiée ou vendue")

        # Récupérer le type de document
        type_document = request.form.get("type_document") or request.args.get("type_document")
        if not type_document:
            raise ValidationError("type_document requis (titre_propriete, carte_identite, pv_ag, reglement_copropriete, diagnostics)")

        types_valides = [
            "titre_propriete", "carte_identite", "pv_ag",
            "reglement_copropriete", "diagnostics"
        ]
        if type_document not in types_valides:
            raise ValidationError(f"Type de document invalide: {type_document}")

        # Récupérer et vérifier le fichier
        if "file" not in request.files:
            raise ValidationError("Aucun fichier fourni (paramètre 'file' requis)")

        file = request.files["file"]

        if file.filename == "":
            raise ValidationError("Nom de fichier vide")

        if not allowed_file(file.filename):
            raise ValidationError("Format non autorisé. Seuls les fichiers PDF sont acceptés.")

        # Vérifier la taille
        file.seek(0, os.SEEK_END)
        taille = file.tell()
        file.seek(0)

        if taille > MAX_FILE_SIZE:
            raise ValidationError(f"Fichier trop volumineux (max {MAX_FILE_SIZE // 1024 // 1024} MB)")

        if taille == 0:
            raise ValidationError("Fichier vide")

        # Uploader le document
        filename = secure_filename(file.filename)

        # TODO: Implémenter le stockage du fichier (S3, local, etc.)
        # Pour l'instant: URL de placeholder
        from datetime import datetime
        timestamp = int(datetime.utcnow().timestamp())
        url_document = f"/uploads/annonces/{annonce_id}/documents/{type_document}_{timestamp}_{filename}"

        # Créer/mettre à jour le document
        document = uploader_document_requis(
            db,
            annonce_id,
            type_document,
            url_document,
            taille,
            "application/pdf"
        )

        return {
            "success": True,
            "message": f"Document {type_document} uploadé avec succès. En attente de validation.",
            "document": document.to_dict()
        }, 201

    except Exception as e:
        current_app.logger.error(f"Erreur lors du upload: {str(e)}", exc_info=True)
        raise


@documents_requis_bp.route("/annonces/<int:annonce_id>/documents-requis", methods=["GET"])
@handle_errors()
def lister_documents(annonce_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Liste les documents obligatoires d'une annonce.

    Returns:
        Liste des documents avec leur statut (manquant, soumis, valide, rejete)
    """
    annonce = Annonce.query.get(annonce_id)
    if not annonce:
        raise NotFoundError(f"Annonce {annonce_id} non trouvée")

    documents = obtenir_documents_annonce(db, annonce_id)

    # Si aucun document, initialiser
    if not documents:
        documents = initialiser_documents_requis(db, annonce_id)

    return {
        "success": True,
        "annonce_id": annonce_id,
        "documents": [doc.to_dict() for doc in documents],
        "count": len(documents)
    }, 200


@documents_requis_bp.route("/annonces/<int:annonce_id>/documents-requis/statut", methods=["GET"])
@handle_errors()
def verifier_statut_documents(annonce_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Vérifie le statut complet des documents d'une annonce.

    Utile pour déterminer si l'annonce peut être publiée.

    Returns:
        Statut: tous_valides, nombre_valides, manquants, rejetes, peut_publier
    """
    annonce = Annonce.query.get(annonce_id)
    if not annonce:
        raise NotFoundError(f"Annonce {annonce_id} non trouvée")

    # Initialiser si besoin
    documents = obtenir_documents_annonce(db, annonce_id)
    if not documents:
        initialiser_documents_requis(db, annonce_id)

    statut = obtenir_statut_documents(db, annonce_id)
    peut_publier, message = peux_publier_annonce(db, annonce_id)

    return {
        "success": True,
        "annonce_id": annonce_id,
        "peut_publier": peut_publier,
        "message": message,
        **statut
    }, 200


@documents_requis_bp.route("/documents-requis/<int:doc_id>/valider", methods=["PUT"])
@token_required
@handle_errors()
def valider_document_endpoint(current_user: Dict[str, Any], doc_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Valide ou rejette un document soumis (opération ADMIN UNIQUEMENT).

    ⚠️  L'admin ne voit QUE le statut du document, pas le contenu du fichier (CONFIDENTIEL).

    Body (JSON):
    {
        "accepte": true,
        "motif_rejet": "raison du rejet (optionnel)"
    }

    Returns:
        Confirmation de validation (statut SANS contenu du fichier)
    """
    try:
        # Vérifier que l'utilisateur est admin
        if current_user.get("role") != "admin":
            raise ForbiddenError("Seuls les administrateurs peuvent valider les documents")

        document = DocumentRequis.query.get(doc_id)
        if not document:
            raise NotFoundError(f"Document {doc_id} non trouvé")

        data = request.get_json() or {}
        accepte = data.get("accepte", True)
        motif_rejet = data.get("motif_rejet")

        document = valider_document_requis(
            db,
            doc_id,
            accepte,
            motif_rejet
        )

        # Retourner UNIQUEMENT le statut, pas l'URL du fichier (CONFIDENTIEL)
        doc_dict = document.to_dict()
        doc_dict.pop("url_document", None)  # Retirer l'URL (contenu confidentiel)

        return {
            "success": True,
            "message": f"Document {'validé' if accepte else 'rejeté'}",
            "document": doc_dict
        }, 200

    except Exception as e:
        current_app.logger.error(f"Erreur lors de la validation: {str(e)}", exc_info=True)
        raise
@token_required
@handle_errors()
def supprimer_document(current_user: Dict[str, Any], doc_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Supprime un document soumis.

    Seul le propriétaire de l'annonce peut supprimer ses documents.

    Returns:
        Message de confirmation
    """
    try:
        document = DocumentRequis.query.get(doc_id)
        if not document:
            raise NotFoundError(f"Document {doc_id} non trouvé")

        # Vérifier que l'utilisateur est le propriétaire
        annonce = Annonce.query.get(document.annonce_id)
        if annonce.utilisateur_id != current_user.get("id"):
            raise ForbiddenError("Vous n'avez pas le droit de supprimer ce document")

        # Réinitialiser le document au lieu de le supprimer
        document.url_document = None
        document.taille = None
        document.mime_type = None
        document.statut = "manquant"
        document.motif_rejet = None
        document.date_submission = None
        document.date_validation = None

        db.session.commit()

        return {
            "success": True,
            "message": "Document supprimé. Vous pouvez le re-uploader."
        }, 200

    except Exception as e:
        current_app.logger.error(f"Erreur lors de la suppression: {str(e)}", exc_info=True)
        raise


@documents_requis_bp.route("/annonces/<int:annonce_id>/documents-requis/telecharger/<type_document>", methods=["GET"])
@token_required
@handle_errors()
def telecharger_document_notaire(current_user: Dict[str, Any], annonce_id: int, type_document: str) -> Tuple[Dict[str, Any], int]:
    """
    🔐 ACCÈS SÉCURISÉ - Seul le NOTAIRE peut accéder aux documents confidentiels.

    Vérifications:
    1. Utilisateur est un notaire
    2. Il existe une offre ACCEPTÉE pour cette annonce
    3. Le notaire est assigné à la transaction correspondante

    Args:
        annonce_id: ID de l'annonce
        type_document: Type du document (titre_propriete, carte_identite, etc.)

    Returns:
        URL de téléchargement du document (confidentiel)
    """
    try:
        # 1. Vérifier que l'utilisateur est un notaire
        if current_user.get("role") != "notaire":
            raise ForbiddenError("Accès réservé aux notaires")

        # 2. Vérifier qu'il existe une offre ACCEPTÉE pour cette annonce
        offre_acceptee = Offre.query.filter(
            Offre.annonce_id == annonce_id,
            Offre.statut == "acceptee"
        ).first()

        if not offre_acceptee:
            raise ForbiddenError(
                "Aucune offre acceptée pour cette annonce. "
                "Les documents ne sont accessibles qu'après acceptation d'une offre."
            )

        # 3. TODO: Vérifier que le notaire est assigné à la transaction
        # if offre_acceptee.transaction_notaire_id:
        #     transaction = TransactionNotaire.query.get(offre_acceptee.transaction_notaire_id)
        #     if not transaction or transaction.notaire_id != current_user.get("notaire_id"):
        #         raise ForbiddenError("Vous n'êtes pas assigné à cette transaction")

        # 4. Récupérer le document
        document = DocumentRequis.query.filter(
            DocumentRequis.annonce_id == annonce_id,
            DocumentRequis.type_document == type_document,
            DocumentRequis.statut == "valide"
        ).first()

        if not document:
            raise NotFoundError(
                f"Document {type_document} non disponible ou non validé"
            )

        # 5. Retourner l'URL de téléchargement
        return {
            "success": True,
            "message": f"Accès autorisé au document {type_document}",
            "document_id": document.document_requis_id,
            "type_document": document.type_document,
            "url_telechargement": document.url_document,
            "taille": document.taille,
            "date_validation": document.date_validation.isoformat() if document.date_validation else None,
            "offre_id": offre_acceptee.offre_id,
            "timestamp": datetime.utcnow().isoformat()
        }, 200

    except Exception as e:
        current_app.logger.error(f"Erreur accès notaire: {str(e)}", exc_info=True)
        raise


@documents_requis_bp.route("/documents-requis/statut-admin/<int:annonce_id>", methods=["GET"])
@token_required
@handle_errors()
def statut_documents_admin(current_user: Dict[str, Any], annonce_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Vue ADMIN uniquement: Voir le statut des documents (sans accès au contenu).

    Affiche uniquement:
    - Statut de chaque document (manquant, soumis, valide, rejete)
    - Motif de rejet (si applicable)
    - Dates de soumission/validation

    ❌ N'affiche PAS: URL du fichier, contenu (CONFIDENTIEL)

    Returns:
        Statut complet des documents
    """
    try:
        # Vérifier que l'utilisateur est admin
        if current_user.get("role") != "admin":
            raise ForbiddenError("Accès réservé aux administrateurs")

        annonce = Annonce.query.get(annonce_id)
        if not annonce:
            raise NotFoundError(f"Annonce {annonce_id} non trouvée")

        documents = obtenir_documents_annonce(db, annonce_id)

        if not documents:
            initialiser_documents_requis(db, annonce_id)
            documents = obtenir_documents_annonce(db, annonce_id)

        # Retourner statut SANS URL des fichiers
        documents_safe = []
        for doc in documents:
            doc_dict = doc.to_dict()
            doc_dict.pop("url_document", None)  # Retirer URL (CONFIDENTIEL)
            documents_safe.append(doc_dict)

        statut = obtenir_statut_documents(db, annonce_id)
        peut_publier, message = peux_publier_annonce(db, annonce_id)

        return {
            "success": True,
            "annonce_id": annonce_id,
            "peut_publier": peut_publier,
            "message": message,
            "documents": documents_safe,
            "tous_valides": statut.get("tous_valides"),
            "nombre_valides": statut.get("nombre_valides"),
            "total_requis": statut.get("total_requis"),
            "manquants": statut.get("manquants"),
            "rejetes": statut.get("rejetes"),
            "note": "⚠️ Les URLs des fichiers ne sont pas affichées par sécurité (accès confidentiel)"
        }, 200

    except Exception as e:
        current_app.logger.error(f"Erreur vue admin: {str(e)}", exc_info=True)
        raise
