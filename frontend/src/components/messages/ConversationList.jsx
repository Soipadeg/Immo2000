import React, { useState, useEffect } from 'react';
import '../../styles/ConversationList.css';

/**
 * Composant pour afficher la liste des conversations
 * Avec recherche, filtres et indicateurs de non-lus
 */
const ConversationList = ({
  conversations,
  currentConversation,
  onSelectConversation,
  onCreateConversation,
  onArchiveConversation,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(conversations);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
    } else {
      const search = searchTerm.toLowerCase();
      setFilteredConversations(
        conversations.filter(conv =>
          conv.subject.toLowerCase().includes(search) ||
          conv.participant?.name.toLowerCase().includes(search) ||
          conv.lastMessage.toLowerCase().includes(search)
        )
      );
    }
  }, [searchTerm, conversations]);

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else if (days < 7) {
      return `${days}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="conversation-list-container">
      <div className="conversation-list-header">
        <h2>Messages</h2>
        <button
          className="btn-new-message"
          onClick={onCreateConversation}
          title="Nouvelle conversation"
        >
          ✏️ Nouveau
        </button>
      </div>

      <div className="conversation-search">
        <input
          type="text"
          placeholder="Rechercher une conversation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="conversation-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            Chargement...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="empty-state">
            <p>📭 Aucune conversation</p>
            <small>Créez une nouvelle conversation pour commencer</small>
          </div>
        ) : (
          filteredConversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${
                currentConversation?.id === conv.id ? 'active' : ''
              } ${conv.unread_count > 0 ? 'unread' : ''}`}
              onClick={() => onSelectConversation(conv)}
            >
              <div className="conversation-avatar">
                {conv.participant?.avatar || '👤'}
              </div>

              <div className="conversation-content">
                <div className="conversation-header">
                  <h3>{conv.participant?.name || 'Inconnu'}</h3>
                  <span className="conversation-time">
                    {formatTime(conv.lastMessageTime)}
                  </span>
                </div>

                <p className="conversation-subject">{conv.subject}</p>
                <p className="conversation-preview">{conv.lastMessage}</p>
              </div>

              {conv.unread_count > 0 && (
                <span className="unread-badge">{conv.unread_count}</span>
              )}

              <div className="conversation-actions">
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchiveConversation(conv.id);
                  }}
                  title="Archiver"
                >
                  📦
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
