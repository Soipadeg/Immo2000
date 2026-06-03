import '../styles/MesRendezVous.css';
/**
 * MesRendezVous.jsx - Gestion des rendez-vous de visite
 *
 * Affiche les demandes de RDV selon le rôle:
 * - Vendeur: Voir les demandes, accepter/refuser
 * - Acheteur: Voir ses demandes, historique
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert, Input, Modal } from '@/components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MesRendezVous = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('tous'); // tous, en_attente, accepte, refuse

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRDV, setSelectedRDV] = useState(null);
  const [reponseData, setReponseData] = useState({
    reponse: 'accepter',
    message: '',
    creneau_id: null
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    chargerRendezVous();
  }, [user, token]);

  const chargerRendezVous = async () => {
    try {
      setLoading(true);

      // Si vendeur: récupérer les demandes pour ses annonces
      // Si acheteur: récupérer ses demandes
      const endpoint = user.role === 'vendeur'
        ? '/api/rendez-vous/demandes-vendeur'
        : '/api/rendez-vous/demandes-acheteur';

      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = user.role === 'vendeur'
        ? response.data.demandes || []
        : response.data.rendez_vous || [];

      setRendezVous(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des rendez-vous');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut) => {
    const colors = {
      'en_attente': 'warning',
      'accepte': 'success',
      'refuse': 'error',
      'annule': 'default'
    };
    return colors[statut] || 'default';
  };

  const getStatutLabel = (statut) => {
    const labels = {
      'en_attente': 'En attente',
      'accepte': 'Accepté',
      'refuse': 'Refusé',
      'annule': 'Annulé'
    };
    return labels[statut] || statut;
  };

  const handleRepondreClick = (rdv) => {
    setSelectedRDV(rdv);
    setReponseData({
      reponse: 'accepter',
      message: '',
      creneau_id: null
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRDV(null);
  };

  const repondreRDV = async () => {
    if (!selectedRDV) return;

    try {
      const payload = {
        reponse: reponseData.reponse,
        message: reponseData.message
      };

      if (reponseData.reponse === 'refuser' && reponseData.creneau_id) {
        payload.creneau_id = reponseData.creneau_id;
      }

      const response = await api.post(
        `/api/rendez-vous/${selectedRDV.rdv_id}/repondre`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRendezVous(prev =>
        prev.map(r => r.rdv_id === selectedRDV.rdv_id ? response.data.rdv : r)
      );

      setSuccess(`RDV ${reponseData.reponse === 'accepter' ? 'accepté' : 'refusé'} avec succès`);
      handleCloseDialog();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réponse');
    }
  };

  const handleConversation = (rdv) => {
    if (rdv.conversation_id) {
      navigate(`/conversations/${rdv.conversation_id}`);
    }
  };

  const filteredRDV = filter === 'tous'
    ? rendezVous
    : rendezVous.filter(r => r.statut === filter);

  if (loading) {
    return (
      <div className="mes-rendez-vous-container">
        <div className="loading-spinner">⏳ Chargement...</div>
      </div>
    );
  }

  return (
    <div className="mes-rendez-vous-page">
      <div className="page-header">
        <div>Mes Rendez-vous</div>
        <div>Gérez vos demandes et confirmations de visite</div>
      </div>

      {error && (
        <Alert type="error" title="Erreur" message={error} />
      )}

      {success && (
        <Alert type="success" title="Succès" message={success} />
      )}

      {/* Filtres */}
      <div className="filters-bar">
        {['tous', 'en_attente', 'accepte', 'refuse'].map(stat => (
          <button
            key={stat}
            className={`filter-btn ${filter === stat ? 'active' : ''}`}
            onClick={() => setFilter(stat)}
          >
            {getStatutLabel(stat)}
          </button>
        ))}
      </div>

      {filteredRDV.length === 0 ? (
        <div className="empty-state">
          <div>Aucun rendez-vous trouvé</div>
        </div>
      ) : (
        <div className="rdv-grid">
          {filteredRDV.map(rdv => (
            <div key={rdv.rdv_id} className="rdv-card">
              <div className="rdv-header">
                <div>Visite #{rdv.rdv_id}</div>
                <div className={`rdv-status rdv-status-${rdv.statut}`}>
                  {getStatutLabel(rdv.statut)}
                </div>
              </div>

              <div className="rdv-divider"></div>

              <div className="rdv-content">
                <div className="rdv-info">
                  <strong>Annonce:</strong> #{rdv.annonce_id}
                </div>

                {rdv.date_proposée && (
                  <div className="rdv-info">
                    <strong>Date proposée:</strong>{' '}
                    {format(new Date(rdv.date_proposée), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </div>
                )}

                {rdv.date_confirmée && (
                  <div className="rdv-info rdv-info-confirmed">
                    <strong>Date confirmée:</strong>{' '}
                    {format(new Date(rdv.date_confirmée), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </div>
                )}

                {rdv.message && (
                  <div className="rdv-message">
                    <strong>Message:</strong> {rdv.message}
                  </div>
                )}
              </div>

              <div className="rdv-actions">
                {user.role === 'vendeur' && rdv.statut === 'en_attente' && (
                  <>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        setSelectedRDV(rdv);
                        setReponseData({ reponse: 'accepter', message: '', creneau_id: null });
                        setOpenDialog(true);
                      }}
                    >
                      ✓ Accepter
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleRepondreClick(rdv)}
                    >
                      ✗ Refuser
                    </Button>
                  </>
                )}

                {rdv.statut === 'accepte' && (
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => handleConversation(rdv)}
                  >
                    💬 Message
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Répondre RDV */}
      {openDialog && (
        <Modal
          isOpen={openDialog}
          title="Répondre à la demande de RDV"
          onClose={handleCloseDialog}
        >
          <div className="modal-form">
            <div className="form-group">
              <label className="form-label">Réponse</label>
              <select
                value={reponseData.reponse}
                onChange={(e) => setReponseData(prev => ({ ...prev, reponse: e.target.value }))}
                className="form-select"
              >
                <option value="accepter">Accepter</option>
                <option value="refuser">Refuser</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Message (optionnel)</label>
              <textarea
                value={reponseData.message}
                onChange={(e) => setReponseData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Laissez un message à l'acheteur..."
                className="form-textarea"
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button variant="primary" onClick={repondreRDV}>
                Envoyer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MesRendezVous;
