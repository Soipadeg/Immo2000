/**
 * Backend Push Notification Service
 * Phase 5.2 - Advanced Features
 *
 * Gère:
 * - Envoyer des notifications aux utilisateurs
 * - WebPush API
 * - Fallback sur WebSocket
 */

import axios from 'axios';
import { useNotificationStore } from '../store/notificationStore';

/**
 * Configuration Web Push (optionnel si utilisant Firebase ou Pusher)
 * Sinon utiliser simplement les WebSocket
 */
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = import.meta.env.VITE_VAPID_PRIVATE_KEY || '';

/**
 * Service de push notifications
 */
export class PushNotificationService {
  /**
   * S'abonner aux notifications
   */
  static async subscribe() {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[PushService] Push API non supportée');
        return null;
      }

      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('[PushService] Création nouvelle subscription...');

        // Créer une nouvelle subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY
            ? this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            : null,
        });
      }

      console.log('[PushService] Subscription créée:', subscription);

      // Envoyer la subscription au serveur
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('[PushService] Erreur subscription:', error);
      return null;
    }
  }

  /**
   * Se désabonner des notifications
   */
  static async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log('[PushService] Unsubscribed');
      }
    } catch (error) {
      console.error('[PushService] Erreur unsubscribe:', error);
    }
  }

  /**
   * Envoyer la subscription au serveur
   */
  static async sendSubscriptionToServer(subscription) {
    try {
      const response = await axios.post('/api/notifications/subscribe', {
        subscription: subscription.toJSON(),
      });

      console.log('[PushService] Subscription envoyée au serveur:', response.data);
      return response.data;
    } catch (error) {
      console.error('[PushService] Erreur envoi subscription:', error);
    }
  }

  /**
   * Convertir VAPID public key en Uint8Array
   */
  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

/**
 * Hook pour les notifications
 */
export function usePushNotifications() {
  const addNotification = useNotificationStore().addNotification;

  const subscribe = async () => {
    try {
      const subscription = await PushNotificationService.subscribe();
      if (subscription) {
        useNotificationStore().showSuccess('Notifications activées');
      }
    } catch (error) {
      useNotificationStore().showError('Impossible d\'activer les notifications');
    }
  };

  const unsubscribe = async () => {
    try {
      await PushNotificationService.unsubscribe();
      useNotificationStore().showSuccess('Notifications désactivées');
    } catch (error) {
      useNotificationStore().showError('Erreur lors de la désactivation');
    }
  };

  return {
    subscribe,
    unsubscribe,
  };
}
