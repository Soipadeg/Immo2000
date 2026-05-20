/**
 * Composant Carousel d'annonces similaires
 * Affiche des biens similaires basés sur localisation, type et prix
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { annoncesApi } from '../services/api';

const SimilarAnnoncesCarousel = ({ annonceActuelle, userRole }) => {
  const [similaires, setSimilaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch {
      return [];
    }
  });

  const navigate = useNavigate();
  const itemsPerView = window.innerWidth < 768 ? 1 : window.innerWidth < 1200 ? 2 : 3;

  useEffect(() => {
    loadSimilarAnnonces();
  }, [annonceActuelle?.annonce_id]);

  const loadSimilarAnnonces = async () => {
    try {
      setLoading(true);
      setError('');

      // Charger toutes les annonces
      const response = await annoncesApi.listAll({
        ville: annonceActuelle.ville,
        type_bien: annonceActuelle.type_bien,
      });

      // Filtrer les annonces similaires (exclure l'annonce actuelle)
      const filtered = response.data.annonces
        .filter((ann) => ann.annonce_id !== annonceActuelle.annonce_id)
        .filter((ann) => {
          // Même ville
          if (ann.ville.toLowerCase() !== annonceActuelle.ville.toLowerCase()) {
            return false;
          }

          // Même type de bien
          if (ann.type_bien !== annonceActuelle.type_bien) {
            return false;
          }

          // Prix dans une plage similaire (±30%)
          const prixMin = annonceActuelle.prix * 0.7;
          const prixMax = annonceActuelle.prix * 1.3;
          if (ann.prix < prixMin || ann.prix > prixMax) {
            return false;
          }

          return true;
        })
        .slice(0, 12); // Limiter à 12 pour le carousel

      setSimilaires(filtered);
    } catch (err) {
      setError('Impossible de charger les annonces similaires');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? Math.max(0, similaires.length - itemsPerView) : prev - 1
    );
  };

  const handleNext = () => {
    const maxIndex = Math.max(0, similaires.length - itemsPerView);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handleCardClick = (annonceId) => {
    navigate(`/annonce/${annonceId}`);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div>
        <div class="spinner"></div>
      </div>
    );
  }

  if (similaires.length === 0) {
    return null; // Ne pas afficher si pas d'annonces similaires
  }

  const visibleAnnonces = similaires.slice(
    currentIndex,
    currentIndex + itemsPerView
  );

  const maxIndex = Math.max(0, similaires.length - itemsPerView);
  const canShowPrevious = currentIndex > 0;
  const canShowNext = currentIndex < maxIndex;

  return (
    <Container maxWidth="lg">
      <div>
        <p>
          🏠 Annonces similaires
        </p>
        <p>
          {similaires.length} bien{similaires.length > 1 ? 's' : ''} similaire
          {similaires.length > 1 ? 's' : ''} disponible
          {similaires.length > 1 ? 's' : ''}
        </p>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Carousel */}
      <div>
        {/* Boutons de navigation */}
        {canShowPrevious && (
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              left: -50,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}

        {canShowNext && (
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: -50,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        )}

        {/* Grille des annonces */}
        <Grid container spacing={2}>
          {visibleAnnonces.map((annonce) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={Math.floor(12 / itemsPerView)}
              key={annonce.annonce_id}
            >
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleCardClick(annonce.annonce_id)}
              >
                {/* Image avec overlay de prix */}
                {annonce.photos && annonce.photos.length > 0 ? (
                  <CardMedia
                    component="img"
                    height="250"
                    image={annonce.photos[0]}
                    alt={annonce.titre}
                  />
                ) : (
                  <div
                  >
                    Pas de photo
                  </div>
                )}

                <CardContent>
                  {/* Titre */}
                  <p>
                    {annonce.titre}
                  </p>

                  {/* Prix */}
                  <p>
                    {annonce.prix.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </p>

                  {/* Localisation */}
                  <p>
                    📍 {annonce.ville}
                  </p>

                  {/* Caractéristiques */}
                  <div>
                    <Chip label={`${annonce.surface}m²`} size="small" variant="outlined" />
                    <Chip label={`${annonce.nombre_pieces} p.`} size="small" variant="outlined" />
                  </div>

                  {/* DPE */}
                  {annonce.dpe && (
                    <Chip
                      label={`DPE: ${annonce.dpe}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </CardContent>

                {/* Actions */}
                <CardActions>
                  <button size="small"
                    startIcon={
                      favorites.includes(annonce.annonce_id) ? (
                        <FavoriteIcon />
                      ) : (
                        <FavoriteBorderIcon />
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(annonce.annonce_id);
                    }}
                  >
                    {favorites.includes(annonce.annonce_id) ? 'Favori' : 'Ajouter'}
                  </button>
                  <button size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => handleCardClick(annonce.annonce_id)}
                  >
                    Voir →
                  </button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Indicateur de position */}
        {similaires.length > itemsPerView && (
          <div>
            <p>
              {currentIndex + 1} - {Math.min(currentIndex + itemsPerView, similaires.length)} sur{' '}
              {similaires.length}
            </p>
          </div>
        )}
      </div>
    </Container>
  );
};

export default SimilarAnnoncesCarousel;
