import '../styles/ModerationPage.css';
/**
 * Page Modération des Annonces (Admin)
 */

import React, { useState } from 'react';
import { Button, Alert, Input, FormContainer } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ModerationPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [annonces, setAnnonces] = useState([
    {
      id: 1,
      titre: 'Maison suspecte',
      prix: 450000,
      ville: 'Paris',
      image: 'https://via.placeholder.com/300x200?text=Annonce+1',
      statut: 'sous_revue',
      raison: 'Prix anormalement bas',
      signalements: 3,
    },
    {
      id: 2,
      titre: 'Appartement normal',
      prix: 350000,
      ville: 'Lyon',
      image: 'https://via.placeholder.com/300x200?text=Annonce+2',
      statut: 'approuve',
      raison: null,
      signalements: 0,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>⏳ Chargement...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleApprove = (id) => {
    setAnnonces(
      annonces.map((a) =>
        a.id === id ? { ...a, statut: 'approuve' } : a
      )
    );
  };

  const handleReject = (id) => {
    setSelectedAnnonce(annonces.find((a) => a.id === id));
    setOpenDialog(true);
  };

  const handleConfirmReject = () => {
    setAnnonces(
      annonces.map((a) =>
        a.id === selectedAnnonce.id ? { ...a, statut: 'rejetee', raison: rejectReason } : a
      )
    );
    setOpenDialog(false);
    setRejectReason('');
  };

  const pendingAnnonces = annonces.filter((a) => a.statut === 'sous_revue');

  return (
    <>
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">🛡️</span>
            <h1>Modération des Annonces</h1>
          </div>
          <p>{pendingAnnonces.length} annonce{pendingAnnonces.length !== 1 ? 's' : ''} en attente de modération</p>
        </div>
      </div>

      <FormContainer maxWidth="full-width">
        {pendingAnnonces.length === 0 ? (
          <div style={{textAlign: 'center', padding: '32px 0'}}>
            <div style={{fontSize: '48px', marginBottom: '16px'}}>✅</div>
            <div>✅ Toutes les annonces ont été modérées!</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {pendingAnnonces.map((annonce) => (
            <div key={annonce.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <img src={annonce.image} alt={annonce.titre} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{annonce.titre}</div>
                  <div
                    style={{display: 'inline-block', padding: '4px 8px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '12px'}}
                  >
                    🚩 {`${annonce.signalements} signalement${annonce.signalements > 1 ? 's' : ''}`}
                  </div>
                </div>

                <div style={{ marginBottom: '4px' }}>📍 {annonce.ville}</div>

                <div style={{ marginBottom: '8px' }}>{annonce.prix.toLocaleString()}€</div>

                {annonce.raison && (
                  <div style={{ padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '12px' }}>
                    <div>⚠️ {annonce.raison}</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="small"
                    color="success"
                    variant="contained"
                    onClick={() => handleApprove(annonce.id)}
                  >
                    ✅ Approuver
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => handleReject(annonce.id)}
                  >
                    ❌ Rejeter
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </FormContainer>

      {/* Modal Rejet */}
      {openDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginTop: 0 }}>Rejeter l'annonce</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Raison du rejet:</label>
              <textarea
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  minHeight: '100px'
                }}
                placeholder="Raison du rejet (ex: Images de mauvaise qualité, prix anormal, etc.)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
              >
                Rejeter
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModerationPage;
