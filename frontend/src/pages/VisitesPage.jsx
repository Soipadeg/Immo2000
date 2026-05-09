/**
 * Page de gestion des visites
 * Permettre de planifier une visite et voir l'historique
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { visitesApi } from '../services/api';
import {
  FeedbackSubmitForm,
  FeedbacksList,
} from '../components/FeedbackComponent';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const VisitesPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [visites, setVisites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const userRole = localStorage.getItem('user_role');

  // État pour la planification
  const [annonceId, setAnnonceId] = useState('');
  const [dateHeure, setDateHeure] = useState('');
  const [notes, setNotes] = useState('');
  const [planning, setPlanning] = useState(false);

  // État pour l'édition
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVisite, setSelectedVisite] = useState(null);
  const [editDateHeure, setEditDateHeure] = useState('');

  // Charger les visites
  useEffect(() => {
    loadVisites();
  }, []);

  const loadVisites = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await visitesApi.listAll(0, 100);
      setVisites(response.data.visites || response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des visites');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleVisite = async (e) => {
    e.preventDefault();
    if (!annonceId || !dateHeure) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    setPlanning(true);
    try {
      const response = await visitesApi.create({
        annonce_id: parseInt(annonceId),
        date_heure: dateHeure,
        notes: notes || null,
      });

      setSuccess('Visite planifiée avec succès !');
      setAnnonceId('');
      setDateHeure('');
      setNotes('');
      loadVisites();

      // Enlever le message après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la planification');
    } finally {
      setPlanning(false);
    }
  };

  const handleDeleteVisite = async (visiteId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette visite ?')) {
      return;
    }

    try {
      await visitesApi.delete(visiteId);
      setSuccess('Visite annulée avec succès');
      loadVisites();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'annulation');
    }
  };

  const handleUpdateVisite = async () => {
    if (!selectedVisite || !editDateHeure) {
      setError('Veuillez sélectionner une date');
      return;
    }

    try {
      await visitesApi.update(selectedVisite.visite_id, {
        date_heure: editDateHeure,
      });

      setSuccess('Visite modifiée avec succès');
      setEditDialogOpen(false);
      loadVisites();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la modification');
    }
  };

  const handleDownloadICS = (visiteId) => {
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}/visites/${visiteId}/download.ics`;
    link.download = `visite-${visiteId}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatutColor = (statut) => {
    const colors = {
      'planifiée': 'info',
      'complétée': 'success',
      'annulée': 'error',
    };
    return colors[statut] || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        📅 Gestion des Visites
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Planifier une visite" />
        <Tab label="Mes visites" />
        <Tab label="Feedbacks" />
      </Tabs>

      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Planifier une nouvelle visite
          </Typography>

          <Box component="form" onSubmit={handleScheduleVisite} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID de l'annonce"
                  type="number"
                  value={annonceId}
                  onChange={(e) => setAnnonceId(e.target.value)}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date et heure"
                  type="datetime-local"
                  value={dateHeure}
                  onChange={(e) => setDateHeure(e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes (optionnel)"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des notes sur la visite..."
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={planning}
                  sx={{ mt: 1 }}
                >
                  {planning ? <CircularProgress size={24} /> : 'Planifier la visite'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {tabValue === 1 && (
        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : visites.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Aucune visite planifiée pour le moment
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {visites.map((visite) => (
                <Grid item xs={12} sm={6} md={4} key={visite.visite_id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Annonce #{visite.annonce_id}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        📅 {new Date(visite.date_heure).toLocaleString('fr-FR')}
                      </Typography>
                      <Chip
                        label={visite.statut}
                        color={getStatutColor(visite.statut)}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                      {visite.notes && (
                        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                          <strong>Notes:</strong> {visite.notes}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadICS(visite.visite_id)}
                      >
                        ICS
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setSelectedVisite(visite);
                          setEditDateHeure(visite.date_heure);
                          setEditDialogOpen(true);
                        }}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteVisite(visite.visite_id)}
                      >
                        Annuler
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Onglet 3: Feedbacks */}
      {tabValue === 2 && (
        <Box>
          {userRole === 'vendeur' ? (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                ⭐ Feedbacks reçus des acheteurs
              </Typography>
              <FeedbacksList />
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Vos feedbacks
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : visites.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Aucune visite complétée pour le moment
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {visites
                    .filter((v) => v.statut === 'complétée')
                    .map((visite) => (
                      <Grid item xs={12} key={visite.visite_id}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Visite - Annonce #{visite.annonce_id}
                            </Typography>
                            <Typography color="text.secondary" gutterBottom>
                              📅 {new Date(visite.date_heure).toLocaleString('fr-FR')}
                            </Typography>

                            {/* Formulaire de feedback */}
                            <Box sx={{ mt: 2 }}>
                              <FeedbackSubmitForm
                                visiteId={visite.visite_id}
                                onSuccess={() => {
                                  setSuccess('Feedback soumis avec succès !');
                                  setTimeout(() => setSuccess(''), 3000);
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Dialog d'édition */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Modifier la date et heure</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Date et heure"
            type="datetime-local"
            value={editDateHeure}
            onChange={(e) => setEditDateHeure(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleUpdateVisite} color="primary" variant="contained">
            Modifier
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VisitesPage;
