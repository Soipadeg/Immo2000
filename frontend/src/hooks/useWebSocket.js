/**
 * Hook useWebSocket pour la communication en temps réel
 * Phase 5.1 - Advanced Features
 *
 * Utilisation:
 *   const { socket, connected } = useWebSocket();
 *
 *   // Envoyer un message
 *   socket.emit('message:send', { conversation_id, content });
 *
 *   // Écouter un message
 *   socket.on('message:new', (msg) => {
 *     console.log('Nouveau message:', msg);
 *   });
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Hook principal pour WebSocket
 * Gère la connexion et les événements
 */
export function useWebSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuthStore();
  const showNotification = useNotificationStore().showSuccess;

  useEffect(() => {
    if (!user?.id) return;

    // Créer la connexion WebSocket
    const socket = io(SOCKET_URL, {
      query: {
        user_id: user.id,
      },
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    // Events de connexion
    socket.on('connect', () => {
      console.log('[WebSocket] Connecté au serveur');
      setConnected(true);
      showNotification('Connecté au serveur');
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Déconnecté du serveur');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Erreur de connexion:', error);
      useNotificationStore().showError('Erreur de connexion WebSocket');
    });

    // Events utilisateur
    socket.on('user:online', (data) => {
      console.log('[WebSocket] Utilisateur en ligne:', data.user_id);
    });

    socket.on('user:offline', (data) => {
      console.log('[WebSocket] Utilisateur hors ligne:', data.user_id);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  return {
    socket: socketRef.current,
    connected,
  };
}


/**
 * Hook pour les conversations en temps réel
 */
export function useConversation(conversationId) {
  const { socket, connected } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState({});
  const { user } = useAuthStore();

  useEffect(() => {
    if (!socket || !conversationId) return;

    // Rejoindre la conversation
    socket.emit('conversation:join', { conversation_id: conversationId });

    // Écouter les nouveaux messages
    socket.on('message:new', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Écouter qui tape
    socket.on('message:user-typing', (data) => {
      setTyping((prev) => ({
        ...prev,
        [data.user_id]: true,
      }));
    });

    socket.on('message:user-stop-typing', (data) => {
      setTyping((prev) => ({
        ...prev,
        [data.user_id]: false,
      }));
    });

    // Écouter les utilisateurs qui rejoignent
    socket.on('conversation:user-joined', (data) => {
      setUsers((prev) => [
        ...prev.filter((u) => u.user_id !== data.user_id),
        data,
      ]);
    });

    socket.on('conversation:user-left', (data) => {
      setUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));
    });

    return () => {
      socket.emit('conversation:leave', { conversation_id: conversationId });
      socket.off('message:new');
      socket.off('message:user-typing');
      socket.off('message:user-stop-typing');
      socket.off('conversation:user-joined');
      socket.off('conversation:user-left');
    };
  }, [socket, conversationId]);

  const sendMessage = useCallback(
    (content) => {
      if (!socket || !conversationId) return;

      socket.emit('message:send', {
        conversation_id: conversationId,
        content,
      });
    },
    [socket, conversationId]
  );

  const notifyTyping = useCallback(() => {
    if (!socket || !conversationId) return;

    socket.emit('message:typing', {
      conversation_id: conversationId,
    });
  }, [socket, conversationId]);

  const notifyStopTyping = useCallback(() => {
    if (!socket || !conversationId) return;

    socket.emit('message:stop-typing', {
      conversation_id: conversationId,
    });
  }, [socket, conversationId]);

  return {
    socket,
    connected,
    messages,
    users,
    typing,
    sendMessage,
    notifyTyping,
    notifyStopTyping,
  };
}


/**
 * Hook pour les notifications en temps réel
 */
export function useNotifications() {
  const { socket, connected } = useWebSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Écouter les nouvelles notifications
    socket.on('notification:new', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      useNotificationStore().showSuccess(notif.message);
    });

    socket.on('notification:read', (data) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.notification_id ? { ...n, read: true } : n
        )
      );
    });

    return () => {
      socket.off('notification:new');
      socket.off('notification:read');
    };
  }, [socket]);

  const markAsRead = useCallback(
    (notificationId) => {
      if (!socket) return;

      socket.emit('notification:mark-read', {
        notification_id: notificationId,
      });
    },
    [socket]
  );

  return {
    socket,
    connected,
    notifications,
    markAsRead,
  };
}


/**
 * Hook pour le statut en ligne
 */
export function useOnlineStatus() {
  const { socket, connected } = useWebSocket();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Récupérer la liste des utilisateurs en ligne
    socket.emit('status:online-users');

    socket.on('status:online-users-list', (data) => {
      setOnlineUsers(data.users);
    });

    return () => {
      socket.off('status:online-users-list');
    };
  }, [socket]);

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.includes(userId);
    },
    [onlineUsers]
  );

  return {
    socket,
    connected,
    onlineUsers,
    isUserOnline,
  };
}
