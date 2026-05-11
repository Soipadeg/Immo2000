/**
 * Page de détail d'une annonce immobilière
 * Affiche tous les détails du bien avec photos en galerie et annonces similaires
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  ImageList,
  ImageListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as MapPinIcon,
  Home as HomeIcon,
  Straighten as RulerIcon,
  DoorSliding as DoorSlidingIcon,
  Bolt as ZapIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { annoncesApi } from '../services/api';
import SimilarAnnoncesCarousel from '../components/SimilarAnnoncesCarousel';

const AnnoncePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [annonce, setAnnonce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [openContactModal, setOpenContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    message: '',
  });
  const [userRole] = useState(() => localStorage.getItem('user_role') || 'visiteur');

  // Charger l'annonce
  useEffect(() => {
    loadAnnonce();
    loadFavorites();
  }, [id]);

  const loadAnnonce = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await annoncesApi.getById(id);
      setAnnonce(response.data.annonce || response.data);
    } catch (err) {
      setError('Annonce introuvable ou supprimée');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favs.includes(parseInt(id)));
    } catch {
      setIsFavorite(false);
    }
  };

  const toggleFavorite = () => {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const updated = isFavorite
        ? favs.filter((fav) => fav !== parseInt(id))
        : [...favs, parseInt(id)];
      localStorage.setItem('favorites', JSON.stringify(updated));
      setIsFavorite(!isFavorite);
    } catch {
      console.error('Erreur lors de la modification des favoris');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: annonce.titre,
          text: `Découvrez ce bien: ${annonce.titre} - ${annonce.prix.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copier l'URL
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers!');
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendContact = async () => {
    if (!contactForm.nom || !contactForm.email || !contactForm.message) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      // TODO: Implémenter l'envoi du message de contact
      console.log('Message de contact:', contactForm);
      alert('Message envoyé avec succès!');
      setOpenContactModal(false);
      setContactForm({ nom: '', email: '', telephone: '', message: '' });
    } catch (err) {
      alert('Erreur lors de l\'envoi du message');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !annonce) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Retour
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header avec retour */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="text"
        >
          Retour
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Colonne gauche: Images et détails */}
        <Grid item xs={12} md={8}>
          {/* Galerie d'images */}
          {annonce.photos && annonce.photos.length > 0 ? (
            <Box sx={{ mb: 4 }}>
              {/* Image principale */}
              <Box
                sx={{
                  position: 'relative',
                  mb: 2,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: '#f0f0f0',
                  aspectRatio: '16 / 9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={annonce.photos[selectedImageIndex]}
                  alt={annonce.titre}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Badge favori */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%',
                    p: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                  }}
                  onClick={toggleFavorite}
                >
                  {isFavorite ? (
                    <FavoriteIcon sx={{ color: '#ff0000', fontSize: 28 }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ fontSize: 28 }} />
                  )}
                </Box>

                {/* Compteur photos */}
                {annonce.photos.length > 1 && (
                  <Typography
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      bgcolor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.875rem',
                    }}
                  >
                    {selectedImageIndex + 1} / {annonce.photos.length}
                  </Typography>
                )}
              </Box>

              {/* Miniatures */}
              {annonce.photos.length > 1 && (
                <ImageList sx={{ width: '100%' }} cols={6} rowHeight={80}>
                  {annonce.photos.map((photo, idx) => (
                    <ImageListItem
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      sx={{
                        cursor: 'pointer',
                        border:
                          selectedImageIndex === idx
                            ? '3px solid #1976d2'
                            : '3px solid transparent',
                        opacity: selectedImageIndex === idx ? 1 : 0.6,
                        transition: 'all 0.2s',
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                mb: 4,
                height: 400,
                bgcolor: '#f0f0f0',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
              }}
            >
              Pas de photo disponible
            </Box>
          )}

          {/* Détails principaux */}
          <Paper sx={{ p: 3, mb: 4 }}>
            {/* Titre et prix */}
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              {annonce.titre}
            </Typography>

            <Typography
              variant="h5"
              color="primary"
              sx={{ mb: 2, fontWeight: 700 }}
            >
              {annonce.prix.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              })}
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Prix au m²:{' '}
              {(annonce.prix / annonce.surface).toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              })}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Caractéristiques principales */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <RulerIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{annonce.surface}m²</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Surface
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <DoorSlidingIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{annonce.nombre_pieces}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pièces
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <HomeIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{annonce.type_bien}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Type
                  </Typography>
                </Box>
              </Grid>
              {annonce.dpe && (
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ZapIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />
                    <Typography variant="h6">{annonce.dpe}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      DPE
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Localisation */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MapPinIcon color="primary" />
                <Typography variant="h6">Localisation</Typography>
              </Box>
              <Typography variant="body1">{annonce.adresse}</Typography>
              <Typography variant="body2" color="text.secondary">
                {annonce.code_postal} {annonce.ville}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Équipements */}
            {(annonce.ascenseur ||
              annonce.balcon ||
              annonce.terrasse ||
              annonce.jardin ||
              annonce.piscine ||
              annonce.parking) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Équipements
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {annonce.ascenseur && (
                    <Chip label="🛗 Ascenseur" variant="outlined" />
                  )}
                  {annonce.balcon && <Chip label="🏠 Balcon" variant="outlined" />}
                  {annonce.terrasse && (
                    <Chip label="🪴 Terrasse" variant="outlined" />
                  )}
                  {annonce.jardin && <Chip label="🌳 Jardin" variant="outlined" />}
                  {annonce.piscine && <Chip label="🏊 Piscine" variant="outlined" />}
                  {annonce.parking && (
                    <Chip label="🚗 Parking" variant="outlined" />
                  )}
                </Box>
              </Box>
            )}

            {/* Informations supplémentaires */}
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {annonce.annee_construction && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Année de construction
                  </Typography>
                  <Typography variant="body1">
                    {annonce.annee_construction}
                  </Typography>
                </Grid>
              )}
              {annonce.etage !== undefined && annonce.etage !== null && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Étage
                  </Typography>
                  <Typography variant="body1">{annonce.etage}</Typography>
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Annoncée le
                </Typography>
                <Typography variant="body1">
                  {format(new Date(annonce.date_creation), 'dd MMMM yyyy', {
                    locale: fr,
                  })}
                </Typography>
              </Grid>
            </Grid>

            {/* Description */}
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {annonce.description}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Colonne droite: Contact vendeur */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4, position: 'sticky', top: 100 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              👤 Vendeur
            </Typography>

            {/* Info vendeur */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Annonce publiée par
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {annonce.utilisateur?.prenom} {annonce.utilisateur?.nom}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Boutons d'action */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                startIcon={<EmailIcon />}
                onClick={() => setOpenContactModal(true)}
              >
                Envoyer un message
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={handleShare}
              >
                Partager
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color={isFavorite ? 'error' : 'inherit'}
                startIcon={
                  isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />
                }
                onClick={toggleFavorite}
              >
                {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </Button>
            </Box>

            {/* Info de contact */}
            <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Vous avez des questions? Contactez le vendeur directement par email
                ou téléphone.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Annonces similaires */}
      <SimilarAnnoncesCarousel
        annonceActuelle={annonce}
        userRole={userRole}
      />

      {/* Modal de contact */}
      <Dialog open={openContactModal} onClose={() => setOpenContactModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contacter le vendeur</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Votre nom *"
              name="nom"
              value={contactForm.nom}
              onChange={handleContactChange}
              size="small"
            />
            <TextField
              fullWidth
              type="email"
              label="Votre email *"
              name="email"
              value={contactForm.email}
              onChange={handleContactChange}
              size="small"
            />
            <TextField
              fullWidth
              label="Votre téléphone"
              name="telephone"
              value={contactForm.telephone}
              onChange={handleContactChange}
              size="small"
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Votre message *"
              name="message"
              value={contactForm.message}
              onChange={handleContactChange}
              placeholder="Décrivez votre intérêt pour ce bien..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContactModal(false)}>Annuler</Button>
          <Button
            onClick={handleSendContact}
            variant="contained"
            color="primary"
          >
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AnnoncePage;
