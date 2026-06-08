import React from 'react';
import '../../styles/TransactionTimeline.css';

/**
 * Composant pour afficher la timeline d'une transaction
 * Affiche tous les événements chronologiques
 */
const TransactionTimeline = ({ transaction }) => {
  if (!transaction || !transaction.timeline) {
    return (
      <div className="timeline-container empty">
        <p>📭 Aucun événement</p>
      </div>
    );
  }

  const getActionIcon = (action) => {
    const icons = {
      listing_created: '🏘️',
      offer_submitted: '💬',
      offer_counter: '💭',
      offer_accepted: '✅',
      offer_rejected: '❌',
      payment_initiated: '💳',
      payment_received: '✓',
      document_signed: '📋',
      document_rejected: '❌',
      transaction_completed: '🎉',
    };
    return icons[action] || '📌';
  };

  const getActionLabel = (action) => {
    const labels = {
      listing_created: 'Annonce créée',
      offer_submitted: 'Offre soumise',
      offer_counter: 'Contre-offre',
      offer_accepted: 'Offre acceptée',
      offer_rejected: 'Offre rejetée',
      payment_initiated: 'Paiement initié',
      payment_received: 'Paiement reçu',
      document_signed: 'Document signé',
      document_rejected: 'Document rejeté',
      transaction_completed: 'Transaction complétée',
    };
    return labels[action] || action;
  };

  const getActorLabel = (actor) => {
    if (actor === 'seller') return 'Vendeur';
    if (actor === 'buyer') return 'Acheteur';
    return 'Système';
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="timeline-container">
      <h3>Chronologie</h3>

      <div className="timeline">
        {transaction.timeline.map((event, index) => (
          <div key={event.id} className="timeline-item">
            {/* Ligne verticale */}
            {index < transaction.timeline.length - 1 && <div className="timeline-line" />}

            {/* Cercle + contenu */}
            <div className="timeline-dot">{getActionIcon(event.action)}</div>

            <div className="timeline-content">
              <div className="timeline-header">
                <h4>{getActionLabel(event.action)}</h4>
                <span className="timeline-actor">
                  Par: {getActorLabel(event.actor)}
                </span>
              </div>

              <p className="timeline-details">{event.details}</p>

              <span className="timeline-date">
                {formatDate(event.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="timeline-summary">
        <div className="summary-stat">
          <label>Total d'événements</label>
          <p>{transaction.timeline.length}</p>
        </div>
        <div className="summary-stat">
          <label>Dernier événement</label>
          <p>{new Date(transaction.timeline[transaction.timeline.length - 1].timestamp).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionTimeline;
