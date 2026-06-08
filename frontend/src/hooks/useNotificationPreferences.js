import { useState, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import apiClient from '../services/api/client';

/**
 * Hook pour gérer les préférences de notifications
 * Email, push, in-app, historique, templates
 */
export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ skip: 0, limit: 20, total: 0 });
  const { addNotification } = useNotificationStore();

  /**
   * Récupérer les préférences actuelles
   */
  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/notifications/preferences');
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du chargement des préférences';
      setError(message);
      addNotification('error', message);

      // Fallback mockées
      if (process.env.NODE_ENV === 'development') {
        setPreferences(generateMockPreferences());
      }
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Récupérer l'historique des notifications
   */
  const fetchNotificationHistory = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        skip: params.skip || pagination.skip,
        limit: params.limit || pagination.limit,
        ...(params.type && { type: params.type }),
        ...(params.status && { status: params.status }),
      };

      const response = await apiClient.get('/notifications/history', { params: query });
      if (response.data && response.data.data) {
        setNotificationHistory(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du chargement de l\'historique';
      setError(message);
      addNotification('error', message);

      // Fallback mockées
      if (process.env.NODE_ENV === 'development') {
        setNotificationHistory(generateMockHistory());
      }
    } finally {
      setLoading(false);
    }
  }, [pagination, addNotification]);

  /**
   * Récupérer les templates d'emails
   */
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/notifications/templates');
      if (response.data && response.data.templates) {
        setTemplates(response.data.templates);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du chargement des templates';
      setError(message);
      addNotification('error', message);

      // Fallback mockées
      if (process.env.NODE_ENV === 'development') {
        setTemplates(generateMockTemplates());
      }
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Mettre à jour les préférences
   */
  const updatePreferences = useCallback(async (newPreferences) => {
    setUpdating(true);
    setError(null);
    try {
      const response = await apiClient.put('/notifications/preferences', newPreferences);
      if (response.data) {
        setPreferences(response.data);
        addNotification('success', 'Préférences mises à jour avec succès');
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(message);
      addNotification('error', message);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [addNotification]);

  /**
   * Mettre à jour une préférence spécifique (email, push, in-app)
   */
  const updateChannel = useCallback(async (channel, enabled) => {
    const updated = {
      ...preferences,
      channels: {
        ...preferences?.channels,
        [channel]: enabled,
      },
    };
    return updatePreferences(updated);
  }, [preferences, updatePreferences]);

  /**
   * Mettre à jour les types de notifications
   */
  const updateNotificationType = useCallback(
    async (type, enabled) => {
      const updated = {
        ...preferences,
        types: {
          ...preferences?.types,
          [type]: enabled,
        },
      };
      return updatePreferences(updated);
    },
    [preferences, updatePreferences]
  );

  /**
   * Envoyer une notification de test
   */
  const sendTestNotification = useCallback(async (channel) => {
    setUpdating(true);
    setError(null);
    try {
      const response = await apiClient.post('/notifications/test', { channel });
      if (response.data) {
        addNotification('success', `Notification de test envoyée via ${channel}`);
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'envoi du test';
      setError(message);
      addNotification('error', message);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [addNotification]);

  /**
   * Marquer une notification comme lue
   */
  const markAsRead = useCallback(async (notificationId) => {
    setUpdating(true);
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      // Mettre à jour l'historique local
      setNotificationHistory((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      return true;
    } catch (err) {
      addNotification('error', 'Erreur lors de la mise à jour');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [addNotification]);

  /**
   * Supprimer une notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    setUpdating(true);
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      // Mettre à jour l'historique local
      setNotificationHistory((prev) => prev.filter((n) => n.id !== notificationId));
      addNotification('success', 'Notification supprimée');
      return true;
    } catch (err) {
      addNotification('error', 'Erreur lors de la suppression');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [addNotification]);

  /**
   * Nettoyer l'historique des notifications
   */
  const clearHistory = useCallback(async () => {
    setUpdating(true);
    try {
      await apiClient.delete('/notifications/history');
      setNotificationHistory([]);
      addNotification('success', 'Historique nettoyé');
      return true;
    } catch (err) {
      addNotification('error', 'Erreur lors du nettoyage');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [addNotification]);

  return {
    // État
    preferences,
    notificationHistory,
    templates,
    loading,
    updating,
    error,
    pagination,

    // Fonctions
    fetchPreferences,
    fetchNotificationHistory,
    fetchTemplates,
    updatePreferences,
    updateChannel,
    updateNotificationType,
    sendTestNotification,
    markAsRead,
    deleteNotification,
    clearHistory,
  };
};

/**
 * Données mockées pour développement
 */
function generateMockPreferences() {
  return {
    id: 'pref-001',
    userId: 'user-001',
    channels: {
      email: true,
      push: true,
      inApp: true,
      sms: false,
    },
    types: {
      offer_received: true,
      offer_rejected: true,
      payment_reminder: true,
      document_signing: true,
      transaction_completed: true,
      message_received: true,
      system_alerts: true,
      promotion: false,
      news: false,
    },
    frequency: 'immediate', // immediate, daily, weekly, never
    quiet_hours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
    unsubscribe_all: false,
    updated_at: new Date().toISOString(),
  };
}

function generateMockHistory() {
  const types = [
    'offer_received',
    'payment_reminder',
    'document_signing',
    'message_received',
    'transaction_completed',
  ];
  const channels = ['email', 'push', 'inApp'];

  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => ({
    id: `notif-${i + 1}`,
    userId: 'user-001',
    type: types[Math.floor(Math.random() * types.length)],
    channel: channels[Math.floor(Math.random() * channels.length)],
    title: [
      'Nouvelle offre reçue',
      'Rappel de paiement',
      'Document à signer',
      'Nouveau message',
      'Transaction complétée',
    ][Math.floor(Math.random() * 5)],
    message:
      'Message de notification avec détails importants pour l\'utilisateur',
    status: Math.random() > 0.3 ? 'sent' : 'failed', // sent, failed, pending
    read: i < 5,
    created_at: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

function generateMockTemplates() {
  return [
    {
      id: 'tpl-001',
      name: 'offer_received',
      label: 'Nouvelle offre reçue',
      subject: 'Vous avez reçu une nouvelle offre pour {property_name}',
      preview: 'Offer of {price} from {buyer_name}',
      variables: ['property_name', 'price', 'buyer_name', 'listing_id'],
    },
    {
      id: 'tpl-002',
      name: 'payment_reminder',
      label: 'Rappel de paiement',
      subject: 'Rappel: Paiement dû pour {property_name}',
      preview: 'Payment of {amount} due on {due_date}',
      variables: ['property_name', 'amount', 'due_date', 'transaction_id'],
    },
    {
      id: 'tpl-003',
      name: 'document_signing',
      label: 'Document à signer',
      subject: 'Document en attente de votre signature pour {property_name}',
      preview: 'Document {document_name} requires your signature',
      variables: ['property_name', 'document_name', 'deadline', 'signing_link'],
    },
    {
      id: 'tpl-004',
      name: 'transaction_completed',
      label: 'Transaction complétée',
      subject: 'Transaction complétée pour {property_name}',
      preview: 'Your transaction has been finalized',
      variables: ['property_name', 'completion_date', 'final_amount'],
    },
    {
      id: 'tpl-005',
      name: 'message_received',
      label: 'Nouveau message',
      subject: 'Nouveau message de {sender_name}',
      preview: 'New message: {message_preview}',
      variables: ['sender_name', 'message_preview', 'conversation_id'],
    },
  ];
}
