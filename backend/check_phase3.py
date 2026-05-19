#!/usr/bin/env python3
"""
Script de vérification pour le parcours de vente Phase 3.
Vérifie que tous les modèles, routes et services sont correctement configurés.
"""

import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_imports():
    """Vérifier que tous les imports fonctionnent."""
    try:
        logger.info("🔍 Vérification des imports...")

        # Modèles
        from src.models.paiements import Paiement, FraisNotaire, CommissionImmo2000, TypePaiement, StatutPaiement
        logger.info("✅ Modèles paiements importés")

        from src.models.offres import Offre, OffreStatus
        logger.info("✅ Modèle Offre importé")

        from src.models.notaires import Notaire, TransactionNotaire
        logger.info("✅ Modèles notaires importés")

        # Routes
        from src.routes.transactions import transactions_vente_bp
        logger.info("✅ Routes transactions importées")

        from src.routes.paiements import paiements_vente_bp
        logger.info("✅ Routes paiements importées")

        # Services
        from src.services.external_integrations import (
            DocuSignService, StripeService, SendGridService, S3Service,
            get_docusign_service, get_stripe_service, get_sendgrid_service, get_s3_service
        )
        logger.info("✅ Services externes importés")

        from src.services.scheduler_parcours_vente import init_scheduler
        logger.info("✅ Scheduler importé")

        logger.info("\n✅ Tous les imports réussis!")
        return True

    except Exception as e:
        logger.error(f"❌ Erreur lors des imports: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_models():
    """Vérifier la structure des modèles."""
    try:
        logger.info("\n🔍 Vérification des modèles...")

        from src.models.paiements import Paiement, FraisNotaire, CommissionImmo2000
        from src.models.offres import Offre
        from src.models.notaires import TransactionNotaire

        # Vérifier les attributs clés
        paiement_attrs = ['paiement_id', 'transaction_notaire_id', 'montant', 'type', 'statut', 'stripe_payment_intent_id']
        for attr in paiement_attrs:
            if not hasattr(Paiement, attr):
                raise AttributeError(f"Paiement manque l'attribut {attr}")
        logger.info("✅ Modèle Paiement OK")

        frais_attrs = ['frais_notaire_id', 'transaction_notaire_id', 'notaire_id', 'montant_frais', 'statut']
        for attr in frais_attrs:
            if not hasattr(FraisNotaire, attr):
                raise AttributeError(f"FraisNotaire manque l'attribut {attr}")
        logger.info("✅ Modèle FraisNotaire OK")

        commission_attrs = ['commission_id', 'transaction_notaire_id', 'prix_vente', 'montant_commission']
        for attr in commission_attrs:
            if not hasattr(CommissionImmo2000, attr):
                raise AttributeError(f"CommissionImmo2000 manque l'attribut {attr}")
        logger.info("✅ Modèle CommissionImmo2000 OK")

        offre_attrs = ['offre_id', 'annonce_id', 'acheteur_id', 'vendeur_id', 'prix_propose', 'statut', 'contre_proposition']
        for attr in offre_attrs:
            if not hasattr(Offre, attr):
                raise AttributeError(f"Offre manque l'attribut {attr}")
        logger.info("✅ Modèle Offre OK")

        logger.info("\n✅ Tous les modèles sont OK!")
        return True

    except Exception as e:
        logger.error(f"❌ Erreur vérification modèles: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_routes():
    """Vérifier que les routes sont bien enregistrées."""
    try:
        logger.info("\n🔍 Vérification des routes...")

        from src.routes.transactions import transactions_vente_bp
        from src.routes.paiements import paiements_vente_bp

        # Vérifier les attributs des blueprints
        assert hasattr(transactions_vente_bp, 'name'), "Blueprint transactions_vente sans nom"
        assert transactions_vente_bp.name == 'transactions_vente', f"Mauvais nom blueprint: {transactions_vente_bp.name}"
        logger.info(f"✅ Blueprint transactions: {transactions_vente_bp.url_prefix}")

        assert hasattr(paiements_vente_bp, 'name'), "Blueprint paiements_vente sans nom"
        assert paiements_vente_bp.name == 'paiements_vente', f"Mauvais nom blueprint: {paiements_vente_bp.name}"
        logger.info(f"✅ Blueprint paiements: {paiements_vente_bp.url_prefix}")

        logger.info("\n✅ Tous les routes sont OK!")
        return True

    except Exception as e:
        logger.error(f"❌ Erreur vérification routes: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_services():
    """Vérifier les services externes."""
    try:
        logger.info("\n🔍 Vérification des services...")

        from src.services.external_integrations import (
            DocuSignService, StripeService, SendGridService, S3Service
        )

        # Vérifier les méthodes clés
        docusign_methods = ['get_access_token', 'generer_lien_signature', 'verifier_signature']
        for method in docusign_methods:
            if not hasattr(DocuSignService, method):
                raise AttributeError(f"DocuSignService manque la méthode {method}")
        logger.info("✅ Service DocuSign OK")

        stripe_methods = ['creer_payment_intent', 'confirmer_payment', 'creer_remboursement']
        for method in stripe_methods:
            if not hasattr(StripeService, method):
                raise AttributeError(f"StripeService manque la méthode {method}")
        logger.info("✅ Service Stripe OK")

        sendgrid_methods = ['envoyer_email', 'envoyer_email_offre_proposee']
        for method in sendgrid_methods:
            if not hasattr(SendGridService, method):
                raise AttributeError(f"SendGridService manque la méthode {method}")
        logger.info("✅ Service SendGrid OK")

        s3_methods = ['upload_fichier', 'telecharger_fichier', 'supprimer_fichier']
        for method in s3_methods:
            if not hasattr(S3Service, method):
                raise AttributeError(f"S3Service manque la méthode {method}")
        logger.info("✅ Service S3 OK")

        logger.info("\n✅ Tous les services sont OK!")
        return True

    except Exception as e:
        logger.error(f"❌ Erreur vérification services: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_scheduler():
    """Vérifier le scheduler."""
    try:
        logger.info("\n🔍 Vérification du scheduler...")

        from src.services.scheduler_parcours_vente import (
            init_scheduler,
            rappeler_offres_non_repondues,
            rappeler_offres_negociation,
            rappeler_paiement_depot,
            rappeler_documents_en_attente
        )

        logger.info("✅ Fonctions scheduler importées")

        # Vérifier que ce sont des callables
        for func in [rappeler_offres_non_repondues, rappeler_offres_negociation,
                     rappeler_paiement_depot, rappeler_documents_en_attente]:
            if not callable(func):
                raise TypeError(f"{func.__name__} n'est pas callable")

        logger.info("✅ Toutes les fonctions sont callables")
        logger.info("\n✅ Scheduler OK!")
        return True

    except Exception as e:
        logger.error(f"❌ Erreur vérification scheduler: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Exécuter toutes les vérifications."""
    logger.info("=" * 60)
    logger.info("🚀 Vérification Parcours de Vente Phase 3")
    logger.info("=" * 60)

    checks = [
        ("Imports", check_imports),
        ("Modèles", check_models),
        ("Routes", check_routes),
        ("Services", check_services),
        ("Scheduler", check_scheduler)
    ]

    results = {}
    for name, check_func in checks:
        try:
            results[name] = check_func()
        except Exception as e:
            logger.error(f"❌ Erreur lors de la vérification {name}: {e}")
            results[name] = False

    # Résumé
    logger.info("\n" + "=" * 60)
    logger.info("📊 RÉSUMÉ")
    logger.info("=" * 60)

    total = len(results)
    passed = sum(1 for v in results.values() if v)

    for name, result in results.items():
        status = "✅" if result else "❌"
        logger.info(f"{status} {name}")

    logger.info("=" * 60)
    logger.info(f"✅ {passed}/{total} vérifications réussies")

    if passed == total:
        logger.info("\n🎉 Tous les contrôles sont passés! Prêt à développer.")
        return 0
    else:
        logger.error(f"\n⚠️  {total - passed} vérifications ont échoué.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
