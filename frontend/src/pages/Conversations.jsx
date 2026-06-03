import '../styles/Conversations.css';
/**
 * Conversations.jsx - Messagerie liée aux RDV acceptés
 *
 * Affiche la conversation entre acheteur et vendeur
 * pour discuter d'un RDV confirmé
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button, Alert, Input } from '@/components';
// TODO: Replace MUI icons if used
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Conversations = () => {
  const { conversationId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // Charger la conversation et les messages
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    chargerConversation();
  }, [conversationId, user, token]);

  // Scroll vers le bas au chargement des messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const chargerConversation = async () => {
    try {
      setLoading(true);

      // Charger les détails de la conversation
      const convResponse = await api.get(`/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversation(convResponse.data.conversation);

      // Charger les messages
      const messagesResponse = await api.get(`/api/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(messagesResponse.data.messages || []);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Conversation non trouvée');
        setTimeout(() => navigate('/mes-rendez-vous'), 2000);
      } else {
        setError('Erreur lors du chargement de la conversation');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const envoyerMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }

    try {
      setSending(true);

      const response = await api.post(
        `/api/conversations/${conversationId}/messages`,
        { contenu: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [...prev, response.data.message]);
      setNewMessage('');
      setSuccess('Message envoyé');

      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Erreur lors de l\'envoi du message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const marquerCommeProprietaire = (message) => {
    return message.sender_id === user.utilisateur_id;
  };

  if (loading) {
    return (
      <div maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Conversation non trouvée</Alert>
      </div>
    );
  }

  return (
    <div maxWidth="md" sx={{ py: 4, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div sx={{ mb: 2 }}>
        <Button variant="text" onClick={() => navigate('/mes-rendez-vous')}>
          ← Retour aux RDV
        </Button>
        <div>Conversation</div>
        <div>RDV #{conversation.rdv_id}</div>
      </div>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Conteneur messages */}
      <Paper
        sx={{
          flex: 1,
          overflow: 'auto',
          mb: 2,
          p: 2,
          backgroundColor: '#f9f9f9'
        }}
      >
        <ul>
          {messages.length === 0 ? (
            <div sx={{ textAlign: 'center', py: 4 }}>
              <div>
                Aucun message pour le moment. Commencez la conversation!
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <React.Fragment key={message.message_id}>
                <li
                  sx={{
                    flexDirection: marquerCommeProprietaire(message) ? 'row-reverse' : 'row',
                    mb: 1,
                    p: 1
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{
                      bgcolor: marquerCommeProprietaire(message) ? '#2196F3' : '#4CAF50'
                    }}>
                      {message.sender_prenom?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={message.sender_prenom || 'Utilisateur'}
                    secondary={
                      <div>
                        <div>
                          {message.contenu}
                        </div>
                        <div>
                          {format(new Date(message.date_creation), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </div>
                      </div>
                    }
                    sx={{
                      textAlign: marquerCommeProprietaire(message) ? 'right' : 'left'
                    }}
                  />
                </li>
              </React.Fragment>
            ))
          )}
          <div ref={messagesEndRef} />
        </ul>
      </Paper>

      {/* Saisie message */}
      <div sx={{ display: 'flex', gap: 1 }}>
        <Input
          fullWidth
          multiline
          maxRows={3}
          placeholder="Écrivez votre message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              envoyerMessage();
            }
          }}
          disabled={sending}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={envoyerMessage}
          disabled={sending || !newMessage.trim()}
          sx={{ mt: 1 }}
        >
          Envoyer
        </Button>
      </div>
    </div>
  );
};

export default Conversations;
