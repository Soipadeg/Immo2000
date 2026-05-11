/**
 * Page Favoris - Biens sauvegardés
 */

import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Card, CardContent, CardActions, CardMedia, Typography, Button, IconButton, CircularProgress, Chip, Alert } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { favorisApi } from '../services/api';

const FavoritesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Charger les favoris au montage
  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await favorisApi.list(0, 100);
      if (response.data && response.data.data) {
        setFavorites(response.data.data);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les favoris');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      await favorisApi.remove(favoriteId);
      setFavorites(favorites.filter((fav) => fav.favori_id !== favoriteId));
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression du favori');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          ⭐ Mes Favoris
        </Typography>
        <Typography color="textSecondary">
          {favorites.length} bien{favorites.length !== 1 ? 's' : ''} sauvegardé{favorites.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {favorites.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <FavoriteBorderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Aucun favori pour le moment
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 3 }}>
            Commencez à sauvegarder vos biens préférés en cliquant sur le cœur
          </Typography>
          <Button variant="contained" color="primary" href="/search">
            Consulter les annonces
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((fav) => (
            <Grid item xs={12} sm={6} lg={4} key={fav.favori_id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={'https://via.placeholder.com/400x250?text=Bien+' + fav.annonce_id}
                  alt={'Annonce ' + fav.annonce_id}
                  sx={{ objectFit: 'cover' }}
                />

                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Chip label="Favori" size="small" color="primary" variant="outlined" />
                    <Box>
                      {fav.note && (
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                          ⭐ {fav.note}/5
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
                    Annonce #{fav.annonce_id}
                  </Typography>

                  {fav.commentaire && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {fav.commentaire}
                    </Typography>
                  )}

                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                    Ajouté le {new Date(fav.date_ajout).toLocaleDateString('fr-FR')}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button size="small" color="primary" href={`/annonce/${fav.annonce_id}`}>
                    Voir l'annonce
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFavorite(fav.favori_id)}
                    color="error"
                  >
                    <FavoriteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default FavoritesPage;
