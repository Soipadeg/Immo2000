/**
 * Modal de création rapide d'alerte depuis la recherche
 */

import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const CreateAlerteQuickModal = ({ open, onClose, initialFilters = {} }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    ville: initialFilters.ville || '',
    code_postal: initialFilters.code_postal || '',
    type_bien: initialFilters.type_bien || '',
    prix_min: initialFilters.prix_min || '',
    prix_max: initialFilters.prix_max || '',
    surface_min: initialFilters.surface_min || '',
    surface_max: initialFilters.surface_max || '',
    ascenseur: false,
    balcon: false,
    terrasse: false,
    jardin: false,
    piscine: false,
    parking: false,
    frequence: 'quotidienne',
    email_notification: true,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateAlerte = async () => {
    if (!formData.nom.trim()) {
      setError('Veuillez donner un nom à votre alerte');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setError('Vous devez être connecté pour créer une alerte');
        return;
      }

      await axios.post(`${API_BASE_URL}/alertes`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nom: '',
      ville: '',
      code_postal: '',
      type_bien: '',
      prix_min: '',
      prix_max: '',
      surface_min: '',
      surface_max: '',
      ascenseur: false,
      balcon: false,
      terrasse: false,
      jardin: false,
      piscine: false,
      parking: false,
      frequence: 'quotidienne',
      email_notification: true,
    });
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <div>🔔 Créer une alerte d'annonce</div>

      <div>
        {success && (
          <Alert severity="success">
            ✅ Alerte créée avec succès! Vous recevrez les notifications par email.
          </Alert>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {!success && (
          <div>
            {/* Nom obligatoire */}
            <TextField
              fullWidth
              label="Nom de l'alerte *"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              placeholder="Ex: Appartement Paris 3 pièces"
              error={!formData.nom.trim() && formData.nom !== ''}
              helperText={!formData.nom.trim() && formData.nom !== '' ? 'Champ obligatoire' : ''}
            />

            {/* Rappel des critères actuels */}
            {(formData.ville || formData.type_bien || formData.prix_min || formData.surface_min) && (
              <div>
                Les critères de votre recherche actuelle seront utilisés pour cette alerte.
              </div>
            )}

            {/* Configuration */}
            <TextField
              fullWidth
              select
              label="Fréquence de notification"
              name="frequence"
              value={formData.frequence}
              onChange={handleInputChange}
              size="small"
            >
              <MenuItem value="immediatement">Immédiatement</MenuItem>
              <MenuItem value="quotidienne">Quotidienne</MenuItem>
              <MenuItem value="hebdomadaire">Hebdomadaire</MenuItem>
            </TextField>

            <FormControlLabel
              control={
                <Checkbox
                  name="email_notification"
                  checked={formData.email_notification}
                  onChange={handleInputChange}
                />
              }
              label="Me notifier par email"
            />

            <div>
              💡 Conseil: Donnez un nom explicite à votre alerte pour la retrouver facilement
            </div>
          </div>
        )}
      </div>

      <div>
        <button onClick={handleClose} disabled={loading}>
          {success ? 'Fermer' : 'Annuler'}
        </button>
        {!success && (
          <button onClick={handleCreateAlerte}
            variant="contained"
            color="primary"
            disabled={loading || !formData.nom.trim()}
            startIcon={loading ? <div class="spinner"></div> : <CheckIcon />}
          >
            Créer l'alerte
          </button>
        )}
      </div>
    </Dialog>
  );
};

export default CreateAlerteQuickModal;
