/**
 * Composant de recherche de biens immobiliers
 * Affiche les annonces publiées avec filtres et recherche
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
  CardMedia,
  CardActions,
  Button,
  Chip,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { annoncesApi } from '../services/api';

/**
 * Composant Carte annonce pour acheteurs
 */
const AnnonceBienCard = ({ annonce, isFavorite, onToggleFavorite, onContactVendeur }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Image principale */}
      {annonce.photos && annonce.photos.length > 0 && (
        <CardMedia
          component="img"
          height="200"
          image={annonce.photos[0]}
          alt={annonce.titre}
          sx={{ objectFit: 'cover' }}
        />
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        {/* Titre */}
        <Typography gutterBottom variant="h6" component="div">
          {annonce.titre}
        </Typography>

        {/* Prix */}
        <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
          {annonce.prix.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'EUR',
          })}
        </Typography>

        {/* Localisation */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          📍 {annonce.adresse}, {annonce.code_postal} {annonce.ville}
        </Typography>

        {/* Caractéristiques */}
        <Box sx={{ my: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${annonce.surface}m²`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${annonce.nombre_pieces} pièces`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={annonce.type_bien}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Équipements */}
        {(annonce.ascenseur ||
          annonce.balcon ||
          annonce.terrasse ||
          annonce.jardin ||
          annonce.piscine ||
          annonce.parking) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Équipements:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {annonce.ascenseur && <Chip label="🛗 Ascenseur" size="small" />}
              {annonce.balcon && <Chip label="🏠 Balcon" size="small" />}
              {annonce.terrasse && <Chip label="🪴 Terrasse" size="small" />}
              {annonce.jardin && <Chip label="🌳 Jardin" size="small" />}
              {annonce.piscine && <Chip label="🏊 Piscine" size="small" />}
              {annonce.parking && <Chip label="🚗 Parking" size="small" />}
            </Box>
          </Box>
        )}

        {/* DPE */}
        {annonce.dpe && (
          <Chip
            label={`DPE: ${annonce.dpe}`}
            size="small"
            sx={{ mb: 2 }}
          />
        )}

        {/* Description */}
        <Typography variant="body2" color="text.secondary">
          {annonce.description.substring(0, 150)}...
        </Typography>

        {/* Date création */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Annoncée le {format(new Date(annonce.date_creation), 'dd MMMM yyyy', { locale: fr })}
        </Typography>
      </CardContent>

      {/* Actions */}
      <CardActions>
        <Button
          size="small"
          startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          onClick={onToggleFavorite}
          color={isFavorite ? 'error' : 'inherit'}
        >
          {isFavorite ? 'Favoris' : 'Ajouter'}
        </Button>
        <Button
          size="small"
          startIcon={<ShareIcon />}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: annonce.titre,
                text: `Découvrez ce bien: ${annonce.titre}`,
                url: window.location.href,
              });
            }
          }}
        >
          Partager
        </Button>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => onContactVendeur(annonce.utilisateur_id)}
          sx={{ ml: 'auto' }}
        >
          Contacter
        </Button>
      </CardActions>
    </Card>
  );
};

/**
 * Composant principal de recherche
 */
export const RechercheBiens = () => {
  const [annonces, setAnnonces] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Filtres
  const [filters, setFilters] = useState({
    ville: '',
    code_postal: '',
    type_bien: '',
    prix_min: '',
    prix_max: '',
    surface_min: '',
    surface_max: '',
    search: '',
  });

  // Charger les annonces
  const loadAnnonces = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await annoncesApi.listAll((page - 1) * limit, limit, {
        statut: 'publiée', // Seulement les annonces publiées
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      setAnnonces(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Charger les annonces au montage et lors des changements
  useEffect(() => {
    loadAnnonces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      ville: '',
      code_postal: '',
      type_bien: '',
      prix_min: '',
      prix_max: '',
      surface_min: '',
      surface_max: '',
      search: '',
    });
    setPage(1);
  };

  const toggleFavorite = (annonceId) => {
    setFavorites((prev) => {
      const updated = prev.includes(annonceId)
        ? prev.filter((id) => id !== annonceId)
        : [...prev, annonceId];
      localStorage.setItem('favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const handleContactVendeur = (vendeurId) => {
    // À implémenter: ouvrir formulaire de contact ou page de messages
    console.log('Contacter vendeur:', vendeurId);
    alert('Fonctionnalité de contact à implémenter');
  };

  const maxPages = Math.ceil(total / limit) || 1;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🔍 Rechercher des biens immobiliers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Trouvez votre maison ou appartement idéal
        </Typography>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Formulaire de recherche */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Critères de recherche
        </Typography>
        <Grid container spacing={2}>
          {/* Recherche texte */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              placeholder="Rechercher par titre ou description..."
              value={filters.search}
              onChange={handleFilterChange('search')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Localisation */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ville"
              placeholder="Ex: Paris"
              value={filters.ville}
              onChange={handleFilterChange('ville')}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Code postal"
              placeholder="Ex: 75001"
              value={filters.code_postal}
              onChange={handleFilterChange('code_postal')}
              size="small"
            />
          </Grid>

          {/* Type */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Type de bien"
              value={filters.type_bien}
              onChange={handleFilterChange('type_bien')}
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                type="number"
                label="Prix min (€)"
                value={filters.prix_min}
                onChange={handleFilterChange('prix_min')}
                size="small"
              />
              <TextField
                fullWidth
                type="number"
                label="Prix max (€)"
                value={filters.prix_max}
                onChange={handleFilterChange('prix_max')}
                size="small"
              />
            </Box>
          </Grid>

          {/* Surface */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                type="number"
                label="Surface min (m²)"
                value={filters.surface_min}
                onChange={handleFilterChange('surface_min')}
                size="small"
              />
              <TextField
                fullWidth
                type="number"
                label="Surface max (m²)"
                value={filters.surface_max}
                onChange={handleFilterChange('surface_max')}
                size="small"
              />
            </Box>
          </Grid>

          {/* Boutons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={loadAnnonces}
                disabled={loading}
              >
                Rechercher
              </Button>
              <Button
                variant="outlined"
                onClick={handleResetFilters}
              >
                Réinitialiser
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Chargement */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Aucun résultat */}
      {!loading && annonces.length === 0 && (
        <Alert severity="info">
          Aucun bien trouvé. Essayez d'élargir votre recherche.
        </Alert>
      )}

      {/* Résultats */}
      {!loading && annonces.length > 0 && (
        <>
          {/* Statistiques */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {total} bien{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''} •
              Affichage {(page - 1) * limit + 1} à {Math.min(page * limit, total)}
            </Typography>
          </Box>

          {/* Grille */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {annonces.map((annonce) => (
              <Grid item xs={12} sm={6} md={4} key={annonce.annonce_id}>
                <AnnonceBienCard
                  annonce={annonce}
                  isFavorite={favorites.includes(annonce.annonce_id)}
                  onToggleFavorite={() => toggleFavorite(annonce.annonce_id)}
                  onContactVendeur={handleContactVendeur}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {maxPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={maxPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default RechercheBiens;
