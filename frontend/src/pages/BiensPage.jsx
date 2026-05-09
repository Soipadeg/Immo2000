/**
 * Page de gestion des biens immobiliers
 * Créer et lister les propriétés
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BarChart as BarChartIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { biensApi } from '../services/api';
import ImageUploadComponent from '../components/ImageUpload';
import ImageGalleryComponent from '../components/ImageGallery';

const LIMIT = 10;

const BiensPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);

  // État pour la création
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // État pour l'édition
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBien, setSelectedBien] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    adresse: '',
    ville: '',
    code_postal: '',
    type_bien: 'appartement',
    surface: '',
    nombre_pieces: '',
    prix: '',
    description: '',
    latitude: '',
    longitude: '',
  });

  // État pour l'upload d'images
  const [imageUploadDialogOpen, setImageUploadDialogOpen] = useState(false);
  const [selectedBienId, setSelectedBienId] = useState(null);

  const [formData, setFormData] = useState({
    adresse: '',
    ville: '',
    code_postal: '',
    type_bien: 'appartement',
    surface: '',
    nombre_pieces: '',
    prix: '',
    description: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    if (tabValue === 0) {
      loadMyBiens();
    } else if (tabValue === 1) {
      loadStats();
    }
  }, [tabValue, page]);

  const loadMyBiens = async () => {
    setLoading(true);
    setError('');
    try {
      const skip = (page - 1) * LIMIT;
      const response = await biensApi.listMyBiens(skip, LIMIT);
      setBiens(response.data.biens || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await biensApi.getStats();
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des stats');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateBien = async () => {
    setCreateLoading(true);
    setError('');

    try {
      if (
        !formData.adresse ||
        !formData.ville ||
        !formData.surface ||
        !formData.type_bien
      ) {
        setError('Veuillez remplir tous les champs requis');
        setCreateLoading(false);
        return;
      }

      const payload = {
        ...formData,
        surface: parseFloat(formData.surface),
        nombre_pieces: formData.nombre_pieces
          ? parseInt(formData.nombre_pieces)
          : null,
        prix: formData.prix ? parseFloat(formData.prix) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude
          ? parseFloat(formData.longitude)
          : null,
      };

      await biensApi.create(payload);

      setSuccess('Bien créé avec succès !');
      setCreateDialogOpen(false);
      setFormData({
        adresse: '',
        ville: '',
        code_postal: '',
        type_bien: 'appartement',
        surface: '',
        nombre_pieces: '',
        prix: '',
        description: '',
        latitude: '',
        longitude: '',
      });

      loadMyBiens();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditBien = (bien) => {
    setSelectedBien(bien);
    setEditFormData({
      adresse: bien.adresse || '',
      ville: bien.ville || '',
      code_postal: bien.code_postal || '',
      type_bien: bien.type_bien || 'appartement',
      surface: bien.surface?.toString() || '',
      nombre_pieces: bien.nombre_pieces?.toString() || '',
      prix: bien.prix?.toString() || '',
      description: bien.description || '',
      latitude: bien.latitude?.toString() || '',
      longitude: bien.longitude?.toString() || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveBien = async () => {
    setEditLoading(true);
    setError('');

    try {
      if (!editFormData.adresse || !editFormData.ville || !editFormData.surface) {
        setError('Veuillez remplir tous les champs requis');
        setEditLoading(false);
        return;
      }

      const payload = {
        ...editFormData,
        surface: parseFloat(editFormData.surface),
        nombre_pieces: editFormData.nombre_pieces
          ? parseInt(editFormData.nombre_pieces)
          : null,
        prix: editFormData.prix ? parseFloat(editFormData.prix) : null,
        latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : null,
        longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : null,
      };

      await biensApi.update(selectedBien.bien_id, payload);

      setSuccess('Bien modifié avec succès !');
      setEditDialogOpen(false);
      loadMyBiens();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la modification');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteBien = async (bienId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) {
      return;
    }

    setError('');
    try {
      await biensApi.delete(bienId);
      setSuccess('Bien supprimé avec succès !');
      loadMyBiens();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
        🏠 Gestion de mes Biens
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Mes propriétés" />
        <Tab label="Statistiques" />
      </Tabs>

      {/* Onglet 1: Mes propriétés */}
      {tabValue === 0 && (
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mb: 2 }}
          >
            Ajouter une propriété
          </Button>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : biens.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Aucune propriété pour le moment
              </Typography>
            </Paper>
          ) : (
            <>
              <Grid container spacing={2}>
                {biens.map((bien) => (
                  <Grid item xs={12} sm={6} md={4} key={bien.bien_id}>
                    <Card>
                      {/* Galerie d'images */}
                      <Box sx={{ maxHeight: 200, overflowY: 'auto', backgroundColor: '#f5f5f5' }}>
                        <ImageGalleryComponent
                          annonceId={bien.bien_id}
                          onDelete={() => loadMyBiens()}
                        />
                      </Box>

                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {bien.adresse}
                        </Typography>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                          {bien.code_postal} {bien.ville}
                        </Typography>

                        <Chip
                          label={bien.type_bien}
                          size="small"
                          sx={{ mt: 1, mb: 1 }}
                        />

                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>{bien.surface}m²</strong>
                          {bien.nombre_pieces && ` • ${bien.nombre_pieces} pièces`}
                        </Typography>

                        {bien.prix && (
                          <Typography
                            variant="h6"
                            sx={{
                              mt: 1,
                              color: '#1976d2',
                              fontWeight: 700,
                            }}
                          >
                            {formatPrice(bien.prix)}
                          </Typography>
                        )}

                        {bien.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            {bien.description.substring(0, 100)}...
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<ImageIcon />}
                          onClick={() => {
                            setSelectedBienId(bien.bien_id);
                            setImageUploadDialogOpen(true);
                          }}
                        >
                          Ajouter photos
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditBien(bien)}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteBien(bien.bien_id)}
                        >
                          Supprimer
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={Math.ceil((biens.length || 0) / LIMIT)}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                />
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Onglet 2: Statistiques */}
      {tabValue === 1 && (
        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : stats ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Biens
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.total_biens || 0}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Surface Totale
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.surface_totale || 0}m²
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Valeur Totale
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatPrice(stats.valeur_totale || 0)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Prix Moyen/m²
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatPrice(stats.prix_moyen_m2 || 0)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Aucune données statistiques disponibles
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Dialog de création */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Créer une nouvelle propriété</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Adresse *"
              name="adresse"
              value={formData.adresse}
              onChange={handleInputChange}
              required
            />
            <TextField
              fullWidth
              label="Ville *"
              name="ville"
              value={formData.ville}
              onChange={handleInputChange}
              required
            />
            <TextField
              fullWidth
              label="Code postal"
              name="code_postal"
              value={formData.code_postal}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              label="Type de bien *"
              name="type_bien"
              select
              SelectProps={{ native: true }}
              value={formData.type_bien}
              onChange={handleInputChange}
            >
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="terrain">Terrain</option>
              <option value="commerce">Commerce</option>
              <option value="bureau">Bureau</option>
            </TextField>
            <TextField
              fullWidth
              label="Surface (m²) *"
              name="surface"
              type="number"
              value={formData.surface}
              onChange={handleInputChange}
              required
              inputProps={{ step: '0.1', min: '0' }}
            />
            <TextField
              fullWidth
              label="Nombre de pièces"
              name="nombre_pieces"
              type="number"
              value={formData.nombre_pieces}
              onChange={handleInputChange}
              inputProps={{ min: '0' }}
            />
            <TextField
              fullWidth
              label="Prix"
              name="prix"
              type="number"
              value={formData.prix}
              onChange={handleInputChange}
              inputProps={{ step: '1000', min: '0' }}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleCreateBien}
            variant="contained"
            color="primary"
            disabled={createLoading}
          >
            {createLoading ? <CircularProgress size={24} /> : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Modifier la propriété</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Adresse *"
              name="adresse"
              value={editFormData.adresse}
              onChange={handleEditInputChange}
              required
            />
            <TextField
              fullWidth
              label="Ville *"
              name="ville"
              value={editFormData.ville}
              onChange={handleEditInputChange}
              required
            />
            <TextField
              fullWidth
              label="Code postal"
              name="code_postal"
              value={editFormData.code_postal}
              onChange={handleEditInputChange}
            />
            <TextField
              fullWidth
              label="Type de bien *"
              name="type_bien"
              select
              SelectProps={{ native: true }}
              value={editFormData.type_bien}
              onChange={handleEditInputChange}
            >
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="terrain">Terrain</option>
              <option value="local_commercial">Local commercial</option>
            </TextField>
            <TextField
              fullWidth
              label="Surface (m²) *"
              name="surface"
              type="number"
              value={editFormData.surface}
              onChange={handleEditInputChange}
              inputProps={{ step: '0.01', min: '0' }}
              required
            />
            <TextField
              fullWidth
              label="Nombre de pièces"
              name="nombre_pieces"
              type="number"
              value={editFormData.nombre_pieces}
              onChange={handleEditInputChange}
              inputProps={{ step: '1', min: '0' }}
            />
            <TextField
              fullWidth
              label="Prix (€)"
              name="prix"
              type="number"
              value={editFormData.prix}
              onChange={handleEditInputChange}
              inputProps={{ step: '1000', min: '0' }}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={3}
              value={editFormData.description}
              onChange={handleEditInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleSaveBien}
            variant="contained"
            color="primary"
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={24} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour uploader les images */}
      <Dialog
        open={imageUploadDialogOpen}
        onClose={() => setImageUploadDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>📸 Ajouter des photos à la propriété</DialogTitle>
        <DialogContent>
          {selectedBienId && (
            <ImageUploadComponent
              annonceId={selectedBienId}
              onUploadSuccess={() => {
                setSuccess('Images uploadées avec succès !');
                setImageUploadDialogOpen(false);
                loadMyBiens();
                setTimeout(() => setSuccess(''), 3000);
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageUploadDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BiensPage;
