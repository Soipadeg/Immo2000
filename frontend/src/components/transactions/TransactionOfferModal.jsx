import React, { useState } from 'react';
import '../../styles/TransactionOfferModal.css';

/**
 * Modal pour accepter ou rejeter une offre
 * Affiche les détails de l'offre et permet une contre-offre
 */
const TransactionOfferModal = ({
  isOpen,
  onClose,
  transaction,
  offer,
  onAccept,
  onReject,
  loading,
}) => {
  const [action, setAction] = useState('accept'); // 'accept', 'reject', 'counter'
  const [counterPrice, setCounterPrice] = useState(offer?.price || 0);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen || !offer || !transaction) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (action === 'accept') {
        await onAccept(transaction.id, offer.id);
      } else if (action === 'reject') {
        if (!rejectReason.trim()) {
          setError('Veuillez expliquer le rejet');
          return;
        }
        await onReject(transaction.id, offer.id, rejectReason);
      } else if (action === 'counter') {
        if (counterPrice <= 0) {
          setError('Veuillez entrer un prix valide');
          return;
        }
        // À implémenter: counter offer endpoint
        console.log('Counter offer:', counterPrice);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur');
    }
  };

  const priceChange = ((offer.price - transaction.askingPrice) / transaction.askingPrice) * 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestion de l'offre</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Offre Summary */}
        <div className="offer-summary">
          <div className="property-info">
            <h3>{transaction.property}</h3>
            <p className="buyer-name">De: {offer.buyer || transaction.buyer?.name}</p>
          </div>

          <div className="offer-prices">
            <div className="price-card">
              <label>Prix demandé</label>
              <p className="price">{transaction.askingPrice?.toLocaleString('fr-FR')}€</p>
            </div>

            <div className="price-card">
              <label>Offre reçue</label>
              <p className="price">{offer.price?.toLocaleString('fr-FR')}€</p>
              <span className={`price-change ${priceChange < 0 ? 'negative' : 'positive'}`}>
                {priceChange < 0 ? '↓' : '↑'} {Math.abs(priceChange).toFixed(1)}%
              </span>
            </div>

            <div className="price-card">
              <label>Différence</label>
              <p className="price">{(offer.price - transaction.askingPrice)?.toLocaleString('fr-FR')}€</p>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Actions */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="action-tabs">
            <button
              type="button"
              className={`tab-btn ${action === 'accept' ? 'active' : ''}`}
              onClick={() => setAction('accept')}
            >
              ✅ Accepter
            </button>
            <button
              type="button"
              className={`tab-btn ${action === 'counter' ? 'active' : ''}`}
              onClick={() => setAction('counter')}
            >
              💬 Contre-offre
            </button>
            <button
              type="button"
              className={`tab-btn ${action === 'reject' ? 'active' : ''}`}
              onClick={() => setAction('reject')}
            >
              ❌ Rejeter
            </button>
          </div>

          {/* Accept Tab */}
          {action === 'accept' && (
            <div className="tab-content">
              <p>Êtes-vous sûr d'accepter cette offre?</p>
              <div className="info-box">
                <p>✅ L'acheteur sera notifié immédiatement</p>
                <p>✅ Vous pourrez signer les documents</p>
                <p>✅ Le paiement sera planifié</p>
              </div>
            </div>
          )}

          {/* Counter Tab */}
          {action === 'counter' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Votre contre-offre (€)</label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(parseInt(e.target.value))}
                  min={transaction.askingPrice * 0.8}
                  max={transaction.askingPrice * 1.2}
                  className="form-input"
                />
                <small>
                  Prix min: {(transaction.askingPrice * 0.8)?.toLocaleString('fr-FR')}€ |
                  Prix max: {(transaction.askingPrice * 1.2)?.toLocaleString('fr-FR')}€
                </small>
              </div>
            </div>
          )}

          {/* Reject Tab */}
          {action === 'reject' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Raison du rejet</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Le prix est trop bas pour cette propriété..."
                  rows="4"
                  className="form-textarea"
                />
              </div>
              <div className="info-box warning">
                <p>⚠️ L'acheteur recevra votre message de rejet</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? '⏳' : '✅'} {action === 'accept' ? 'Accepter' : action === 'counter' ? 'Proposer' : 'Rejeter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionOfferModal;
