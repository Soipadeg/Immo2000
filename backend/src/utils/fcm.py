"""
Notifications push via Firebase Cloud Messaging (FCM)
"""

import httpx
import os
import logging
import json
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)


class FCMNotificationService:
    """Service de notifications push via Firebase Cloud Messaging"""

    def __init__(self, project_id: str = None, api_key: str = None):
        """
        Initialiser le service FCM.

        Args:
            project_id: ID du projet Firebase
            api_key: Clé API FCM (ou utiliser FCM_API_KEY depuis .env)
        """
        self.project_id = project_id or os.getenv('FIREBASE_PROJECT_ID')
        self.api_key = api_key or os.getenv('FCM_API_KEY')
        self.base_url = f"https://fcm.googleapis.com/v1/projects/{self.project_id}/messages:send"

        if not self.api_key or not self.project_id:
            logger.warning("Configuration FCM incomplète")

    async def send_notification(
        self,
        token: str,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        image_url: Optional[str] = None
    ) -> Dict:
        """
        Envoyer une notification à un utilisateur.

        Args:
            token: Token FCM de l'utilisateur
            title: Titre de la notification
            body: Corps du message
            data: Données additionnelles (dictionnaire)
            image_url: URL d'une image pour la notification

        Returns:
            Résultat de l'envoi
        """
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            message = {
                "message": {
                    "token": token,
                    "notification": {
                        "title": title,
                        "body": body
                    }
                }
            }

            # Ajouter l'image si fournie
            if image_url:
                message["message"]["notification"]["image"] = image_url

            # Ajouter les données si fournies
            if data:
                message["message"]["data"] = {k: str(v) for k, v in data.items()}

            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json=message
                )

                if response.status_code == 200:
                    logger.info(f"Notification envoyée à {token}")
                    return {
                        'success': True,
                        'message_id': response.json().get('name'),
                        'token': token
                    }
                else:
                    logger.error(f"Erreur FCM: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'error': response.text,
                        'token': token
                    }

        except httpx.HTTPError as e:
            logger.error(f"Erreur envoi notification (HTTP): {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'token': token
            }
        except Exception as e:
            logger.error(f"Erreur envoi notification: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'token': token
            }

    async def send_multicast(
        self,
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict] = None,
        image_url: Optional[str] = None
    ) -> Dict:
        """
        Envoyer une notification à plusieurs utilisateurs.

        Args:
            tokens: Liste de tokens FCM
            title: Titre de la notification
            body: Corps du message
            data: Données additionnelles
            image_url: URL d'une image

        Returns:
            Résultats pour tous les tokens
        """
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            message = {
                "message": {
                    "tokens": tokens,
                    "notification": {
                        "title": title,
                        "body": body
                    }
                }
            }

            if image_url:
                message["message"]["notification"]["image"] = image_url

            if data:
                message["message"]["data"] = {k: str(v) for k, v in data.items()}

            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    self.base_url.replace(':send', ':sendMulticast'),
                    headers=headers,
                    json=message
                )

                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"Notification multicast envoyée à {len(tokens)} utilisateurs")
                    return {
                        'success': True,
                        'sent_count': result.get('successCount', 0),
                        'failed_count': result.get('failureCount', 0),
                        'total': len(tokens)
                    }
                else:
                    logger.error(f"Erreur FCM multicast: {response.status_code}")
                    return {
                        'success': False,
                        'error': response.text,
                        'total': len(tokens)
                    }

        except httpx.HTTPError as e:
            logger.error(f"Erreur envoi multicast (HTTP): {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'total': len(tokens)
            }
        except Exception as e:
            logger.error(f"Erreur envoi multicast: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'total': len(tokens)
            }

    async def send_to_topic(
        self,
        topic: str,
        title: str,
        body: str,
        data: Optional[Dict] = None
    ) -> Dict:
        """
        Envoyer une notification à tous les utilisateurs d'un topic.

        Args:
            topic: Nom du topic (ex: 'new_listings', 'announcements')
            title: Titre
            body: Corps du message
            data: Données additionnelles

        Returns:
            Résultat de l'envoi
        """
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            message = {
                "message": {
                    "topic": topic,
                    "notification": {
                        "title": title,
                        "body": body
                    }
                }
            }

            if data:
                message["message"]["data"] = {k: str(v) for k, v in data.items()}

            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json=message
                )

                if response.status_code == 200:
                    logger.info(f"Notification envoyée au topic {topic}")
                    return {'success': True, 'topic': topic}
                else:
                    logger.error(f"Erreur FCM topic: {response.status_code}")
                    return {'success': False, 'error': response.text}

        except httpx.HTTPError as e:
            logger.error(f"Erreur envoi topic (HTTP): {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"Erreur envoi topic: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}


