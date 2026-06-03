import '../styles/AdminTransactionsPage.css';
/**
 * TÂCHE 4: Gestion des Transactions
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert } from '@/components';
import { transactionsApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminTransactionsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [dialog, setDialog] = useState({ open: false, action: null, transactionId: null });
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && user?.role === 'admin') {
      loadTransactions();
    }
  }, [status, user, authLoading]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await transactionsApi.list(status || null);
      setTransactions(response.data?.data?.offres || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, transactionId) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'accept':
          await transactionsApi.accept(transactionId);
          break;
        case 'decline':
          await transactionsApi.decline(transactionId, reason);
          break;
        case 'cancel':
          await transactionsApi.cancel(transactionId, reason);
          break;
        default:
          break;
      }
      setDialog({ open: false, action: null, transactionId: null });
      setReason('');
      loadTransactions();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'action');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-transactions-page">
      <div className="page-header">
        <div>💳 Gestion des Transactions</div>
      </div>

      <div className="filters-section">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="filter-select">
          <option value="">Tous les statuts</option>
          <option value="proposee">Proposée</option>
          <option value="acceptee">Acceptée</option>
          <option value="refusee">Refusée</option>
          <option value="negociation">En négociation</option>
          <option value="retiree">Retirée</option>
          <option value="finalisee">Finalisée</option>
        </select>
      </div>

      {error && <Alert type="error" title="Erreur" message={error} />}

      {loading ? (
        <div className="loading-state">⏳ Chargement...</div>
      ) : transactions.length === 0 ? (
        <Alert type="info" title="Info" message="Aucune transaction trouvée" />
      ) : (
        <div className="table-wrapper">
          <div className="table-header">
            <div className="col-id">ID</div>
            <div className="col-annonce">Annonce ID</div>
            <div className="col-price">Prix proposé</div>
            <div className="col-status">Statut</div>
            <div className="col-date">Date</div>
            <div className="col-actions">Actions</div>
          </div>
          {transactions.map((tx) => (
            <div key={tx.offre_id} className="table-row">
              <div className="col-id">{tx.offre_id}</div>
              <div className="col-annonce">{tx.annonce_id}</div>
              <div className="col-price">€{(tx.prix_propose || 0).toLocaleString()}</div>
              <div className="col-status">
                <div className={`status-badge status-${tx.statut}`}>{tx.statut}</div>
              </div>
              <div className="col-date">{new Date(tx.date_offre).toLocaleDateString()}</div>
              <div className="col-actions">
                {tx.statut === 'proposee' && (
                  <>
                    <Button variant="primary" size="small" onClick={() => setDialog({ open: true, action: 'accept', transactionId: tx.offre_id })}>✓</Button>
                    <Button variant="danger" size="small" onClick={() => setDialog({ open: true, action: 'decline', transactionId: tx.offre_id })}>✗</Button>
                  </>
                )}
                {(tx.statut === 'proposee' || tx.statut === 'negociation') && (
                  <Button variant="secondary" size="small" onClick={() => setDialog({ open: true, action: 'cancel', transactionId: tx.offre_id })}>Annuler</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {dialog.open && (
        <div className="modal-overlay" onClick={() => setDialog({ open: false, action: null, transactionId: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>{dialog.action === 'accept' ? 'Accepter' : dialog.action === 'decline' ? 'Refuser' : 'Annuler'} cette offre?</div>
              <button className="modal-close" onClick={() => setDialog({ open: false, action: null, transactionId: null })}>✕</button>
            </div>
            {(dialog.action === 'decline' || dialog.action === 'cancel') && (
              <div className="modal-body">
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="modal-textarea" placeholder="Raison..."></textarea>
              </div>
            )}
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setDialog({ open: false, action: null, transactionId: null })}>Annuler</Button>
              <Button variant={dialog.action === 'accept' ? 'primary' : 'danger'} onClick={() => handleAction(dialog.action, dialog.transactionId)} disabled={actionLoading || ((dialog.action === 'decline' || dialog.action === 'cancel') && !reason)}>
                {actionLoading ? '⏳ ...' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionsPage;
