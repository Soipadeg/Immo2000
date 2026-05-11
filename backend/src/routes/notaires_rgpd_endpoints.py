"""
Endpoints pour gestion des documents chiffrés et conformité RGPD.
À intégrer dans backend/src/routes/notaires.py
"""

# ===== DOCUMENT ENCRYPTION & RGPD =====

@notaires_bp.route('/documents/<int:document_id>/content', methods=['GET'])
@token_required
def get_encrypted_document_content(current_user, document_id):
    """
    Récupérer et déchiffrer un document (avec contrôle d'accès).

    Enregistre un audit trail RGPD de l'accès.
    """
    try:
        from src.services.document_encryption import DocumentEncryptionService
        from src.models.notaires import DocumentNotaire

        # Vérifier les permissions et logger l'accès
        DocumentEncryptionService.verify_access_permission(
            user_id=current_user['user_id'],
            document_id=document_id,
            reason=request.args.get('reason', 'visualization')
        )

        # Récupérer le document
        document = db.session.query(DocumentNotaire).filter_by(
            document_id=document_id
        ).first()

        if not document:
            return jsonify({'erreur': 'Document non trouvé'}), 404

        # Déchiffrer si chiffré
        if document.estEncrypte:
            content = DocumentEncryptionService.decrypt_document(document.contenu)
        else:
            content = document.contenu

        return {
            'document_id': document.document_id,
            'filename': document.nom_fichier,
            'content': content.decode('utf-8', errors='ignore'),  # Si texte
            'mime_type': document.type_mime,
            'size': len(content),
            'encrypted': document.estEncrypte
        }, 200

    except PermissionError as e:
        logger.warning(f"Accès refusé document {document_id}: {str(e)}")
        return jsonify({'erreur': str(e)}), 403

    except Exception as e:
        logger.error(f"Erreur récupération document: {str(e)}")
        return jsonify({'erreur': 'Erreur serveur'}), 500


@notaires_bp.route('/documents/<int:document_id>/access-log', methods=['GET'])
@token_required
def get_document_access_log(current_user, document_id):
    """
    Récupérer le journal d'accès RGPD d'un document.

    Accessible au notaire et au propriétaire du dossier.
    """
    try:
        from src.services.document_encryption import DocumentEncryptionService
        from src.models.notaires import DocumentNotaire, TransactionNotaire

        # Récupérer le document
        document = db.session.query(DocumentNotaire).filter_by(
            document_id=document_id
        ).first()

        if not document:
            return jsonify({'erreur': 'Document non trouvé'}), 404

        # Vérifier permissions
        transaction = db.session.query(TransactionNotaire).filter_by(
            transaction_notaire_id=document.transaction_notaire_id
        ).first()

        is_authorized = (
            transaction.vendeur_id == current_user['user_id'] or
            transaction.acheteur_id == current_user['user_id'] or
            (transaction.notaire and transaction.notaire.utilisateur_id == current_user['user_id']) or
            current_user.get('role') == 'admin'
        )

        if not is_authorized:
            return jsonify({'erreur': 'Non autorisé'}), 403

        # Récupérer l'historique d'accès
        access_log = DocumentEncryptionService.get_document_access_log(document_id)

        return jsonify({
            'document_id': document_id,
            'filename': document.nom_fichier,
            'access_log': access_log,
            'total_accesses': len(access_log)
        }), 200

    except Exception as e:
        logger.error(f"Erreur accès log: {str(e)}")
        return jsonify({'erreur': 'Erreur serveur'}), 500


