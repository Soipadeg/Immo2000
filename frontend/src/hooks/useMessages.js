import { useState, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import apiClient from '../services/api/client';

/**
 * Hook pour gérer la messagerie utilisateur
 * Récupère, crée et gère les conversations et messages
 */
export const useMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ skip: 0, limit: 20, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const { addNotification } = useNotificationStore();

  /**
   * Récupérer la liste des conversations
   */
  const fetchConversations = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        skip: params.skip || pagination.skip,
        limit: params.limit || pagination.limit,
        ...(params.search && { search: params.search }),
        ...(params.unreadOnly && { unread_only: params.unreadOnly }),
      };

      const response = await apiClient.get('/messages/conversations', { params: query });

      if (response.data && response.data.data) {
        setConversations(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }

      // Récupérer le nombre de non lus
      const statsResponse = await apiClient.get('/messages/stats');
      if (statsResponse.data && statsResponse.data.data) {
        setUnreadCount(statsResponse.data.data.unread_count || 0);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du chargement des conversations';
      setError(message);
      addNotification('error', message);

      // Fallback mockées
      if (process.env.NODE_ENV === 'development') {
        setConversations(generateMockConversations());
      }
    } finally {
      setLoading(false);
    }
  }, [pagination, addNotification]);

  /**
   * Récupérer les messages d'une conversation
   */
  const fetchMessages = useCallback(async (conversationId, params = {}) => {
    setMessageLoading(true);
    setError(null);
    try {
      const query = {
        skip: params.skip || 0,
        limit: params.limit || 30,
      };

      const response = await apiClient.get(
        `/messages/conversations/${conversationId}/messages`,
        { params: query }
      );

      if (response.data && response.data.data) {
        setMessages(response.data.data);
        // Marquer la conversation comme lue
        await markConversationAsRead(conversationId);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du chargement des messages';
      setError(message);
      addNotification('error', message);

      // Fallback mockées
      if (process.env.NODE_ENV === 'development') {
        setMessages(generateMockMessages(conversationId));
      }
    } finally {
      setMessageLoading(false);
    }
  }, [addNotification]);

  /**
   * Envoyer un message
   */
  const sendMessage = useCallback(async (conversationId, text) => {
    try {
      const response = await apiClient.post(
        `/messages/conversations/${conversationId}/messages`,
        { text, attachments: [] }
      );

      if (response.data && response.data.data) {
        setMessages(prev => [...prev, response.data.data]);
        addNotification('success', 'Message envoyé');
        return response.data.data;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'envoi du message';
      addNotification('error', message);
      throw err;
    }
  }, [addNotification]);

  /**
   * Créer une nouvelle conversation
   */
  const createConversation = useCallback(async (participantId, subject = '') => {
    try {
      const response = await apiClient.post('/messages/conversations', {
        participant_id: participantId,
        subject: subject || 'Nouvelle conversation',
      });

      if (response.data && response.data.data) {
        setConversations(prev => [response.data.data, ...prev]);
        addNotification('success', 'Conversation créée');
        return response.data.data;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la création de la conversation';
      addNotification('error', message);
      throw err;
    }
  }, [addNotification]);

  /**
   * Marquer une conversation comme lue
   */
  const markConversationAsRead = useCallback(async (conversationId) => {
    try {
      await apiClient.put(`/messages/conversations/${conversationId}/read`);

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (err) {
      console.error('Erreur lors du marquage de lue:', err);
    }
  }, []);

  /**
   * Archiver une conversation
   */
  const archiveConversation = useCallback(async (conversationId) => {
    try {
      await apiClient.put(`/messages/conversations/${conversationId}/archive`);

      setConversations(prev =>
        prev.filter(conv => conv.id !== conversationId)
      );
      addNotification('success', 'Conversation archivée');
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'archivage';
      addNotification('error', message);
    }
  }, [addNotification]);

  /**
   * Supprimer une conversation
   */
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await apiClient.delete(`/messages/conversations/${conversationId}`);

      setConversations(prev =>
        prev.filter(conv => conv.id !== conversationId)
      );
      addNotification('success', 'Conversation supprimée');
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la suppression';
      addNotification('error', message);
    }
  }, [addNotification]);

  /**
   * Générer des conversations mockées
   */
  const generateMockConversations = () => {
    const subjects = [
      'Question sur l\'annonce #245',
      'Visite confirmée dimanche',
      'Demande d\'informations',
      'Financement et délais',
      'Négociation prix',
      'Conditions de vente',
    ];

    const participants = [
      { id: 1, name: 'Pierre Dupont', avatar: '👨' },
      { id: 2, name: 'Marie Martin', avatar: '👩' },
      { id: 3, name: 'Jean Bernard', avatar: '👨' },
      { id: 4, name: 'Sophie Laurent', avatar: '👩' },
    ];

    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      participant: participants[i % participants.length],
      subject: subjects[i % subjects.length],
      lastMessage: 'Vous: Oui, c\'est possible demain matin...',
      lastMessageTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      unread_count: Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0,
      isArchived: false,
    }));
  };

  /**
   * Générer des messages mockés
   */
  const generateMockMessages = (conversationId) => {
    const now = new Date();
    return Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      conversationId,
      sender: i % 2 === 0
        ? { id: 1, name: 'Vous', avatar: '👤' }
        : { id: 2, name: 'Pierre Dupont', avatar: '👨' },
      text: [
        'Bonjour, je suis intéressé par l\'annonce',
        'Oui, l\'appartement est encore disponible',
        'Pouvons-nous fixer une visite?',
        'Bien sûr! Demain à 14h vous convient?',
        'Parfait! À demain alors',
      ][i % 5],
      createdAt: new Date(now.getTime() - (15 - i) * 60 * 60 * 1000).toISOString(),
      attachments: [],
    }));
  };

  return {
    conversations,
    messages,
    currentConversation,
    setCurrentConversation,
    loading,
    messageLoading,
    error,
    pagination,
    unreadCount,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    markConversationAsRead,
    archiveConversation,
    deleteConversation,
    setPagination,
  };
};
