/**
 * Page des Estimations - Melo API
 * Estimer la valeur d'une propriété via l'API Melo
 */

import React, { useState } from 'react';
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
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { TrendingUp as TrendingUpIcon, CompareArrows as CompareArrowsIcon } from '@mui/icons-material';
import { estimationsApi } from '../services/api';

const EstimationsPage = () => {
  const [formData, setFormData] = useState({
    adresse: '',
    surface: '',
    type_bien: 'appartement',
    nombre_pieces: '',
    annee_construction: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estimation, setEstimation] = useState(null);
  const [comparisons, setComparisons] = useState([]);

  // États pour la comparaison
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResults, setCompareResults] = useState(null);
  const [compareFormData, setCompareFormData] = useState({
    adresse1: '',
    surface1: '',
    type_bien1: 'appartement',
    adresse2: '',
    surface2: '',
    type_bien2: 'appartement',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : (isNaN(value) ? value : Number(value)),
    }));
  };

  const handleEstimate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setEstimation(null);

    try {
      // Valider les champs requis
      if (!formData.adresse || !formData.surface || !formData.type_bien) {
        setError('Veuillez remplir tous les champs requis');
        setLoading(false);
        return;
      }

      const response = await estimationsApi.create(formData);
      setEstimation(response.data.estimation || response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'estimation');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareInputChange = (e) => {
    const { name, value } = e.target;
    setCompareFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : (isNaN(value) ? value : Number(value)),
    }));
  };

  const handleCompare = async () => {
    setCompareLoading(true);
    setError('');

    try {
      if (
        !compareFormData.adresse1 ||
        !compareFormData.surface1 ||
        !compareFormData.adresse2 ||
        !compareFormData.surface2
      ) {
        setError('Veuillez remplir tous les champs requis pour la comparaison');
        setCompareLoading(false);
        return;
      }

      const response = await estimationsApi.compare({
        adresse1: compareFormData.adresse1,
        surface1: parseFloat(compareFormData.surface1),
        type_bien1: compareFormData.type_bien1,
        adresse2: compareFormData.adresse2,
        surface2: parseFloat(compareFormData.surface2),
        type_bien2: compareFormData.type_bien2,
      });

      setCompareResults(response.data.comparison || response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la comparaison');
    } finally {
      setCompareLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          💎 Estimation de Propriété - Melo API
        </Typography>
        <Typography color="text.secondary">
          Estimez la valeur de votre bien immobilier basée sur les données du marché
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Formulaire d'estimation */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 Paramètres de la Propriété
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box component="form" onSubmit={handleEstimate}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adresse"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleInputChange}
                    placeholder="Ex: 123 Rue de Paris, 75001 Paris"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Type de bien"
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
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Surface (m²)"
                    name="surface"
                    type="number"
                    value={formData.surface}
                    onChange={handleInputChange}
                    inputProps={{ min: 1, step: 0.1 }}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre de pièces"
                    name="nombre_pieces"
                    type="number"
                    value={formData.nombre_pieces}
                    onChange={handleInputChange}
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Année de construction"
                    name="annee_construction"
                    type="number"
                    value={formData.annee_construction}
                    onChange={handleInputChange}
                    inputProps={{ min: 1800, max: new Date().getFullYear() }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    size="large"
                    startIcon={loading ? <CircularProgress size={24} /> : <TrendingUpIcon />}
                  >
                    {loading ? 'Estimation en cours...' : 'Estimer la valeur'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Résultat d'estimation */}
        {estimation && (
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <Typography variant="h6" gutterBottom>
                📊 Résultat de l'Estimation
              </Typography>
              <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                  Valeur Estimée
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {formatPrice(estimation.prix_estime || estimation.valeur)}
                </Typography>
              </Box>

              {estimation.prix_min && estimation.prix_max && (
                <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Fourchette de Prix
                  </Typography>
                  <Typography variant="body1">
                    {formatPrice(estimation.prix_min)} à {formatPrice(estimation.prix_max)}
                  </Typography>
                </Box>
              )}

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Surface
                    </Typography>
                    <Typography variant="body2">
                      {formData.surface}m²
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Prix par m²
                    </Typography>
                    <Typography variant="body2">
                      {formatPrice((estimation.prix_estime || estimation.valeur) / formData.surface)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Type de Bien
                    </Typography>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {formData.type_bien}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Source
                    </Typography>
                    <Typography variant="body2">
                      {estimation.source || 'Melo API'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {estimation.details && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    📌 Détails supplémentaires
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                    {estimation.details}
                  </Typography>
                </Box>
              )}

              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                startIcon={<CompareArrowsIcon />}
                onClick={() => setCompareDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Comparer avec une autre propriété
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Informations supplémentaires */}
      {!estimation && (
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom>
              ℹ️ À propos de l'Estimation
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Notre outil utilise l'API Melo pour estimer la valeur de votre propriété en fonction
              des données du marché immobilier français. L'estimation est basée sur :
            </Typography>
            <ul style={{ color: '#666', marginTop: '10px' }}>
              <li>La localisation de la propriété</li>
              <li>Les caractéristiques du bien (surface, type, nombre de pièces)</li>
              <li>Les données de marché récentes</li>
              <li>Les transactions comparables</li>
            </ul>
          </Paper>
        </Box>
      )}

      {/* Dialog de Comparaison */}
      <Dialog
        open={compareDialogOpen}
        onClose={() => setCompareDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>🔀 Comparer deux propriétés</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1976d2' }}>
              Propriété 1
            </Typography>
            <TextField
              fullWidth
              label="Adresse 1 *"
              name="adresse1"
              value={compareFormData.adresse1}
              onChange={handleCompareInputChange}
              required
            />
            <TextField
              fullWidth
              label="Surface 1 (m²) *"
              name="surface1"
              type="number"
              value={compareFormData.surface1}
              onChange={handleCompareInputChange}
              inputProps={{ step: '0.01', min: '0' }}
              required
            />
            <TextField
              fullWidth
              label="Type de bien 1"
              name="type_bien1"
              select
              SelectProps={{ native: true }}
              value={compareFormData.type_bien1}
              onChange={handleCompareInputChange}
            >
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="terrain">Terrain</option>
              <option value="local_commercial">Local commercial</option>
            </TextField>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#764ba2' }}>
              Propriété 2
            </Typography>
            <TextField
              fullWidth
              label="Adresse 2 *"
              name="adresse2"
              value={compareFormData.adresse2}
              onChange={handleCompareInputChange}
              required
            />
            <TextField
              fullWidth
              label="Surface 2 (m²) *"
              name="surface2"
              type="number"
              value={compareFormData.surface2}
              onChange={handleCompareInputChange}
              inputProps={{ step: '0.01', min: '0' }}
              required
            />
            <TextField
              fullWidth
              label="Type de bien 2"
              name="type_bien2"
              select
              SelectProps={{ native: true }}
              value={compareFormData.type_bien2}
              onChange={handleCompareInputChange}
            >
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="terrain">Terrain</option>
              <option value="local_commercial">Local commercial</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleCompare}
            variant="contained"
            color="primary"
            disabled={compareLoading}
          >
            {compareLoading ? <CircularProgress size={24} /> : 'Comparer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Résultats de Comparaison */}
      {compareResults && (
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, backgroundColor: '#f9f9f9', border: '2px solid #667eea' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              📊 Résultats de la Comparaison
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
              {/* Propriété 1 */}
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="primary" variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      {compareFormData.adresse1}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip label={`${compareFormData.surface1} m²`} size="small" />
                      <Chip
                        label={compareFormData.type_bien1}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    {compareResults.propriete1 && (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          Valeur Estimée
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#667eea', fontWeight: 700 }}>
                          {formatPrice(
                            compareResults.propriete1.prix_estime ||
                            compareResults.propriete1.valeur
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Prix par m²
                        </Typography>
                        <Typography variant="body2">
                          {formatPrice(
                            (compareResults.propriete1.prix_estime ||
                              compareResults.propriete1.valeur) / compareFormData.surface1
                          )}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Propriété 2 */}
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="secondary" variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      {compareFormData.adresse2}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip label={`${compareFormData.surface2} m²`} size="small" />
                      <Chip
                        label={compareFormData.type_bien2}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    {compareResults.propriete2 && (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          Valeur Estimée
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#764ba2', fontWeight: 700 }}>
                          {formatPrice(
                            compareResults.propriete2.prix_estime ||
                            compareResults.propriete2.valeur
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Prix par m²
                        </Typography>
                        <Typography variant="body2">
                          {formatPrice(
                            (compareResults.propriete2.prix_estime ||
                              compareResults.propriete2.valeur) / compareFormData.surface2
                          )}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {compareResults.difference && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Différence
                </Typography>
                <Typography variant="body2">
                  Écart de prix: {formatPrice(compareResults.difference)} (
                  {compareResults.pourcentage_difference?.toFixed(1)}%)
                </Typography>
              </Box>
            )}

            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={() => {
                setCompareResults(null);
                setCompareDialogOpen(false);
              }}
              sx={{ mt: 2 }}
            >
              Fermer la comparaison
            </Button>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default EstimationsPage;