@notaires_bp.route('/documents/<int:document_id>/delete-permanently', methods=['POST'])
@token_required
def delete_document_permanently(current_user, document_id):
    """
    Supprimer définitivement un document (droit à l'oubli).

    Nécessite l'autorisation du propriétaire du dossier.
    """
    try:
        from src.services.document_encryption import DocumentEncryptionService
        from src.models.notaires import DocumentNotaire, TransactionNotaire

        # Récupérer le document
        document = db.session.query(DocumentNotaire).filter_by(
            document_id=document_id
        ).first()

        if not document:
            return jsonify({'erreur': 'Document non trouvé'}), 404

        # Vérifier permissions
        transaction = db.session.query(TransactionNotaire).filter_by(
            transaction_notaire_id=document.transaction_notaire_id
        ).first()

        is_owner = (
            transaction.vendeur_id == current_user['user_id'] or
            transaction.acheteur_id == current_user['user_id']
        )
        is_admin = current_user.get('role') == 'admin'

        if not (is_owner or is_admin):
            return jsonify({'erreur': 'Seul le propriétaire peut supprimer'}), 403

        # Supprimer
        reason = request.json.get('reason', 'user_request') if request.json else 'user_request'
        DocumentEncryptionService.delete_document_permanently(document_id, reason=reason)

        return jsonify({
            'message': 'Document supprimé définitivement',
            'document_id': document_id
        }), 200

    except Exception as e:
        logger.error(f"Erreur suppression document: {str(e)}")
        return jsonify({'erreur': 'Erreur serveur'}), 500


# ===== RGPD COMPLIANCE =====

@notaires_bp.route('/rgpd/user-data/export', methods=['GET'])
@token_required
def export_user_data(current_user):
    """
    Exporter toutes les données personnelles (droit d'accès RGPD).

    Retourne un fichier JSON avec toutes les infos de l'utilisateur.
    """
    try:
        from src.services.document_encryption import RGPDComplianceService
        import json

        # Exporter les données
        user_data = RGPDComplianceService.export_user_data(
            current_user['user_id']
        )

        # Retourner comme fichier téléchargeable
        return {
            'data': user_data,
            'format': 'json',
            'exported_at': datetime.utcnow().isoformat()
        }, 200

    except Exception as e:
        logger.error(f"Erreur export données RGPD: {str(e)}")
        return jsonify({'erreur': 'Erreur serveur'}), 500


@notaires_bp.route('/rgpd/user-data/delete', methods=['POST'])
@token_required
def delete_user_data_rgpd(current_user):
    """
    Supprimer toutes les données personnelles (droit à l'oubli).

    ATTENTION: Opération irréversible.
    Nécessite une confirmation avec JSON: {"confirm": true, "reason": "..."}
    """
    try:
        from src.services.document_encryption import RGPDComplianceService

        # Vérifier confirmation
        if not request.json or not request.json.get('confirm'):
            return jsonify({
                'erreur': 'Suppression non confirmée',
                'message': 'Envoyez {"confirm": true, "reason": "votre raison"} pour confirmer'
            }), 400

        reason = request.json.get('reason', 'user_request')

        logger.warning(f"Suppression RGPD demandée pour utilisateur {current_user['user_id']}: {reason}")

        # Supprimer les données
        RGPDComplianceService.delete_user_data(
            current_user['user_id'],
            reason=reason
        )

        return jsonify({
            'message': 'Données supprimées définitivement',
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erreur suppression RGPD: {str(e)}")
        return jsonify({'erreur': 'Erreur serveur'}), 500


@notaires_bp.route('/rgpd/privacy-report', methods=['GET'])
@token_required
def get_privacy_report(current_user):
    """
    Récupérer le rapport RGPD de conformité.

    Accessible aux administrateurs uniquement.
    """
    try:
        from src.auth.models import User

        # Vérifier que c'est un admin
        user = db.session.query(User).filter_by(
            utilisateur_id=current_user['user_id']
        ).first()

        if not user or user.role != 'admin':
            return jsonify({'erreur': 'Accès administrateur requis'}), 403

        from src.services.document_encryption import RGPDComplianceService

        report = RGPDComplianceService.generate_privacy_report()

        return jsonify(report), 200

    except Exception as e:
        logger.error(f"Erreur rapport RGPD: {str(e)}")
        return jsonify({'erreur': 'Erreur serveur'}), 500


# À ajouter à la fin du fichier backend/src/routes/notaires.py
