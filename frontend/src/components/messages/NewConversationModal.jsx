import React, { useState } from 'react';
import '../../styles/NewConversationModal.css';

/**
 * Modal pour créer une nouvelle conversation
 * Sélectionner un participant et un sujet
 */
const NewConversationModal = ({ isOpen, onClose, onCreateConversation, loading }) => {
  const [participantId, setParticipantId] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState(null);

  // Mock users - à remplacer par les données réelles du backend
  const availableUsers = [
    { id: 1, name: 'Pierre Dupont', avatar: '👨', email: 'pierre@immo2000.fr' },
    { id: 2, name: 'Marie Martin', avatar: '👩', email: 'marie@immo2000.fr' },
    { id: 3, name: 'Jean Bernard', avatar: '👨', email: 'jean@immo2000.fr' },
    { id: 4, name: 'Sophie Laurent', avatar: '👩', email: 'sophie@immo2000.fr' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!participantId) {
      setError('Veuillez sélectionner un participant');
      return;
    }

    if (!subject.trim()) {
      setError('Veuillez entrer un sujet');
      return;
    }

    try {
      await onCreateConversation(parseInt(participantId), subject);
      setParticipantId('');
      setSubject('');
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nouvelle conversation</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          {/* Sélection participant */}
          <div className="form-group">
            <label htmlFor="participant">Participant</label>
            <select
              id="participant"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              required
              className="form-select"
            >
              <option value="">-- Sélectionner un participant --</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.avatar} {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Sujet */}
          <div className="form-group">
            <label htmlFor="subject">Sujet</label>
            <input
              id="subject"
              type="text"
              placeholder="Ex: Question sur l'annonce #245"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '⏳ Création...' : '✅ Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConversationModal;
