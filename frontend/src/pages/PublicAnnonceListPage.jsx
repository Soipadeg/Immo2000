import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAnnonces } from '../services/api';

/**
 * Page publique pour lister les annonces immobilières
 * Accessible sans connexion
 * Les visiteurs peuvent filtrer les annonces et cliquer pour contacter un vendeur
 */
export default function PublicAnnonceListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  // État des filtres
  const [filters, setFilters] = useState({
    ville: searchParams.get('ville') || '',
    type_bien: searchParams.get('type_bien') || '',
    prix_min: searchParams.get('prix_min') || '',
    prix_max: searchParams.get('prix_max') || '',
    surface_min: searchParams.get('surface_min') || '',
    skip: 0,
    limit: 20,
  });

  // Récupérer les annonces au chargement ou au changement de filtres
  useEffect(() => {
    fetchAnnonces();
  }, [filters]);

  const fetchAnnonces = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAnnonces(filters);
      setAnnonces(response.items || response);
      setTotal(response.total || response.length);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Erreur lors du chargement des annonces'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value,
      skip: 0, // Réinitialiser la pagination
    };
    setFilters(newFilters);

    // Mettre à jour les URL params
    const params = new URLSearchParams();
    if (newFilters.ville) params.set('ville', newFilters.ville);
    if (newFilters.type_bien) params.set('type_bien', newFilters.type_bien);
    if (newFilters.prix_min) params.set('prix_min', newFilters.prix_min);
    if (newFilters.prix_max) params.set('prix_max', newFilters.prix_max);
    if (newFilters.surface_min) params.set('surface_min', newFilters.surface_min);
    setSearchParams(params);
  };

  const handleContactClick = (annonceId) => {
    // Rediriger vers l'inscription si pas connecté
    navigate(`/inscription?from=annonce&annonce_id=${annonceId}`);
  };

  const handleResetFilters = () => {
    setFilters({
      ville: '',
      type_bien: '',
      prix_min: '',
      prix_max: '',
      surface_min: '',
      skip: 0,
      limit: 20,
    });
    setSearchParams('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
          Annonces Immobilières
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Découvrez nos propriétés disponibles. Connectez-vous pour contacter les propriétaires.
        </Typography>
      </Box>

      {/* Filtres */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filtres de recherche
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Ville"
              name="ville"
              value={filters.ville}
              onChange={handleFilterChange}
              placeholder="Ex: Paris"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type de bien</InputLabel>
              <Select
                name="type_bien"
                value={filters.type_bien}
                onChange={handleFilterChange}
                label="Type de bien"
              >
                <MenuItem value="">Tous les types</MenuItem>
                <MenuItem value="appartement">Appartement</MenuItem>
                <MenuItem value="maison">Maison</MenuItem>
                <MenuItem value="terrain">Terrain</MenuItem>
                <MenuItem value="local commercial">Local commercial</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Prix min (€)"
              name="prix_min"
              type="number"
              value={filters.prix_min}
              onChange={handleFilterChange}
              inputProps={{ step: 10000 }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Prix max (€)"
              name="prix_max"
              type="number"
              value={filters.prix_max}
              onChange={handleFilterChange}
              inputProps={{ step: 10000 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleResetFilters}
            >
              Réinitialiser les filtres
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Résultats */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {loading ? '' : `${annonces.length} / ${total} annonces trouvées`}
        </Typography>
      </Box>

      {/* Chargement */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Grille d'annonces */}
      {!loading && annonces.length > 0 && (
        <Grid container spacing={3}>
          {annonces.map((annonce) => (
            <Grid item xs={12} sm={6} md={4} key={annonce.annonce_id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                {/* Image de l'annonce */}
                {annonce.photos && annonce.photos.length > 0 ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={annonce.photos[0]}
                    alt={annonce.titre}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      backgroundColor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography color="text.secondary">Pas de photo</Typography>
                  </Box>
                )}

                {/* Contenu */}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {annonce.titre}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {annonce.ville}
                    {annonce.code_postal && ` (${annonce.code_postal})`}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                      {annonce.prix?.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }) || 'Prix non disponible'}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    {annonce.surface && (
                      <Typography variant="body2">
                        📏 {annonce.surface} m²
                      </Typography>
                    )}
                    {annonce.nombre_pieces && (
                      <Typography variant="body2">
                        🚪 {annonce.nombre_pieces} pièces
                      </Typography>
                    )}
                  </Stack>

                  {annonce.dpe && (
                    <Typography variant="body2" color="text.secondary">
                      DPE: <strong>{annonce.dpe}</strong>
                    </Typography>
                  )}

                  {/* Description courte */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {annonce.description}
                  </Typography>
                </CardContent>

                {/* Actions */}
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => handleContactClick(annonce.annonce_id)}
                  >
                    Contacter le vendeur
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pas de résultats */}
      {!loading && annonces.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune annonce trouvée
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Essayez de modifier vos critères de filtrage
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleResetFilters}
          >
            Réinitialiser les filtres
          </Button>
        </Box>
      )}
    </Container>
  );
}
