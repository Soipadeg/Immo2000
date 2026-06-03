/**
 * Composant Chatbot pour Immo2000
 *
 * Affiche un widget de chat permettant aux utilisateurs de:
 * - Poser des questions au chatbot IA
 * - Recevoir des réponses avec suggestions de liens
 * - Naviguer vers les fonctionnalités principales
 */

import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '👋 Bonjour! Je suis l\'assistant Immo2000. Comment puis-je vous aider? Vous pouvez me poser des questions sur nos services.',
      actions: [],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(`session-${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [userId] = useState(null); // À remplacer par l'utilisateur réel si connexion disponible
  const messagesEndRef = useRef(null);

  // Auto-scroll vers le dernier message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Ajouter le message de l'utilisateur
    const userMessageId = messages.length + 1;
    const userMessage = {
      id: userMessageId,
      sender: 'user',
      text: trimmedInput,
      actions: [],
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Envoyer au backend
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          session_id: sessionId,
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        const botMessage = {
          id: userMessageId + 1,
          sender: 'bot',
          text: data.data.reponse,
          actions: data.data.actions || [],
          intent: data.data.intent,
          confidence: data.data.confidence,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Erreur lors de la communication avec le chatbot');
      }
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage = {
        id: userMessageId + 1,
        sender: 'bot',
        text: '❌ Désolé, une erreur s\'est produite. Veuillez réessayer ou contacter notre support.',
        actions: [
          { type: 'link', text: 'Nous contacter', url: '/contact' }
        ],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="chatbot-overlay">
      <div className="chatbot-container">
        {/* Header */}
        <div className="chatbot-header">
          <div>💬 Assistant Immo2000</div>
          <button className="chatbot-close" onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message message-${msg.sender}`}>
              {msg.sender === 'bot' && <div className="message-avatar">🤖</div>}
              <div className="message-content">
                <div className="message-text">{msg.text}</div>
                {msg.confidence !== undefined && msg.confidence < 0.5 && (
                  <small className="message-note">⚠️ Réponse avec faible confiance</small>
                )}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="message-actions">
                    {msg.actions.map((action, i) => (
                      <a
                        key={i}
                        href={action.url}
                        className="action-button"
                        target={action.url.startsWith('http') ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                      >
                        {action.text}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {msg.sender === 'user' && <div className="message-avatar">👤</div>}
            </div>
          ))}
          {loading && (
            <div className="message message-bot">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input-area">
          <textarea
            className="chatbot-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez votre question..."
            rows="1"
            disabled={loading}
          />
          <button
            className="chatbot-send"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            title="Envoyer (Entrée)"
          >
            ➤
          </button>
        </div>

        {/* Footer */}
        <div className="chatbot-footer">
          <small>Powered by Immo2000 · Les réponses sont basées sur notre FAQ</small>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
