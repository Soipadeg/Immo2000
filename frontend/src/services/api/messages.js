/**
 * API endpoints pour les messages et notifications
 * Phase 4.2 - Centralisation des appels API
 */

import apiClient from './client';

export const messagesApi = {
  /**
   * Lister les messages d'une conversation
   */
  listConversation: (conversationId, skip = 0, limit = 50) =>
    apiClient.get(`/conversations/${conversationId}/messages`, {
      params: { skip, limit },
    }),

  /**
   * Créer une message
   */
  send: (conversationId, message) =>
    apiClient.post(`/conversations/${conversationId}/messages`, {
      contenu: message,
    }),

  /**
   * Marquer un message comme lu
   */
  markAsRead: (messageId) =>
    apiClient.patch(`/messages/${messageId}/read`, {}),

  /**
   * Supprimer un message
   */
  delete: (messageId) =>
    apiClient.delete(`/messages/${messageId}`),
};

export const conversationsApi = {
  /**
   * Lister les conversations de l'utilisateur
   */
  list: (skip = 0, limit = 20) =>
    apiClient.get('/conversations', {
      params: { skip, limit },
    }),

  /**
   * Créer une nouvelle conversation
   */
  create: (userId) =>
    apiClient.post('/conversations', { user_id: userId }),

  /**
   * Récupérer une conversation
   */
  getById: (id) =>
    apiClient.get(`/conversations/${id}`),

  /**
   * Marquer une conversation comme lue
   */
  markAsRead: (id) =>
    apiClient.patch(`/conversations/${id}/read`, {}),
};

export const notificationsApi = {
  /**
   * Lister les notifications de l'utilisateur
   */
  list: (skip = 0, limit = 20) =>
    apiClient.get('/notifications', {
      params: { skip, limit },
    }),

  /**
   * Compter les notifications non lues
   */
  getUnreadCount: () =>
    apiClient.get('/notifications/unread'),

  /**
   * Marquer une notification comme lue
   */
  markAsRead: (notificationId) =>
    apiClient.patch(`/notifications/${notificationId}/mark-as-read`, {}),

  /**
   * Supprimer une notification
   */
  delete: (notificationId) =>
    apiClient.delete(`/notifications/${notificationId}`),

  /**
   * Tester l'email
   */
  testEmail: (email, name) =>
    apiClient.post('/notifications/test', { email, name }),

  /**
   * Vérifier l'état des notifications
   */
  health: () =>
    apiClient.get('/notifications/health'),
};
