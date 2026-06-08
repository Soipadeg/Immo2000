import React, { useState, useEffect, useRef } from 'react';
import '../../styles/MessageThread.css';

/**
 * Composant pour afficher une conversation avec fil de messages
 * Permet d'envoyer des messages et de voir l'historique
 */
const MessageThread = ({
  conversation,
  messages,
  loading,
  onSendMessage,
  onArchiveConversation,
  onDeleteConversation,
}) => {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSending(true);
    try {
      await onSendMessage(conversation.id, messageText);
      setMessageText('');
    } finally {
      setSending(false);
    }
  };

  if (!conversation) {
    return (
      <div className="message-thread-container empty">
        <div className="empty-thread">
          <p>💬 Sélectionnez une conversation</p>
          <small>pour commencer à discuter</small>
        </div>
      </div>
    );
  }

  return (
    <div className="message-thread-container">
      {/* Header */}
      <div className="thread-header">
        <div className="thread-info">
          <div className="thread-avatar">{conversation.participant?.avatar || '👤'}</div>
          <div>
            <h3>{conversation.participant?.name || 'Inconnu'}</h3>
            <p className="thread-subject">{conversation.subject}</p>
          </div>
        </div>

        <div className="thread-actions">
          <button
            className="action-btn"
            onClick={() => onArchiveConversation(conversation.id)}
            title="Archiver"
          >
            📦
          </button>
          <button
            className="action-btn"
            onClick={() => onDeleteConversation(conversation.id)}
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            Chargement des messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">
            <p>📭 Aucun message</p>
            <small>Envoyez le premier message</small>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`message-item ${msg.sender.id === 1 ? 'sent' : 'received'}`}
              >
                {msg.sender.id !== 1 && (
                  <div className="message-avatar">{msg.sender.avatar}</div>
                )}

                <div className="message-bubble">
                  <p className="message-text">{msg.text}</p>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {msg.sender.id === 1 && (
                  <div className="message-avatar">{msg.sender.avatar}</div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Écrivez votre message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={sending}
          className="message-input"
        />
        <button type="submit" disabled={sending || !messageText.trim()} className="send-btn">
          {sending ? '⏳' : '📤'}
        </button>
      </form>
    </div>
  );
};

export default MessageThread;
