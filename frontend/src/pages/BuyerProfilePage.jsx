import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Link,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Grid,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateBuyerProfile } from '../services/api';

/**
 * Page d'inscription ÉTAPE 2 : Profil acheteur
 *
 * Permet au nouvel utilisateur de définir ses critères de recherche immobilière.
 * Après cette étape, l'utilisateur peut contacter les vendeurs ou explorer le dashboard.
 */
export default function BuyerProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || ''
  );

  const [formData, setFormData] = useState({
    type_bien_recherche: 'appartement', // maison, appartement, terrain
    nombre_pieces_min: 2,
    surface_min: 50,
    budget_max: 300000,
    ville_recherchee: '',
    dpe_ideale: 'C', // A-G, optionnel
  });

  // Récupérer les query params pour savoir d'où l'utilisateur vient
  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('from'); // 'annonce' ou 'simulateur'
  const annonceId = searchParams.get('annonce_id');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : (
        ['nombre_pieces_min', 'surface_min', 'budget_max'].includes(name)
          ? Number(value)
          : value
      ),
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation minimum
    if (!formData.type_bien_recherche || !formData.budget_max) {
      setError('Type de bien et budget maximum sont requis');
      return;
    }

    if (formData.budget_max < 0) {
      setError('Le budget ne peut pas être négatif');
      return;
    }

    setLoading(true);

    try {
      // Appeler le backend pour mettre à jour le profil acheteur
      await updateBuyerProfile(formData);

      setSuccessMessage('Profil acheteur mis à jour avec succès !');

      // Redirection basée sur d'où l'utilisateur vient
      if (from === 'annonce' && annonceId) {
        // Rediriger vers la page de contact du vendeur
        navigate(`/contacter-vendeur?annonce_id=${annonceId}`);
      } else if (from === 'simulateur') {
        // Rediriger vers le dashboard ou accueil
        navigate('/dashboard');
      } else {
        // Par défaut, rediriger vers le dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Erreur lors de la mise à jour du profil'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" sx={{ mb: 1, textAlign: 'center' }}>
          Complétez votre profil acheteur
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
          Étape 2 sur 2 : Ces informations nous aideront à vous proposer les meilleures annonces.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        <Paper elevation={3} sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Type de bien recherché */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Type de bien recherché *</InputLabel>
                  <Select
                    name="type_bien_recherche"
                    value={formData.type_bien_recherche}
                    onChange={handleChange}
                    label="Type de bien recherché *"
                  >
                    <MenuItem value="appartement">Appartement</MenuItem>
                    <MenuItem value="maison">Maison</MenuItem>
                    <MenuItem value="terrain">Terrain</MenuItem>
                    <MenuItem value="local commercial">Local commercial</MenuItem>
                  </Select>
                  <FormHelperText>Quel type de bien vous intéresse ?</FormHelperText>
                </FormControl>
              </Grid>

              {/* Nombre de pièces minimum */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre de pièces minimum *"
                  name="nombre_pieces_min"
                  type="number"
                  value={formData.nombre_pieces_min}
                  onChange={handleChange}
                  inputProps={{ min: 1, max: 20 }}
                  required
                />
              </Grid>

              {/* Surface minimum */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Surface minimum (m²) *"
                  name="surface_min"
                  type="number"
                  value={formData.surface_min}
                  onChange={handleChange}
                  inputProps={{ min: 1, max: 10000 }}
                  required
                />
              </Grid>

              {/* Budget maximum */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Budget maximum (€) *"
                  name="budget_max"
                  type="number"
                  value={formData.budget_max}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 10000 }}
                  required
                  helperText="Montant maximum que vous êtes prêt à investir"
                />
              </Grid>

              {/* Ville recherchée */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ville recherchée (optionnel)"
                  name="ville_recherchee"
                  value={formData.ville_recherchee}
                  onChange={handleChange}
                  placeholder="Ex: Paris, Lyon, Marseille"
                  helperText="Vous pouvez en laisser vide ou en spécifier plusieurs plus tard"
                />
              </Grid>

              {/* DPE idéal */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Performance énergétique (optionnel)</InputLabel>
                  <Select
                    name="dpe_ideale"
                    value={formData.dpe_ideale}
                    onChange={handleChange}
                    label="Performance énergétique (optionnel)"
                  >
                    <MenuItem value="">Indifférent</MenuItem>
                    <MenuItem value="A">A - Très performant</MenuItem>
                    <MenuItem value="B">B - Performant</MenuItem>
                    <MenuItem value="C">C - Moyen (standard)</MenuItem>
                    <MenuItem value="D">D - Passable</MenuItem>
                    <MenuItem value="E">E - Mauvais</MenuItem>
                    <MenuItem value="F">F - Très mauvais</MenuItem>
                    <MenuItem value="G">G - À rénover</MenuItem>
                  </Select>
                  <FormHelperText>Classe énergétique minimale souhaitée</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>

            {/* Boutons d'action */}
            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => navigate(-1)}
                sx={{ flex: 1 }}
              >
                Retour
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                type="submit"
                sx={{ flex: 2 }}
              >
                {loading ? 'Mise à jour en cours...' : 'Terminer l\'inscription'}
              </Button>
            </Stack>

            {/* Lien vers dashboard */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Vous pouvez modifier votre profil à tout moment depuis votre{' '}
                <Link href="/dashboard" underline="hover">
                  dashboard
                </Link>
                .
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
