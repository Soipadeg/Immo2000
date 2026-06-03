import '../styles/MonCalendrier.css';
/**
 * MonCalendrier.jsx - Calendrier de disponibilité pour les vendeurs
 *
 * Permet aux vendeurs de:
 * - Voir leurs créneaux existants
 * - Ajouter de nouveaux créneaux
 * - Supprimer des créneaux
 * - Marquer les créneaux comme disponibles/réservés
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert, Input, Modal } from '@/components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MonCalendrier = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [creneaux, setCreneaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [formData, setFormData] = useState({
    jour: '',
    heure_debut: '',
    heure_fin: ''
  });

  // Charger les créneaux au montage
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    chargerCreneaux();
  }, [user, token]);

  const chargerCreneaux = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/creneaux', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCreneaux(response.data.creneaux || []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des créneaux');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({ jour: '', heure_debut: '', heure_fin: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ jour: '', heure_debut: '', heure_fin: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const ajouterCreneau = async () => {
    try {
      // Validation
      if (!formData.jour || !formData.heure_debut || !formData.heure_fin) {
        setError('Tous les champs sont obligatoires');
        return;
      }

      if (formData.heure_debut >= formData.heure_fin) {
        setError('L\'heure de début doit être inférieure à l\'heure de fin');
        return;
      }

      const response = await api.post('/api/creneaux', {
        jour: new Date(formData.jour).toISOString(),
        heure_debut: formData.heure_debut,
        heure_fin: formData.heure_fin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCreneaux(prev => [...prev, response.data.creneau]);
      setSuccess('Créneau ajouté avec succès');
      handleCloseDialog();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout du créneau');
    }
  };

  const supprimerCreneau = async (creneauId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau?')) {
      return;
    }

    try {
      await api.delete(`/api/creneaux/${creneauId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCreneaux(prev => prev.filter(c => c.id !== creneauId));
      setSuccess('Créneau supprimé avec succès');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erreur lors de la suppression du créneau');
    }
  };

  if (loading) {
    return (
      <div className="mon-calendrier-container">
        <div className="loading-spinner">⏳ Chargement...</div>
      </div>
    );
  }

  return (
    <div className="mon-calendrier-page">
      <div className="page-header">
        <div>Mon Calendrier de Disponibilité</div>
        <div>Gérez vos créneaux de visite disponibles</div>
      </div>

      {error && <Alert type="error" title="Erreur" message={error} />}
      {success && <Alert type="success" title="Succès" message={success} />}

      <div className="actions-bar">
        <Button
          variant="primary"
          size="medium"
          onClick={handleOpenDialog}
        >
          + Ajouter un créneau
        </Button>
      </div>

      {creneaux.length === 0 ? (
        <div className="empty-state">
          <div>Vous n'avez pas encore créé de créneaux. Ajoutez votre premier créneau pour commencer!</div>
        </div>
      ) : (
        <div className="creneaux-table">
          <div className="table-header">
            <div className="table-cell">Date</div>
            <div className="table-cell">Heure début</div>
            <div className="table-cell">Heure fin</div>
            <div className="table-cell">Statut</div>
            <div className="table-cell actions">Actions</div>
          </div>

          {creneaux.map(creneau => (
            <div key={creneau.id} className="table-row">
              <div className="table-cell">
                {format(new Date(creneau.jour), 'dd MMMM yyyy', { locale: fr })}
              </div>
              <div className="table-cell">{creneau.heure_debut}</div>
              <div className="table-cell">{creneau.heure_fin}</div>
              <div className="table-cell">
                <div className={`status-badge status-${creneau.est_disponible ? 'disponible' : 'reserve'}`}>
                  {creneau.est_disponible ? '✓ Disponible' : '⊗ Réservé'}
                </div>
              </div>
              <div className="table-cell actions">
                <button
                  className="delete-btn"
                  onClick={() => supprimerCreneau(creneau.id)}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajouter Créneau */}
      {openDialog && (
        <Modal
          isOpen={openDialog}
          title="Ajouter un nouveau créneau"
          onClose={handleCloseDialog}
        >
          <div className="modal-form">
            <div className="form-group">
              <Input
                type="date"
                label="Date"
                name="jour"
                value={formData.jour}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <Input
                type="time"
                label="Heure de début"
                name="heure_debut"
                value={formData.heure_debut}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <Input
                type="time"
                label="Heure de fin"
                name="heure_fin"
                value={formData.heure_fin}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button variant="primary" onClick={ajouterCreneau}>
                Ajouter
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MonCalendrier;
