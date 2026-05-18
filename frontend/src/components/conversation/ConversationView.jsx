/**
 * Composant Conversation avec WebSocket
 * Phase 5.1 - Advanced Features
 *
 * Exemple d'utilisation du hook useConversation
 * Affiche les messages en temps réel, les utilisateurs qui tapent, etc.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#f5f5f5',
      }}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={otherUser?.avatar} alt={otherUser?.nom} />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {otherUser?.nom} {otherUser?.prenom}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: isUserOnline(otherUser?.id) ? '#4caf50' : '#ccc',
                }}
              />
              <Typography variant="caption" color="textSecondary">
                {isUserOnline(otherUser?.id) ? 'En ligne' : 'Hors ligne'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {!connected && (
          <Alert severity="warning" sx={{ mb: 0 }}>
            Connexion WebSocket perdue
          </Alert>
        )}
      </Paper>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', pt: 5 }}>
            <Typography color="textSecondary">
              Commencez une conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => (
            <Box
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
                <Typography variant="body2">{msg.content}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.7,
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString('fr-FR')}
                </Typography>
              </Paper>
            </Box>
          ))
        )}

        {/* Indicateur de typing */}
        {typing[otherUser?.id] && (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <CircularProgress size={20} />
            <Typography variant="caption" color="textSecondary">
              {otherUser?.nom} est en train d'écrire...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

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
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          disabled={!connected || !content.trim()}
          endIcon={<SendIcon />}
        >
          Envoyer
        </Button>
      </Paper>
    </Box>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Avatar src={conv.otherUser?.avatar} alt={conv.otherUser?.nom} />

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {conv.otherUser?.nom}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(conv.lastMessage?.timestamp).toLocaleDateString('fr-FR')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    noWrap
                    sx={{ flex: 1 }}
                  >
                    {conv.lastMessage?.content || 'Pas de message'}
                  </Typography>

                  {unreadCount > 0 && (
                    <Chip
                      label={unreadCount}
                      size="small"
                      color="primary"
                      variant="filled"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </Box>

              {/* Indicateur en ligne */}
              {onlineUsers?.includes(conv.otherUser?.id) && (
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#4caf50',
                  }}
                />
              )}
            </Box>
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
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Notifications ({notifications.length})
      </Typography>

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
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {notif.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {notif.message}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {new Date(notif.timestamp).toLocaleString('fr-FR')}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
