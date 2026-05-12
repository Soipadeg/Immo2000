#!/usr/bin/env python
"""
Script pour créer des notifications de rappel RDV demain.

À exécuter via cron ou scheduler tous les matins (ex: 08:00).
Crée une notification pour chaque RDV confirmé prévu demain.

Usage:
    python send_rdv_reminders.py
"""

from datetime import datetime, timedelta
import os
import sys

# Ajouter le chemin du backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.auth.models import db, User
from src.models.rendez_vous import RendezVous
from src.models.annonces import Annonce
from src.models.notifications import Notification, NotificationType
from src.app import create_app


def envoyer_rappels():
    """Créer les notifications de rappel pour les RDV de demain."""

    app = create_app()

    with app.app_context():
        # Récupérer demain (minuit à minuit)
        aujourd_hui = datetime.utcnow().date()
        demain = aujourd_hui + timedelta(days=1)

        demain_debut = datetime.combine(demain, datetime.min.time())
        demain_fin = datetime.combine(demain, datetime.max.time())

        # Trouver les RDV confirmés pour demain
        rdv_demain = RendezVous.query.filter(
            RendezVous.statut == "confirmé",
            RendezVous.date_confirmée >= demain_debut,
            RendezVous.date_confirmée <= demain_fin,
            RendezVous.rappel_envoye == False  # Pas encore de rappel envoyé
        ).all()

        if not rdv_demain:
            print(f"✓ Aucun RDV confirmé pour demain ({demain.strftime('%d/%m/%Y')})")
            return

        print(f"📅 Envoi de {len(rdv_demain)} rappel(s) pour demain ({demain.strftime('%d/%m/%Y')})")

        for rdv in rdv_demain:
            try:
                # Récupérer les infos nécessaires
                annonce = Annonce.query.get(rdv.annonce_id)
                acheteur = User.query.get(rdv.acheteur_id)
                vendeur = User.query.get(rdv.vendeur_id)

                if not annonce or not acheteur or not vendeur:
                    print(f"  ✗ RDV {rdv.rdv_id}: Données incomplètes")
                    continue

                # Formater l'heure
                heure = rdv.date_confirmée.strftime("%H:%M")

                # Créer notification pour l'ACHETEUR
                notif_acheteur = Notification(
                    user_id=rdv.acheteur_id,
                    type=NotificationType.MESSAGE_RECEIVED,
                    title="📅 Rappel: Votre visite demain!",
                    message=f"Visite de '{annonce.titre}' demain à {heure}\n"
                            f"Adresse: {annonce.adresse}, {annonce.code_postal} {annonce.ville}\n"
                            f"Vendeur: {vendeur.prenom} {vendeur.nom}\n"
                            f"Téléphone: {vendeur.telephone or 'Non renseigné'}",
                    related_entity_type="rendez_vous",
                    related_entity_id=rdv.rdv_id,
                    icon="📅",
                    action_url=f"/static/mes-rdv.html?rdv={rdv.rdv_id}"
                )
                db.session.add(notif_acheteur)

                # Créer notification pour le VENDEUR
                notif_vendeur = Notification(
                    user_id=rdv.vendeur_id,
                    type=NotificationType.MESSAGE_RECEIVED,
                    title="📅 Rappel: Visite demain!",
                    message=f"Visite de votre bien '{annonce.titre}' demain à {heure}\n"
                            f"Acheteur: {acheteur.prenom} {acheteur.nom}\n"
                            f"Téléphone: {acheteur.telephone or 'Non renseigné'}\n"
                            f"Adresse complète: {annonce.adresse}, {annonce.code_postal} {annonce.ville}",
                    related_entity_type="rendez_vous",
                    related_entity_id=rdv.rdv_id,
                    icon="📅",
                    action_url=f"/static/mes-rdv.html?rdv={rdv.rdv_id}"
                )
                db.session.add(notif_vendeur)

                # Marquer que le rappel a été envoyé
                rdv.rappel_envoye = True
                rdv.date_rappel_envoi = datetime.utcnow()

                print(f"  ✓ RDV {rdv.rdv_id}: Rappels envoyés ({annonce.titre})")

            except Exception as e:
                print(f"  ✗ RDV {rdv.rdv_id}: Erreur - {str(e)}")
                continue

        # Commit tous les changements
        db.session.commit()
        print(f"✓ {len(rdv_demain)} rappel(s) créé(s) et enregistré(s)")


if __name__ == "__main__":
    try:
        envoyer_rappels()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        sys.exit(1)
