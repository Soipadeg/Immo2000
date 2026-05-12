/**
 * Page de recherche d'annonces - Version simplifiée et fonctionnelle
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  TextField,
  MenuItem,
  Pagination,
  InputAdornment,
  Rating,
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocationOn as LocationOnIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

/**
 * Données mock d'annonces
 */
const mockAnnonces = [
  {
    annonce_id: 1,
    titre: 'Magnifique Appartement 3 pièces à Paris 15ème',
    prix: 450000,
    surface: 85,
    nombre_pieces: 3,
    nombre_chambres: 2,
    ville: 'Paris',
    code_postal: '75015',
    type_bien: 'Appartement',
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'],
    description: 'Bel appartement lumineux avec balcon, proximité métro',
  },
  {
    annonce_id: 2,
    titre: 'Maison 4 pièces avec jardins à Lyon',
    prix: 580000,
    surface: 120,
    nombre_pieces: 4,
    nombre_chambres: 3,
    ville: 'Lyon',
    code_postal: '69002',
    type_bien: 'Maison',
    photos: ['https://images.unsplash.com/photo-1570129477492-45a003537e1c?w=400&h=300&fit=crop'],
    description: 'Charmante maison avec terrain, garage, proche école',
  },
  {
    annonce_id: 3,
    titre: 'Studio moderne à Marseille',
    prix: 220000,
    surface: 35,
    nombre_pieces: 1,
    nombre_chambres: 0,
    ville: 'Marseille',
    code_postal: '13001',
    type_bien: 'Studio',
    photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'],
    description: 'Studio lumineux avec cuisine équipée, proximité Vieux Port',
  },
  {
    annonce_id: 4,
    titre: 'Duplex 5 pièces à Toulouse',
    prix: 420000,
    surface: 110,
    nombre_pieces: 5,
    nombre_chambres: 3,
    ville: 'Toulouse',
    code_postal: '31000',
    type_bien: 'Duplex',
    photos: ['https://images.unsplash.com/photo-1480074568708-e7b720bb3f3f?w=400&h=300&fit=crop'],
    description: 'Beau duplex rénové, terrasse exposée sud, calme assuré',
  },
  {
    annonce_id: 5,
    titre: 'Appartement 2 pièces Bordeaux centre',
    prix: 295000,
    surface: 60,
    nombre_pieces: 2,
    nombre_chambres: 1,
    ville: 'Bordeaux',
    code_postal: '33000',
    type_bien: 'Appartement',
    photos: ['https://images.unsplash.com/photo-1545457920-cc2149aae4b0?w=400&h=300&fit=crop'],
    description: 'Appartement en centre-ville, proximité commerces, écoles',
  },
  {
    annonce_id: 6,
    titre: 'Maison de campagne Provence',
    prix: 520000,
    surface: 150,
    nombre_pieces: 6,
    nombre_chambres: 4,
    ville: 'Aix-en-Provence',
    code_postal: '13100',
    type_bien: 'Maison',
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'],
    description: 'Maison provençale avec piscine, vue panoramique',
  },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filtrer les annonces
  const filteredAnnonces = mockAnnonces.filter((annonce) => {
    const matchSearch =
      searchTerm === '' ||
      annonce.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      annonce.ville.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = selectedType === '' || annonce.type_bien === selectedType;
    const matchPrice = annonce.prix >= priceRange[0] && annonce.prix <= priceRange[1];

    return matchSearch && matchType && matchPrice;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAnnonces.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const displayedAnnonces = filteredAnnonces.slice(startIdx, startIdx + itemsPerPage);

  const toggleFavorite = (id) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  return (
    <Box sx={{ bgcolor: '#f9f9f9', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '1.8rem', sm: '2.5rem' },
            }}
          >
            Trouvez votre bien immobilier
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Découvrez {filteredAnnonces.length} annonce(s) correspondant à votre recherche
          </Typography>

          {/* Filtres */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Rechercher par ville ou titre..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                }}
                variant="outlined"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Type de bien"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">Tous les types</MenuItem>
                <MenuItem value="Appartement">Appartement</MenuItem>
                <MenuItem value="Maison">Maison</MenuItem>
                <MenuItem value="Studio">Studio</MenuItem>
                <MenuItem value="Duplex">Duplex</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Prix min"
                type="number"
                value={priceRange[0]}
                onChange={(e) => {
                  setPriceRange([parseInt(e.target.value) || 0, priceRange[1]]);
                  setCurrentPage(1);
                }}
                variant="outlined"
                size="small"
                InputProps={{
                  endAdornment: <InputAdornment position="end">€</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Prix max"
                type="number"
                value={priceRange[1]}
                onChange={(e) => {
                  setPriceRange([priceRange[0], parseInt(e.target.value) || 1000000]);
                  setCurrentPage(1);
                }}
                variant="outlined"
                size="small"
                InputProps={{
                  endAdornment: <InputAdornment position="end">€</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Annonces Grid */}
        {displayedAnnonces.length > 0 ? (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {displayedAnnonces.map((annonce) => (
                <Grid item xs={12} sm={6} md={4} key={annonce.annonce_id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => navigate(`/annonce/${annonce.annonce_id}`)}
                  >
                    {/* Image */}
                    <CardMedia
                      component="img"
                      height="200"
                      image={annonce.photos[0]}
                      alt={annonce.titre}
                      sx={{ objectFit: 'cover' }}
                    />

                    {/* Contenu */}
                    <CardContent sx={{ flexGrow: 1 }}>
                      {/* Type de bien */}
                      <Chip
                        icon={<HomeIcon />}
                        label={annonce.type_bien}
                        size="small"
                        sx={{ mb: 1 }}
                      />

                      {/* Titre */}
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {annonce.titre}
                      </Typography>

                      {/* Localisation */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                        <LocationOnIcon sx={{ fontSize: '1.2rem', color: '#666' }} />
                        <Typography variant="body2" color="textSecondary">
                          {annonce.ville} ({annonce.code_postal})
                        </Typography>
                      </Box>

                      {/* Prix */}
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: '#667eea',
                          mb: 2,
                        }}
                      >
                        {annonce.prix.toLocaleString('fr-FR')} €
                      </Typography>

                      {/* Infos supplémentaires */}
                      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary">
                            {annonce.surface} m²
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary">
                            {annonce.nombre_pieces} pièce(s)
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary">
                            {annonce.nombre_chambres} chambre(s)
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>

                    {/* Actions */}
                    <CardActions sx={{ pt: 0 }}>
                      <Button
                        size="small"
                        variant="contained"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/annonce/${annonce.annonce_id}`);
                        }}
                      >
                        Voir détails
                      </Button>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(annonce.annonce_id);
                        }}
                      >
                        {favorites.has(annonce.annonce_id) ? (
                          <FavoriteIcon sx={{ color: 'error.main' }} />
                        ) : (
                          <FavoriteBorderIcon />
                        )}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(event, value) => {
                    setCurrentPage(value);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  color="primary"
                />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="textSecondary">
              Aucune annonce ne correspond à vos critères.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Essayez de modifier vos filtres.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
