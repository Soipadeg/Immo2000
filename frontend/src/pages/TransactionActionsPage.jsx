import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTransactionActions } from '../hooks/useTransactionActions';
import TransactionOfferModal from '../components/transactions/TransactionOfferModal';
import TransactionDetailsModal from '../components/transactions/TransactionDetailsModal';
import TransactionTimeline from '../components/transactions/TransactionTimeline';
import '../styles/TransactionActionsPage.css';

/**
 * Page de gestion des actions sur les transactions
 * Accept/reject offers, payment status, document signing, timeline
 */
const TransactionActionsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    transactions,
    currentTransaction,
    transactionDetails,
    loading,
    actionLoading,
    fetchTransactions,
    fetchTransactionDetails,
    acceptOffer,
    rejectOffer,
    updatePaymentStatus,
    setCurrentTransaction,
  } = useTransactionActions();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Charger les transactions au montage
  useEffect(() => {
    if (user && !authLoading) {
      fetchTransactions({ status: statusFilter });
    }
  }, [user, authLoading, statusFilter, fetchTransactions]);

  // Vérifier l'authentification
  if (authLoading) {
    return (
      <div className="transaction-page">
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

  // Filtrer les transactions
  const filteredTransactions = transactions.filter(t =>
    t.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.buyer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.seller?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectTransaction = (transaction) => {
    setCurrentTransaction(transaction);
    fetchTransactionDetails(transaction.id);
    setShowDetailsModal(true);
  };

  const handleOpenOfferModal = (transaction, offer) => {
    setCurrentTransaction(transaction);
    setSelectedOffer(offer);
    setShowOfferModal(true);
  };

  const statusLabels = {
    pending: '⏳ En attente',
    negotiating: '💬 Négociation',
    accepted: '✅ Acceptée',
    payment_pending: '💳 Paiement en attente',
    completed: '🎉 Complétée',
  };

  const statusColors = {
    pending: 'warning',
    negotiating: 'info',
    accepted: 'success',
    payment_pending: 'warning',
    completed: 'success',
  };

  return (
    <div className="transaction-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>💼 Gestion des Transactions</h1>
          <p>Acceptez ou rejetez les offres, gérez les paiements et les documents</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Rechercher par bien, acheteur ou vendeur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="negotiating">Négociation</option>
          <option value="accepted">Acceptée</option>
          <option value="payment_pending">Paiement en attente</option>
          <option value="completed">Complétée</option>
        </select>
      </div>

      {/* Transactions List */}
      <div className="transactions-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            Chargement des transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>📭 Aucune transaction</p>
            <small>Créez une nouvelle annonce pour recevoir des offres</small>
          </div>
        ) : (
          <div className="transactions-grid">
            {filteredTransactions.map(transaction => (
              <div
                key={transaction.id}
                className={`transaction-card status-${statusColors[transaction.status]}`}
              >
                <div className="card-header">
                  <h3>{transaction.property}</h3>
                  <div className={`status-badge ${statusColors[transaction.status]}`}>
                    {statusLabels[transaction.status]}
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Vendeur</span>
                    <span className="value">{transaction.seller?.name}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Acheteur</span>
                    <span className="value">{transaction.buyer?.name}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Prix demandé</span>
                    <span className="value price">
                      {transaction.askingPrice?.toLocaleString('fr-FR')}€
                    </span>
                  </div>

                  {transaction.offers && transaction.offers.length > 0 && (
                    <div className="info-row">
                      <span className="label">Offres</span>
                      <span className="value badge">{transaction.offers.length}</span>
                    </div>
                  )}

                  {transaction.payment && (
                    <div className="info-row">
                      <span className="label">Paiement</span>
                      <span className={`value ${transaction.payment.status === 'paid' ? 'success' : 'pending'}`}>
                        {transaction.payment.status === 'paid' ? '✅ Payé' : '⏳ En attente'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  {/* Pending Offers */}
                  {transaction.offers?.filter(o => o.status === 'pending').map(offer => (
                    <button
                      key={offer.id}
                      onClick={() => handleOpenOfferModal(transaction, offer)}
                      className="btn btn-primary"
                    >
                      💬 Gérer l'offre ({offer.price?.toLocaleString('fr-FR')}€)
                    </button>
                  ))}

                  {/* View Details */}
                  <button
                    onClick={() => handleSelectTransaction(transaction)}
                    className="btn btn-secondary"
                  >
                    👁️ Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        transaction={currentTransaction}
        offer={selectedOffer}
        onAccept={acceptOffer}
        onReject={rejectOffer}
        loading={actionLoading}
      />

      <TransactionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        transaction={transactionDetails}
        onAcceptOffer={acceptOffer}
        onRejectOffer={rejectOffer}
        loading={actionLoading}
      />
    </div>
  );
};

export default TransactionActionsPage;
