import React, { useState } from 'react';
import '../../styles/TransactionDetailsModal.css';

/**
 * Modal complet pour voir les détails d'une transaction
 * Affiche offres, paiements, documents et timeline
 */
const TransactionDetailsModal = ({ isOpen, onClose, transaction, onAcceptOffer, onRejectOffer, loading }) => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, offers, payment, documents, timeline

  if (!isOpen || !transaction) return null;

  const statusBadge = (status) => {
    const colors = {
      pending: 'warning',
      accepted: 'success',
      rejected: 'danger',
      pending_signature: 'info',
      signed: 'success',
      pending_payment: 'warning',
      paid: 'success',
      not_started: 'secondary',
    };
    const labels = {
      pending: 'En attente',
      accepted: 'Acceptée',
      rejected: 'Rejetée',
      pending_signature: 'En attente de signature',
      signed: 'Signé',
      pending_payment: 'Paiement en attente',
      paid: 'Payé',
      not_started: 'Non commencé',
    };
    return { color: colors[status] || 'secondary', label: labels[status] || status };
  };

  const handleAcceptOffer = async (offerId) => {
    await onAcceptOffer(transaction.id, offerId);
    onClose();
  };

  const handleRejectOffer = async (offerId) => {
    const reason = prompt('Raison du rejet:');
    if (reason) {
      await onRejectOffer(transaction.id, offerId, reason);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Transaction</h2>
            <p className="property-address">{transaction.property}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
          <button
            className={`tab-btn ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => setActiveTab('offers')}
          >
            Offres ({transaction.offers?.length || 0})
          </button>
          <button
            className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            Paiement
          </button>
          <button
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
          <button
            className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Chronologie
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="info-grid">
                <div className="info-card">
                  <h4>Vendeur</h4>
                  <p className="name">{transaction.seller?.name}</p>
                  <p className="email">{transaction.seller?.email}</p>
                </div>

                <div className="info-card">
                  <h4>Acheteur</h4>
                  <p className="name">{transaction.buyer?.name}</p>
                  <p className="email">{transaction.buyer?.email}</p>
                </div>

                <div className="info-card">
                  <h4>Prix demandé</h4>
                  <p className="price">{transaction.askingPrice?.toLocaleString('fr-FR')}€</p>
                </div>

                <div className="info-card">
                  <h4>Statut</h4>
                  <div className={`badge badge-${statusBadge(transaction.status).color}`}>
                    {statusBadge(transaction.status).label}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Offers Tab */}
          {activeTab === 'offers' && (
            <div className="tab-content">
              {transaction.offers && transaction.offers.length > 0 ? (
                <div className="offers-list">
                  {transaction.offers.map(offer => (
                    <div key={offer.id} className="offer-item">
                      <div className="offer-header">
                        <div>
                          <p className="offer-price">{offer.price?.toLocaleString('fr-FR')}€</p>
                          <p className="offer-buyer">{offer.buyer}</p>
                        </div>
                        <div className={`badge badge-${statusBadge(offer.status).color}`}>
                          {statusBadge(offer.status).label}
                        </div>
                      </div>

                      {offer.reason && <p className="offer-reason">Raison: {offer.reason}</p>}

                      <p className="offer-date">
                        {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
                      </p>

                      {offer.status === 'pending' && (
                        <div className="offer-actions">
                          <button
                            onClick={() => handleAcceptOffer(offer.id)}
                            disabled={loading}
                            className="btn btn-success"
                          >
                            ✅ Accepter
                          </button>
                          <button
                            onClick={() => handleRejectOffer(offer.id)}
                            disabled={loading}
                            className="btn btn-danger"
                          >
                            ❌ Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Aucune offre</div>
              )}
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="tab-content">
              {transaction.payment && (
                <div className="payment-section">
                  <div className="info-grid">
                    <div className="info-card">
                      <h4>Montant total</h4>
                      <p className="price">{transaction.payment.amount?.toLocaleString('fr-FR')}€</p>
                    </div>

                    <div className="info-card">
                      <h4>Dépôt de garantie</h4>
                      <p className="price">{transaction.payment.deposit?.toLocaleString('fr-FR')}€</p>
                      <p className={`status ${transaction.payment.depositPaid ? 'paid' : 'pending'}`}>
                        {transaction.payment.depositPaid ? '✅ Payé' : '⏳ En attente'}
                      </p>
                    </div>

                    <div className="info-card">
                      <h4>Statut</h4>
                      <div className={`badge badge-${statusBadge(transaction.payment.status).color}`}>
                        {statusBadge(transaction.payment.status).label}
                      </div>
                    </div>

                    <div className="info-card">
                      <h4>Échéance</h4>
                      <p>{new Date(transaction.payment.dueDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="tab-content">
              {transaction.documents && transaction.documents.length > 0 ? (
                <div className="documents-list">
                  {transaction.documents.map(doc => (
                    <div key={doc.id} className="document-item">
                      <div className="document-header">
                        <div>
                          <p className="document-name">📋 {doc.name}</p>
                          <p className="document-type">{doc.type === 'promise' ? 'Promesse de vente' : 'Acte authentique'}</p>
                        </div>
                        <div className={`badge badge-${statusBadge(doc.status).color}`}>
                          {statusBadge(doc.status).label}
                        </div>
                      </div>

                      <div className="signatories">
                        {doc.signatories && doc.signatories.map(sig => (
                          <p key={sig.role} className={`signatory ${sig.signed ? 'signed' : 'unsigned'}`}>
                            {sig.role === 'buyer' ? '👤 Acheteur' : '👤 Vendeur'}: {sig.signed ? '✅ Signé' : '⏳ En attente'}
                            {sig.signedAt && ` - ${new Date(sig.signedAt).toLocaleDateString('fr-FR')}`}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Aucun document</div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="tab-content timeline-tab">
              {transaction.timeline && transaction.timeline.length > 0 ? (
                <div className="timeline-simple">
                  {transaction.timeline.map(event => (
                    <div key={event.id} className="timeline-item">
                      <div className="timeline-marker">{event.action}</div>
                      <div>
                        <p className="timeline-event">{event.details}</p>
                        <p className="timeline-time">{new Date(event.timestamp).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Aucun événement</div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
