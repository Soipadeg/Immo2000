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
import { Box, Container, Paper, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Alert, CircularProgress, Chip } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
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
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <h1>Mon Calendrier de Disponibilité</h1>
        <p>Gérez vos créneaux de visite disponibles</p>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Ajouter un créneau
        </Button>
      </Box>

      {creneaux.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <p>Vous n'avez pas encore créé de créneaux. Ajoutez votre premier créneau pour commencer!</p>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Heure début</TableCell>
                <TableCell>Heure fin</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {creneaux.map(creneau => (
                <TableRow key={creneau.id}>
                  <TableCell>
                    {format(new Date(creneau.jour), 'dd MMMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>{creneau.heure_debut}</TableCell>
                  <TableCell>{creneau.heure_fin}</TableCell>
                  <TableCell>
                    <Chip
                      label={creneau.est_disponible ? 'Disponible' : 'Réservé'}
                      color={creneau.est_disponible ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => supprimerCreneau(creneau.id)}
                      title="Supprimer"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Ajouter Créneau */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Ajouter un nouveau créneau</span>
            <IconButton size="small" onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Date"
              type="date"
              name="jour"
              value={formData.jour}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <TextField
              label="Heure de début"
              type="time"
              name="heure_debut"
              value={formData.heure_debut}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <TextField
              label="Heure de fin"
              type="time"
              name="heure_fin"
              value={formData.heure_fin}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={ajouterCreneau} variant="contained" color="primary">
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MonCalendrier;
