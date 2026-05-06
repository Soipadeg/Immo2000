import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
  Rating,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import axios from 'axios';
import './MatchingPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const MatchingPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    ville: '',
    budget_max: '',
    surface_min: '',
    type_bien: '',
  });
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Récupérer l'acheteur_id depuis le localStorage
  const userId = localStorage.getItem('user_id');
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    // Optionnel : charger les matching au montage si souhaité
    // handleSubmit();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!userId) {
      setError('Vous devez être connecté pour accéder au matching.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/matching`,
        {
          acheteur_id: parseInt(userId),
          ville: filters.ville || undefined,
          budget_max: filters.budget_max ? parseInt(filters.budget_max) : undefined,
          surface_min: filters.surface_min ? parseInt(filters.surface_min) : undefined,
          type_bien: filters.type_bien || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setAnnonces(response.data);
      setSuccess(true);
      // Fermer le message de succès après 3 secondes
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur lors de la requête de matching:', err);
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Erreur lors de la recherche. Veuillez réessayer.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      ville: '',
      budget_max: '',
      surface_min: '',
      type_bien: '',
    });
    setAnnonces([]);
    setError(null);
  };

  const renderScoreStars = (score) => {
    // Convertir le score 0-100 en étoiles 0-5
    const stars = (score / 100) * 5;
    return stars;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Container maxWidth="lg" className="matching-page">
      <Box className="page-header" sx={{ mb: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <HomeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
            Trouvez votre bien idéal
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="textSecondary">
          Utilisez les filtres ci-dessous pour découvrir les annonces les plus adaptées à vos
          critères.
        </Typography>
      </Box>

      {/* Messages d'alerte */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && annonces.length > 0 && (
        <Alert severity="success" onClose={() => setSuccess(false)} sx={{ mb: 3 }}>
          Recherche effectuée ! {annonces.length} annonce(s) trouvée(s).
        </Alert>
      )}

      {/* Formulaire de filtres */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: '#f5f5f5' }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Ville"
                name="ville"
                value={filters.ville}
                onChange={handleFilterChange}
                placeholder="Ex: Paris, Lyon..."
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Budget maximum (€)"
                name="budget_max"
                type="number"
                value={filters.budget_max}
                onChange={handleFilterChange}
                placeholder="Ex: 300000"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Surface minimum (m²)"
                name="surface_min"
                type="number"
                value={filters.surface_min}
                onChange={handleFilterChange}
                placeholder="Ex: 80"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Type de bien</InputLabel>
                <Select
                  name="type_bien"
                  value={filters.type_bien}
                  onChange={handleFilterChange}
                  label="Type de bien"
                >
                  <MenuItem value="">Tous les types</MenuItem>
                  <MenuItem value="Appartement">Appartement</MenuItem>
                  <MenuItem value="Maison">Maison</MenuItem>
                  <MenuItem value="Terrain">Terrain</MenuItem>
                  <MenuItem value="Studio">Studio</MenuItem>
                  <MenuItem value="Loft">Loft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Boutons d'action */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Réinitialiser
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              disabled={loading}
              sx={{ minWidth: '150px' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Rechercher'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Résultats */}
      <Box className="results-section">
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Résultats ({annonces.length})
        </Typography>

        {annonces.length === 0 && !loading ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              border: '1px dashed #ccc',
            }}
          >
            <HomeIcon sx={{ fontSize: 60, color: 'lightgray', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              Aucune annonce ne correspond à vos critères.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Essayez d'élargir vos critères de recherche.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3} className="annonces-grid">
            {annonces.map((annonce) => (
              <Grid item xs={12} sm={6} md={4} key={annonce.id}>
                <Card className="annonce-card" elevation={2}>
                  {/* Image */}
                  <CardMedia
                    component="img"
                    height="200"
                    image={
                      annonce.image_url ||
                      annonce.photo ||
                      'https://via.placeholder.com/400x200?text=Pas+d%27image'
                    }
                    alt={annonce.adresse || 'Annonce immobilière'}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src =
                        'https://via.placeholder.com/400x200?text=Image+indisponible';
                    }}
                  />

                  {/* Contenu principal */}
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {annonce.adresse || 'Adresse non disponible'}
                      </Typography>

                      {/* Prix et caractéristiques */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={`${formatPrice(annonce.prix || 0)}`}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                        {annonce.surface && (
                          <Chip label={`${annonce.surface} m²`} variant="outlined" />
                        )}
                        {annonce.type_bien && (
                          <Chip label={annonce.type_bien} variant="outlined" />
                        )}
                      </Box>

                      {/* Score */}
                      {annonce.score !== undefined && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Rating
                            value={renderScoreStars(annonce.score)}
                            readOnly
                            precision={0.5}
                            size="small"
                          />
                          <Typography variant="body2" color="textSecondary">
                            ({annonce.score}/100)
                          </Typography>
                        </Box>
                      )}

                      {/* Détails supplémentaires */}
                      {annonce.description && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {annonce.description}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>

                  {/* Boutons d'action */}
                  <CardActions sx={{ pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={() => navigate(`/annonces/${annonce.id}`)}
                      sx={{ mb: 1 }}
                    >
                      Voir l'annonce
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate(`/visites?annonce_id=${annonce.id}`)}
                    >
                      Prendre RDV
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default MatchingPage;