class NotificationManager:
    """Gestionnaire des notifications avec patterns pré-définis"""

    def __init__(self, fcm_service: FCMNotificationService):
        self.fcm = fcm_service

    async def notify_new_offer(
        self,
        seller_token: str,
        buyer_name: str,
        listing_title: str,
        offer_amount: float,
        offer_id: int
    ) -> Dict:
        """Notifier un vendeur d'une nouvelle offre"""
        return await self.fcm.send_notification(
            token=seller_token,
            title="Nouvelle offre reçue",
            body=f"{buyer_name} a proposé {offer_amount}€ pour {listing_title}",
            data={
                'type': 'new_offer',
                'offer_id': offer_id,
                'amount': offer_amount
            }
        )

    async def notify_offer_accepted(
        self,
        buyer_token: str,
        seller_name: str,
        listing_title: str,
        offer_id: int
    ) -> Dict:
        """Notifier un acheteur que son offre a été acceptée"""
        return await self.fcm.send_notification(
            token=buyer_token,
            title="Offre acceptée",
            body=f"{seller_name} a accepté votre offre pour {listing_title}",
            data={
                'type': 'offer_accepted',
                'offer_id': offer_id
            }
        )

    async def notify_signing_reminder(
        self,
        user_token: str,
        transaction_id: int
    ) -> Dict:
        """Rappeler à un utilisateur de signer les documents"""
        return await self.fcm.send_notification(
            token=user_token,
            title="Signature requise",
            body="Veuillez signer les documents de votre transaction",
            data={
                'type': 'signing_required',
                'transaction_id': transaction_id
            }
        )

    async def notify_transaction_completed(
        self,
        seller_token: str,
        buyer_token: str,
        listing_title: str,
        transaction_id: int
    ) -> Dict:
        """Notifier vendeur et acheteur que la transaction est terminée"""
        results = []

        results.append(await self.fcm.send_notification(
            token=seller_token,
            title="Transaction complétée",
            body=f"Votre vente de {listing_title} a été finalisée avec succès",
            data={
                'type': 'transaction_completed',
                'transaction_id': transaction_id
            }
        ))

        results.append(await self.fcm.send_notification(
            token=buyer_token,
            title="Transaction complétée",
            body=f"Votre achat de {listing_title} a été finalisé avec succès",
            data={
                'type': 'transaction_completed',
                'transaction_id': transaction_id
            }
        ))

        return {
            'success': all(r.get('success') for r in results),
            'results': results
        }

    async def notify_new_listings(
        self,
        user_tokens: List[str],
        listings_count: int
    ) -> Dict:
        """Notifier les utilisateurs de nouvelles annonces"""
        return await self.fcm.send_multicast(
            tokens=user_tokens,
            title="Nouvelles annonces",
            body=f"{listings_count} nouveau(x) bien(s) corresponde(nt) à vos critères",
            data={'type': 'new_listings'}
        )

    async def announce_feature(
        self,
        user_tokens: List[str],
        feature_name: str,
        feature_description: str
    ) -> Dict:
        """Annoncer une nouvelle fonctionnalité"""
        return await self.fcm.send_multicast(
            tokens=user_tokens,
            title=f"Nouvelle fonctionnalité : {feature_name}",
            body=feature_description,
            data={'type': 'announcement'}
        )


# Initialiser le service
def create_fcm_service() -> FCMNotificationService:
    """Créer une instance du service FCM"""
    return FCMNotificationService()


def create_notification_manager() -> NotificationManager:
    """Créer un gestionnaire de notifications"""
    fcm = create_fcm_service()
    return NotificationManager(fcm)
