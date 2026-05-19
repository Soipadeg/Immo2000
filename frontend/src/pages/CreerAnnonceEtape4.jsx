import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Stack,
  Grid,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completerAnnonce } from '../services/api';

/**
 * Page ÉTAPE 4 du tunnel : Informations complémentaires
 *
 * Utilisateur remplit :
 * - Description
 * - Prix
 * - Surface
 * - Nombre de pièces
 * - Type de bien
 * - Année construction, DPE, etc.
 */
export default function CreerAnnonceEtape4() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const annonceId = parseInt(searchParams.get('annonce_id'));
  const withContract = searchParams.get('with_contract') === 'true';

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix: '',
    surface: '',
    nombre_pieces: '',
    type_bien: 'appartement',
    etage: '',
    annee_construction: '',
    dpe: 'C',
    ascenseur: false,
    balcon: false,
    terrasse: false,
    jardin: false,
    piscine: false,
    parking: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.description.trim()) {
      setError('La description est requise');
      return;
    }

    if (!formData.prix || parseFloat(formData.prix) <= 0) {
      setError('Le prix doit être supérieur à 0');
      return;
    }

    if (!formData.surface || parseFloat(formData.surface) <= 0) {
      setError('La surface doit être supérieure à 0');
      return;
    }

    if (!formData.nombre_pieces || parseInt(formData.nombre_pieces) < 1) {
      setError('Le nombre de pièces doit être au minimum 1');
      return;
    }

    setLoading(true);

    try {
      await completerAnnonce(annonceId, formData);

      // Succès !
      navigate('/dashboard?tab=ventes', {
        state: { message: '✅ Annonce publiée avec succès !' }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la publication');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Titre */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            📝 Informations complètes
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
            Étape 4 sur 4 : Finalisation et publication
          </Typography>
          <LinearProgress variant="determinate" value={100} />
        </Box>

        {/* Infos contrat */}
        {withContract && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Contrat d'exclusivité signé ! Vous aurez accès aux outils IA dès la publication.
          </Alert>
        )}

        {/* Erreurs */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Formulaire */}
        <Paper elevation={3} sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description de l'annonce"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre bien en détail..."
                  multiline
                  rows={6}
                  required
                  inputProps={{ maxLength: 2000 }}
                  helperText={`${formData.description.length}/2000`}
                />
              </Grid>

              {/* Prix et Surface */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prix (€)"
                  name="prix"
                  type="number"
                  value={formData.prix}
                  onChange={handleChange}
                  placeholder="250000"
                  required
                  inputProps={{ step: '1000' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Surface (m²)"
                  name="surface"
                  type="number"
                  value={formData.surface}
                  onChange={handleChange}
                  placeholder="80"
                  required
                  inputProps={{ step: '0.1' }}
                />
              </Grid>

              {/* Pièces et Type */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre de pièces"
                  name="nombre_pieces"
                  type="number"
                  value={formData.nombre_pieces}
                  onChange={handleChange}
                  placeholder="3"
                  required
                  inputProps={{ min: '1' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Type de bien</InputLabel>
                  <Select
                    name="type_bien"
                    value={formData.type_bien}
                    onChange={handleChange}
                    label="Type de bien"
                  >
                    <MenuItem value="appartement">Appartement</MenuItem>
                    <MenuItem value="maison">Maison</MenuItem>
                    <MenuItem value="terrain">Terrain</MenuItem>
                    <MenuItem value="local commercial">Local commercial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Étage et Année */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Étage (optionnel)"
                  name="etage"
                  type="number"
                  value={formData.etage}
                  onChange={handleChange}
                  placeholder="2"
                  inputProps={{ min: '0' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Année de construction (optionnel)"
                  name="annee_construction"
                  type="number"
                  value={formData.annee_construction}
                  onChange={handleChange}
                  placeholder="2015"
                  inputProps={{ min: '1800' }}
                />
              </Grid>

              {/* DPE */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Performance énergétique (DPE)</InputLabel>
                  <Select
                    name="dpe"
                    value={formData.dpe}
                    onChange={handleChange}
                    label="Performance énergétique (DPE)"
                  >
                    <MenuItem value="A">A - Très performant</MenuItem>
                    <MenuItem value="B">B - Performant</MenuItem>
                    <MenuItem value="C">C - Moyen</MenuItem>
                    <MenuItem value="D">D - Peu performant</MenuItem>
                    <MenuItem value="E">E - Mauvais</MenuItem>
                    <MenuItem value="F">F - Très mauvais</MenuItem>
                    <MenuItem value="G">G - À rénover</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Caractéristiques */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Caractéristiques du bien
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="ascenseur"
                          checked={formData.ascenseur}
                          onChange={handleChange}
                        />
                      }
                      label="Ascenseur"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="balcon"
                          checked={formData.balcon}
                          onChange={handleChange}
                        />
                      }
                      label="Balcon"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="terrasse"
                          checked={formData.terrasse}
                          onChange={handleChange}
                        />
                      }
                      label="Terrasse"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="jardin"
                          checked={formData.jardin}
                          onChange={handleChange}
                        />
                      }
                      label="Jardin"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="piscine"
                          checked={formData.piscine}
                          onChange={handleChange}
                        />
                      }
                      label="Piscine"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="parking"
                          checked={formData.parking}
                          onChange={handleChange}
                        />
                      }
                      label="Parking"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Boutons */}
            <Stack direction="row" spacing={2} sx={{ mt: 4, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => navigate(-1)}
              >
                Retour
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                type="submit"
                disabled={loading}
              >
                {loading ? '📤 Publication en cours...' : '🎉 Publier mon annonce !'}
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Info */}
        <Box sx={{ mt: 4, p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: 'success.dark' }}>
            ✅ <strong>Dernière étape !</strong> Une fois publiée, votre annonce sera visible aux acheteurs potentiels.
            Vous pourrez la gérer depuis votre dashboard.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
