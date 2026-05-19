/**
 * Page de gestion des offres d'achat (Mes offres)
 * Affiche les offres faites par l'acheteur et les offres reçues par le vendeur
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert, Input, Modal } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { offresApi } from '../services/api';
import '../styles/OffresPage.css';

/**
 * Composant pour afficher une offre
 */
const OfferCard = ({ offre, isVendor, onUpdate }) => {
  const [openCounterDialog, setOpenCounterDialog] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      await offresApi.accept(offre.offre_id);
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await offresApi.reject(offre.offre_id);
      onUpdate();
    } catch (error) {
      console.error('Erreur lors du refus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCounter = async () => {
    try {
      setLoading(true);
      await offresApi.counter(offre.offre_id, {
        prix_contre_propose: parseFloat(counterPrice),
      });
      setOpenCounterDialog(false);
      setCounterPrice('');
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la contre-offre:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statut) => {
    const colors = {
      proposee: 'info',
      acceptee: 'success',
      refusee: 'error',
      negociation: 'warning',
      retiree: 'default',
      finalisee: 'success',
    };
    return colors[statut] || 'default';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      proposee: 'Proposée',
      acceptee: 'Acceptée',
      refusee: 'Refusée',
      negociation: 'Négociation',
      retiree: 'Retirée',
      finalisee: 'Finalisée',
    };
    return labels[statut] || statut;
  };

  return (
    <div className="offer-card">
      <div className="offer-header">
        <div className="offer-title-section">
          <h3 className="offer-id">Offre #{offre.offre_id}</h3>
          <p className="offer-party">
            {isVendor ? `De: ${offre.acheteur_nom}` : `Pour: ${offre.annonce_titre}`}
          </p>
        </div>
        <span className={`offer-status status-${offre.statut}`}>
          {getStatusLabel(offre.statut)}
        </span>
      </div>

      <div className="offer-content">
        <div className="price-grid">
          <div className="price-item">
            <span className="price-label">Prix proposé</span>
            <span className="price-value">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(offre.prix_propose)}
            </span>
          </div>
          {offre.prix_contre_propose && (
            <div className="price-item">
              <span className="price-label">Contre-proposition</span>
              <span className="price-value">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(offre.prix_contre_propose)}
              </span>
            </div>
          )}
          <div className="price-item">
            <span className="price-label">Date</span>
            <span className="date-value">
              {new Date(offre.date_offre).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        {offre.message && (
          <div className="offer-message">
            <span className="message-label">Message</span>
            <p className="message-text">{offre.message}</p>
          </div>
        )}
      </div>

      <div className="offer-actions">
        {isVendor && offre.statut === 'proposee' && (
          <>
            <Button
              variant="secondary"
              size="small"
              onClick={handleAccept}
              disabled={loading}
            >
              ✓ Accepter
            </Button>
            <Button
              variant="danger"
              size="small"
              onClick={handleReject}
              disabled={loading}
            >
              ✗ Refuser
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={() => setOpenCounterDialog(true)}
              disabled={loading}
            >
              ↔ Contre-offre
            </Button>
          </>
        )}

        {!isVendor && offre.statut === 'negociation' && (
          <>
            <Button
              variant="secondary"
              size="small"
              onClick={handleAccept}
              disabled={loading}
            >
              ✓ Accepter
            </Button>
            <Button
              variant="danger"
              size="small"
              onClick={handleReject}
              disabled={loading}
            >
              ✗ Refuser
            </Button>
          </>
        )}
      </div>

      {openCounterDialog && (
        <Modal
          isOpen={openCounterDialog}
          title="Faire une contre-offre"
          onClose={() => setOpenCounterDialog(false)}
        >
          <div className="counter-offer-form">
            <p className="current-price">
              Montant actuel: {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(offre.prix_propose)}
            </p>
            <Input
              type="number"
              label="Nouveau prix proposé"
              value={counterPrice}
              onChange={(e) => setCounterPrice(e.target.value)}
              inputProps={{ step: '1000' }}
            />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setOpenCounterDialog(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleCounter}
                disabled={loading || !counterPrice}
              >
                Proposer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

/**
 * Page principale - Onglets pour Offres faites / Offres reçues
 */
export default function OffresPage() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [buyerOffers, setBuyerOffers] = useState([]);
  const [vendorOffers, setVendorOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOffers = async () => {
    try {
      setLoading(true);
      const [buyerRes, vendorRes] = await Promise.all([
        offresApi.getBuyerOffers().catch(() => ({ data: [] })),
        offresApi.getVendorOffers().catch(() => ({ data: [] })),
      ]);
      setBuyerOffers(buyerRes.data);
      setVendorOffers(vendorRes.data);
    } catch (err) {
      setError('Erreur lors du chargement des offres');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <div className="offres-container">
        <div className="loading-spinner">⏳ Chargement...</div>
      </div>
    );
  }

  return (
    <div className="offres-page">
      <div className="page-header">
        <h1>Gestion des offres</h1>
      </div>

      {error && <Alert type="error" title="Erreur" message={error} />}

      <div className="tabs-nav">
        {[
          { label: `Offres faites (${buyerOffers.length})`, index: 0 },
          { label: `Offres reçues (${vendorOffers.length})`, index: 1 },
        ].map((tab) => (
          <button
            key={tab.index}
            className={`tab-btn ${tabValue === tab.index ? 'active' : ''}`}
            onClick={() => setTabValue(tab.index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tabValue === 0 && (
          <div>
            {buyerOffers.length === 0 ? (
              <Alert type="info" title="Info" message="Vous n'avez pas encore fait d'offre" />
            ) : (
              buyerOffers.map((offre) => (
                <OfferCard
                  key={offre.offre_id}
                  offre={offre}
                  isVendor={false}
                  onUpdate={loadOffers}
                />
              ))
            )}
          </div>
        )}

        {tabValue === 1 && (
          <div>
            {vendorOffers.length === 0 ? (
              <Alert type="info" title="Info" message="Vous n'avez pas reçu d'offre" />
            ) : (
              vendorOffers.map((offre) => (
                <OfferCard
                  key={offre.offre_id}
                  offre={offre}
                  isVendor={true}
                  onUpdate={loadOffers}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
