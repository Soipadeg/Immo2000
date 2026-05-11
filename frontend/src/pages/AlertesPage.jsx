/**
 * Composant de gestion des alertes d'annonces
 * Permet aux utilisateurs de créer et gérer des alertes pour recevoir des notifications
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  FormControlLabel,
  Checkbox,
  Switch,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CloseIcon,
  Check as CheckIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const AlertesAnnonces = () => {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal de création/édition
  const [openModal, setOpenModal] = useState(false);
  const [editingAlerte, setEditingAlerte] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    ville: '',
    code_postal: '',
    type_bien: '',
    prix_min: '',
    prix_max: '',
    surface_min: '',
    surface_max: '',
    nombre_pieces_min: '',
    nombre_pieces_max: '',
    dpe: '',
    ascenseur: false,
    balcon: false,
    terrasse: false,
    jardin: false,
    piscine: false,
    parking: false,
    frequence: 'quotidienne',
    email_notification: true,
  });

  // Charger les alertes
  const loadAlertes = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/alertes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlertes(response.data.items);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  // Charger les alertes au montage
  useEffect(() => {
    loadAlertes();
  }, []);

  // Ouvrir modal de création
  const handleOpenModalCreate = () => {
    setEditingAlerte(null);
    setFormData({
      nom: '',
      ville: '',
      code_postal: '',
      type_bien: '',
      prix_min: '',
      prix_max: '',
      surface_min: '',
      surface_max: '',
      nombre_pieces_min: '',
      nombre_pieces_max: '',
      dpe: '',
      ascenseur: false,
      balcon: false,
      terrasse: false,
      jardin: false,
      piscine: false,
      parking: false,
      frequence: 'quotidienne',
      email_notification: true,
    });
    setOpenModal(true);
  };

  // Ouvrir modal d'édition
  const handleOpenModalEdit = (alerte) => {
    setEditingAlerte(alerte);
    setFormData({
      nom: alerte.nom,
      ville: alerte.ville || '',
      code_postal: alerte.code_postal || '',
      type_bien: alerte.type_bien || '',
      prix_min: alerte.prix_min || '',
      prix_max: alerte.prix_max || '',
      surface_min: alerte.surface_min || '',
      surface_max: alerte.surface_max || '',
      nombre_pieces_min: alerte.nombre_pieces_min || '',
      nombre_pieces_max: alerte.nombre_pieces_max || '',
      dpe: alerte.dpe || '',
      ascenseur: alerte.ascenseur,
      balcon: alerte.balcon,
      terrasse: alerte.terrasse,
      jardin: alerte.jardin,
      piscine: alerte.piscine,
      parking: alerte.parking,
      frequence: alerte.frequence,
      email_notification: alerte.email_notification,
    });
    setOpenModal(true);
  };

  // Fermer modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingAlerte(null);
  };

  // Gérer les changements de formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Sauvegarder l'alerte
  const handleSaveAlerte = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      if (editingAlerte) {
        // Mise à jour
        await axios.put(`${API_BASE_URL}/alertes/${editingAlerte.alerte_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessMessage('Alerte mise à jour avec succès!');
      } else {
        // Création
        await axios.post(`${API_BASE_URL}/alertes`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessMessage('Alerte créée avec succès!');
      }

      handleCloseModal();
      loadAlertes();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une alerte
  const handleDeleteAlerte = async (alerteId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette alerte?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_BASE_URL}/alertes/${alerteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage('Alerte supprimée avec succès!');
      loadAlertes();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Basculer actif/inactif
  const handleToggleAlerte = async (alerteId) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${API_BASE_URL}/alertes/${alerteId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadAlertes();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du basculement');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            🔔 Mes Alertes d'Annonces
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Recevez des notifications quand de nouvelles annonces correspondent à vos critères
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={handleOpenModalCreate}
          size="large"
        >
          Créer une alerte
        </Button>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Chargement */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Aucune alerte */}
      {!loading && alertes.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune alerte créée
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Créez une alerte pour être notifié quand de nouvelles annonces correspondent à vos critères
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenModalCreate}
          >
            Créer votre première alerte
          </Button>
        </Paper>
      )}

      {/* Liste des alertes */}
      {!loading && alertes.length > 0 && (
        <Grid container spacing={3}>
          {alertes.map((alerte) => (
            <Grid item xs={12} md={6} key={alerte.alerte_id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Titre et statut */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {alerte.nom}
                    </Typography>
                    <Chip
                      label={alerte.actif ? 'Actif' : 'Inactif'}
                      color={alerte.actif ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  {/* Critères principaux */}
                  <Box sx={{ mb: 2 }}>
                    {alerte.type_bien && (
                      <Chip label={alerte.type_bien} size="small" sx={{ mr: 1, mb: 1 }} />
                    )}
                    {alerte.ville && (
                      <Chip label={`📍 ${alerte.ville}`} size="small" sx={{ mr: 1, mb: 1 }} />
                    )}
                    {alerte.prix_min || alerte.prix_max ? (
                      <Chip
                        label={`💰 ${alerte.prix_min || '0'} - ${alerte.prix_max || '∞'} €`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ) : null}
                    {alerte.surface_min || alerte.surface_max ? (
                      <Chip
                        label={`📐 ${alerte.surface_min || '0'} - ${alerte.surface_max || '∞'} m²`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ) : null}
                  </Box>

                  {/* Équipements */}
                  {(alerte.ascenseur || alerte.balcon || alerte.terrasse || alerte.jardin || alerte.piscine || alerte.parking) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" display="block" gutterBottom>
                        Équipements:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {alerte.ascenseur && <Chip label="🛗 Ascenseur" size="small" />}
                        {alerte.balcon && <Chip label="🏠 Balcon" size="small" />}
                        {alerte.terrasse && <Chip label="🪴 Terrasse" size="small" />}
                        {alerte.jardin && <Chip label="🌳 Jardin" size="small" />}
                        {alerte.piscine && <Chip label="🏊 Piscine" size="small" />}
                        {alerte.parking && <Chip label="🚗 Parking" size="small" />}
                      </Box>
                    </Box>
                  )}

                  {/* Configuration */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Fréquence: <strong>{alerte.frequence}</strong>
                      </Typography>
                      {alerte.email_notification ? (
                        <Typography variant="caption" display="block" color="success.main">
                          ✅ Notifications email activées
                        </Typography>
                      ) : (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Notifications email désactivées
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      onClick={() => handleToggleAlerte(alerte.alerte_id)}
                      color={alerte.actif ? 'primary' : 'default'}
                      size="small"
                    >
                      {alerte.actif ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
                    </IconButton>
                  </Box>
                </CardContent>

                {/* Actions */}
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenModalEdit(alerte)}
                  >
                    Éditer
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteAlerte(alerte.alerte_id)}
                  >
                    Supprimer
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal de création/édition */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAlerte ? '✏️ Modifier l\'alerte' : '🔔 Créer une alerte'}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {/* Nom */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom de l'alerte"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                placeholder="Ex: Appartement Paris 3p"
              />
            </Grid>

            {/* Localisation */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ville (optionnel)"
                name="ville"
                value={formData.ville}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code postal (optionnel)"
                name="code_postal"
                value={formData.code_postal}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>

            {/* Type */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Type de bien (optionnel)"
                name="type_bien"
                value={formData.type_bien}
                onChange={handleInputChange}
                size="small"
              >
                <MenuItem value="">Tous types</MenuItem>
                <MenuItem value="maison">Maison</MenuItem>
                <MenuItem value="appartement">Appartement</MenuItem>
                <MenuItem value="terrain">Terrain</MenuItem>
                <MenuItem value="local commercial">Local commercial</MenuItem>
              </TextField>
            </Grid>

            {/* Prix */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Prix min (€)"
                name="prix_min"
                value={formData.prix_min}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Prix max (€)"
                name="prix_max"
                value={formData.prix_max}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>

            {/* Surface */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Surface min (m²)"
                name="surface_min"
                value={formData.surface_min}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Surface max (m²)"
                name="surface_max"
                value={formData.surface_max}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>

            {/* Pièces */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Pièces min"
                name="nombre_pieces_min"
                value={formData.nombre_pieces_min}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Pièces max"
                name="nombre_pieces_max"
                value={formData.nombre_pieces_max}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>

            {/* DPE */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="DPE (optionnel)"
                name="dpe"
                value={formData.dpe}
                onChange={handleInputChange}
                size="small"
              >
                <MenuItem value="">Tous les DPE</MenuItem>
                <MenuItem value="A">A (Excellent)</MenuItem>
                <MenuItem value="B">B (Très bon)</MenuItem>
                <MenuItem value="C">C (Bon)</MenuItem>
                <MenuItem value="D">D (Moyen)</MenuItem>
                <MenuItem value="E">E (Médiocre)</MenuItem>
                <MenuItem value="F">F (Très médiocre)</MenuItem>
                <MenuItem value="G">G (Très mauvais)</MenuItem>
              </TextField>
            </Grid>

            {/* Équipements */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Équipements
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="ascenseur"
                      checked={formData.ascenseur}
                      onChange={handleInputChange}
                    />
                  }
                  label="Ascenseur"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="balcon"
                      checked={formData.balcon}
                      onChange={handleInputChange}
                    />
                  }
                  label="Balcon"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="terrasse"
                      checked={formData.terrasse}
                      onChange={handleInputChange}
                    />
                  }
                  label="Terrasse"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="jardin"
                      checked={formData.jardin}
                      onChange={handleInputChange}
                    />
                  }
                  label="Jardin"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="piscine"
                      checked={formData.piscine}
                      onChange={handleInputChange}
                    />
                  }
                  label="Piscine"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="parking"
                      checked={formData.parking}
                      onChange={handleInputChange}
                    />
                  }
                  label="Parking"
                />
              </Box>
            </Grid>

            {/* Configuration */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Fréquence"
                name="frequence"
                value={formData.frequence}
                onChange={handleInputChange}
                size="small"
              >
                <MenuItem value="immediatement">Immédiatement</MenuItem>
                <MenuItem value="quotidienne">Quotidienne</MenuItem>
                <MenuItem value="hebdomadaire">Hebdomadaire</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="email_notification"
                    checked={formData.email_notification}
                    onChange={handleInputChange}
                  />
                }
                label="Notifications email"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal}>Annuler</Button>
          <Button
            onClick={handleSaveAlerte}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={<CheckIcon />}
          >
            {editingAlerte ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AlertesAnnonces;
