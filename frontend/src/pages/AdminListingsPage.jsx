import '../styles/AdminListingsPage.css';
/**
 * TÂCHE 3: Modération des Annonces
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Alert } from '@/components';
import { listingsApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminListingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState({ open: false, action: null, listingId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && user?.role === 'admin') {
      loadListings();
    }
  }, [user, authLoading]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const response = await listingsApi.getPending();
      setListings(response.data?.data?.brouillons || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, listingId) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'approve':
          await listingsApi.approve(listingId);
          break;
        case 'reject':
          await listingsApi.reject(listingId, rejectReason);
          break;
        case 'remove':
          await listingsApi.remove(listingId);
          break;
        default:
          break;
      }
      setDialog({ open: false, action: null, listingId: null });
      setRejectReason('');
      loadListings();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'action');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-listings-page">
      <div className="page-header">
        <h1>🏠 Modération des Annonces</h1>
      </div>

      {error && <Alert type="error" title="Erreur" message={error} />}

      {loading ? (
        <div className="admin-container">
          <div className="loading-spinner">⏳ Chargement...</div>
        </div>
      ) : (
        <>
          {listings.length === 0 ? (
            <Alert type="success" title="Succès" message="✅ Toutes les annonces en attente ont été modérées" />
          ) : (
            <>
              <Alert type="info" title="Info" message={`${listings.length} annonce(s) en attente de modération`} />

              <div className="listings-grid">
                {listings.map((listing) => (
                  <div key={listing.annonce_id} className="listing-card">
                    <h3>{listing.titre || 'Sans titre'}</h3>
                    <div className="listing-meta">
                      <span className="price-badge">€{listing.prix || 0}</span>
                      <span className="type-badge">{listing.type_bien || 'N/A'}</span>
                    </div>
                    <p className="listing-desc">{listing.description || 'Pas de description'}</p>
                    <div className="listing-actions">
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => setDialog({ open: true, action: 'approve', listingId: listing.annonce_id })}
                      >
                        ✓ Approuver
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setDialog({ open: true, action: 'reject', listingId: listing.annonce_id })}
                      >
                        ✗ Rejeter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Dialog Modal */}
      {dialog.open && (
        <div className="modal-overlay" onClick={() => setDialog({ open: false, action: null, listingId: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{dialog.action === 'approve' ? 'Approuver' : 'Rejeter'} cette annonce?</h2>
              <button className="modal-close" onClick={() => setDialog({ open: false, action: null, listingId: null })}>✕</button>
            </div>
            {dialog.action === 'reject' && (
              <div className="modal-body">
                <textarea
                  className="reject-textarea"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Contenu inapproprié, photo manquante, prix anormal..."
                ></textarea>
              </div>
            )}
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setDialog({ open: false, action: null, listingId: null })}
              >
                Annuler
              </Button>
              <Button
                variant={dialog.action === 'approve' ? 'primary' : 'danger'}
                onClick={() => handleAction(dialog.action, dialog.listingId)}
                disabled={actionLoading || (dialog.action === 'reject' && !rejectReason)}
              >
                {actionLoading ? '⏳ ...' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminListingsPage;
