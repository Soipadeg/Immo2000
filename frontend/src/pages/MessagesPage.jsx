import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../hooks/useMessages';
import ConversationList from '../components/messages/ConversationList';
import MessageThread from '../components/messages/MessageThread';
import NewConversationModal from '../components/messages/NewConversationModal';
import '../styles/MessagesPage.css';

/**
 * Page de messagerie utilisateur
 * Affiche les conversations et permet d'envoyer des messages
 */
const MessagesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    conversations,
    messages,
    currentConversation,
    setCurrentConversation,
    loading,
    messageLoading,
    unreadCount,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    archiveConversation,
    deleteConversation,
  } = useMessages();

  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);

  // Charger les conversations au montage
  useEffect(() => {
    if (user && !authLoading) {
      fetchConversations();
    }
  }, [user, authLoading, fetchConversations]);

  // Charger les messages quand on sélectionne une conversation
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id);
    }
  }, [currentConversation, fetchMessages]);

  // Vérifier l'authentification
  if (authLoading) {
    return (
      <div className="messages-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSelectConversation = (conversation) => {
    setCurrentConversation(conversation);
  };

  const handleCreateConversation = async (participantId = null, subject = '') => {
    // Si appelé depuis le modal
    if (participantId) {
      setCreatingConversation(true);
      try {
        const newConversation = await createConversation(participantId, subject);
        setCurrentConversation(newConversation);
        setShowNewConversationModal(false);
      } finally {
        setCreatingConversation(false);
      }
    } else {
      // Ouvrir le modal
      setShowNewConversationModal(true);
    }
  };

  const handleSendMessage = async (conversationId, text) => {
    await sendMessage(conversationId, text);
  };

  return (
    <div className="messages-page">
      {/* Header */}
      <div className="messages-header">
        <div className="header-content">
          <h1>💬 Messages</h1>
          <p>
            {unreadCount > 0 && (
              <span className="unread-indicator">
                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="messages-container">
        {/* Sidebar - Conversations */}
        <div className="messages-sidebar">
          <ConversationList
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={handleSelectConversation}
            onCreateConversation={() => handleCreateConversation()}
            onArchiveConversation={archiveConversation}
            loading={loading}
          />
        </div>

        {/* Main - Message Thread */}
        <div className="messages-main">
          <MessageThread
            conversation={currentConversation}
            messages={messages}
            loading={messageLoading}
            onSendMessage={handleSendMessage}
            onArchiveConversation={archiveConversation}
            onDeleteConversation={deleteConversation}
          />
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onCreateConversation={handleCreateConversation}
        loading={creatingConversation}
      />
    </div>
  );
};

export default MessagesPage;
