/**
 * Page Favoris - Biens sauvegardés
 */

import React, { useState } from 'react';
import { Box, Container, Grid, Card, CardContent, CardActions, CardMedia, Typography, Button, IconButton, Empty, CircularProgress, Chip } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const FavoritesPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      titre: 'Magnifique maison avec jardin',
      prix: 450000,
      ville: 'Paris 15ème',
      codePostal: '75015',
      surface: 120,
      pieces: 4,
      type: 'Maison',
      image: 'https://via.placeholder.com/400x250?text=Maison+1',
      isFavorite: true,
      dateAjout: '2026-05-10',
    },
    {
      id: 2,
      titre: 'Appartement moderne en centre-ville',
      prix: 350000,
      ville: 'Lyon',
      codePostal: '69000',
      surface: 85,
      pieces: 3,
      type: 'Appartement',
      image: 'https://via.placeholder.com/400x250?text=Appart+1',
      isFavorite: true,
      dateAjout: '2026-05-09',
    },
  ]);

  if (loading) {
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

  const handleRemoveFavorite = (id) => {
    setFavorites(favorites.filter((fav) => fav.id !== id));
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
          {favorites.map((bien) => (
            <Grid item xs={12} sm={6} lg={4} key={bien.id}>
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
                  image={bien.image}
                  alt={bien.titre}
                  sx={{ objectFit: 'cover' }}
                />

                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Chip label={bien.type} size="small" color="primary" variant="outlined" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {bien.prix.toLocaleString()}€
                    </Typography>
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
                    {bien.titre}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 2 }}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {bien.ville} ({bien.codePostal})
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="textSecondary">
                    📏 {bien.surface}m² • 🚪 {bien.pieces} pièce{bien.pieces > 1 ? 's' : ''}
                  </Typography>

                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                    Ajouté le {new Date(bien.dateAjout).toLocaleDateString('fr-FR')}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button size="small" color="primary" href={`/annonce/${bien.id}`}>
                    Voir détails
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFavorite(bien.id)}
                    color="error"
                  >
                    <FavoriteIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small">
                    <ShareIcon fontSize="small" />
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
