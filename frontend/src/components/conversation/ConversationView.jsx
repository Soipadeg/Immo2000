/**
 * Composant Conversation avec WebSocket
 * Phase 5.1 - Advanced Features
 *
 * Exemple d'utilisation du hook useConversation
 * Affiche les messages en temps réel, les utilisateurs qui tapent, etc.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useConversation, useOnlineStatus } from '../hooks/useWebSocket';
import { useAuthStore } from '../store/authStore';

/**
 * Composant principal de conversation
 */
export function ConversationView({ conversationId, otherUser }) {
  const { user } = useAuthStore();
  const {
    socket,
    connected,
    messages,
    users,
    typing,
    sendMessage,
    notifyTyping,
    notifyStopTyping,
  } = useConversation(conversationId);

  const { isUserOnline } = useOnlineStatus();
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gérer l'input de typing
  const handleInputChange = (e) => {
    setContent(e.target.value);

    // Notifier que l'utilisateur tape
    if (!isTyping) {
      setIsTyping(true);
      notifyTyping();
    }

    // Effacer le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Notifier l'arrêt du typing après 1 seconde d'inactivité
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      notifyStopTyping();
    }, 1000);
  };

  // Envoyer le message
  const handleSendMessage = () => {
    if (!content.trim()) return;

    sendMessage(content);
    setContent('');
    setIsTyping(false);
    notifyStopTyping();
  };

  // Touche Entrée pour envoyer
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendMessage();
    }
  };

  return (
    <div style={
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#f5f5f5',
      }
    >
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          backgroundColor: 'white',
          borderRadius: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={ display: 'flex', alignItems: 'center', gap: 2 }>
          <Avatar src={otherUser?.avatar} alt={otherUser?.nom} />
          <div>
            <span>
              {otherUser?.nom} {otherUser?.prenom}
            </span>
            <div style={ display: 'flex', alignItems: 'center', gap: 1 }>
              <div style={
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: isUserOnline(otherUser?.id) ? '#4caf50' : '#ccc',
                }
              />
              <span>
                {isUserOnline(otherUser?.id) ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>

        {!connected && (
          <Alert severity="warning" sx={{ mb: 0 }}>
            Connexion WebSocket perdue
          </Alert>
        )}
      </Paper>

      {/* Messages */}
      <div style={
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }
      >
        {messages.length === 0 ? (
          <div style={ textAlign: 'center', pt: 5 }>
            <span>
              Commencez une conversation!
            </span>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id || msg.timestamp}
              sx={{
                display: 'flex',
                justifyContent: msg.user_id === user?.id ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: '70%',
                  backgroundColor:
                    msg.user_id === user?.id ? '#2196f3' : '#fff',
                  color: msg.user_id === user?.id ? 'white' : 'black',
                }}
              >
                <span>{msg.content}</span>
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString('fr-FR')}
                </span>
              </Paper>
            </div>
          ))
        )}

        {/* Indicateur de typing */}
        {typing[otherUser?.id] && (
          <div style={ display: 'flex', gap: 0.5, alignItems: 'center' }>
            <CircularProgress size={20} />
            <span>
              {otherUser?.nom} est en train d'écrire...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          backgroundColor: 'white',
          borderRadius: 0,
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end',
        }}
      >
        <TextField
          multiline
          maxRows={4}
          fullWidth
          placeholder="Écrivez votre message..."
          value={content}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={!connected}
          size="small"
        />
        <button>}
        >
          Envoyer
        </button>
      </Paper>
    </div>
  );
}


/**
 * Composant de liste de conversations
 * Montre les conversations récentes avec nombre de messages non lus
 */
export function ConversationsList({ conversations, onSelectConversation }) {
  const { notifications } = require('../hooks/useWebSocket').useNotifications();
  const { onlineUsers } = require('../hooks/useWebSocket').useOnlineStatus();

  return (
    <List>
      {conversations.map((conv) => {
        const unreadCount = notifications.filter(
          (n) => n.conversation_id === conv.id && !n.read
        ).length;

        return (
          <ListItem
            key={conv.id}
            button
            onClick={() => onSelectConversation(conv)}
            sx={{
              borderBottom: '1px solid #eee',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <div style={ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }>
              <Avatar src={conv.otherUser?.avatar} alt={conv.otherUser?.nom} />

              <div style={ flex: 1 }>
                <div style={ display: 'flex', justifyContent: 'space-between' }>
                  <span>
                    {conv.otherUser?.nom}
                  </span>
                  <span>
                    {new Date(conv.lastMessage?.timestamp).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div style={ display: 'flex', justifyContent: 'space-between', mt: 0.5 }>
                  <span>
                    {conv.lastMessage?.content || 'Pas de message'}
                  </span>

                  {unreadCount > 0 && (
                    <Chip
                      label={unreadCount}
                      size="small"
                      color="primary"
                      variant="filled"
                      sx={{ ml: 1 }}
                    />
                  )}
                </div>
              </div>

              {/* Indicateur en ligne */}
              {onlineUsers?.includes(conv.otherUser?.id) && (
                <div style={
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#4caf50',
                  }
                />
              )}
            </div>
          </ListItem>
        );
      })}
    </List>
  );
}


/**
 * Composant de notifications en temps réel
 */
export function NotificationCenter() {
  const { notifications, markAsRead } = require('../hooks/useWebSocket').useNotifications();

  return (
    <div style={ p: 2 }>
      <span>
        Notifications ({notifications.length})
      </span>

      <List>
        {notifications.map((notif) => (
          <ListItem
            key={notif.id}
            sx={{
              backgroundColor: notif.read ? 'transparent' : '#f0f7ff',
              borderLeft: notif.read ? 'none' : '4px solid #2196f3',
              mb: 1,
              cursor: 'pointer',
            }}
            onClick={() => markAsRead(notif.id)}
          >
            <div style={ width: '100%' }>
              <span>
                {notif.title}
              </span>
              <span>
                {notif.message}
              </span>
              <span>
                {new Date(notif.timestamp).toLocaleString('fr-FR')}
              </span>
            </div>
          </ListItem>
        ))}
      </List>
    </div>
  );
}
