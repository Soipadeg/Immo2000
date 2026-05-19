/**
 * Nouvelle HomePage avec formulaire multi-étapes de création d'annonce
 * Design inspiré d'EstateAI
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Rating,
  Divider,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ExpandMore,
  Home,
  TrendingUp,
  Favorite,
  LocationOn,
  Phone,
  Mail,
  CloudUpload,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const steps = ['Adresse & Titre', 'Caractéristiques', 'Infos Vendeur'];

export default function HomePageV2() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // Étape 1: Adresse & Titre & Photos
  const [formData, setFormData] = useState({
    adresse: '',
    codePostal: '',
    ville: '',
    titre: '',
    photos: [],
    // Étape 2: Caractéristiques
    surface: '',
    pieces: '',
    chambres: '',
    dpe: '',
    detailsAnnonce: '',
    // Étape 3: Infos vendeur
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files],
    }));
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Soumettre le formulaire
      console.log('Soumettre annonce:', formData);
      // Rediriger vers CreateAnnoncePage avec les données
      navigate('/annonces/create', { state: { formData } });
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // ============================================================================
  // Contenu des étapes
  // ============================================================================

  const Step1Content = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        📍 Localisation du bien
      </Typography>

      <TextField
        fullWidth
        label="Adresse"
        name="adresse"
        value={formData.adresse}
        onChange={handleInputChange}
        placeholder="Ex: 123 Rue de Paris"
        variant="outlined"
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Code Postal"
            name="codePostal"
            value={formData.codePostal}
            onChange={handleInputChange}
            placeholder="75015"
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Ville"
            name="ville"
            value={formData.ville}
            onChange={handleInputChange}
            placeholder="Paris"
            variant="outlined"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2, mt: 3, fontWeight: 600 }}>
        📝 Titre de l'annonce
      </Typography>

      <TextField
        fullWidth
        label="Titre"
        name="titre"
        value={formData.titre}
        onChange={handleInputChange}
        placeholder="Ex: Appartement 3 pièces avec balcon"
        multiline
        rows={2}
        variant="outlined"
      />

      <Typography variant="h6" sx={{ mb: 2, mt: 3, fontWeight: 600 }}>
        📸 Photos du bien
      </Typography>

      <Box
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
          '&:hover': {
            borderColor: '#1976d2',
            bgcolor: 'rgba(25, 118, 210, 0.05)',
          },
        }}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
          id="photo-input"
        />
        <label htmlFor="photo-input" style={{ cursor: 'pointer', display: 'block' }}>
          <CloudUpload sx={{ fontSize: 32, color: '#1976d2', mb: 1, mx: 'auto' }} />
          <Typography variant="body2" sx={{ color: '#666' }}>
            Cliquez ou glissez les images ici
          </Typography>
        </label>
      </Box>

      {formData.photos.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {formData.photos.length} photo(s) sélectionnée(s)
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: 1,
            }}
          >
            {formData.photos.map((photo, idx) => (
              <Box
                key={idx}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: '#f0f0f0',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
              >
                {photo.name.substring(0, 10)}...
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

  const Step2Content = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        🏠 Caractéristiques du bien
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Surface (m²)"
            name="surface"
            type="number"
            value={formData.surface}
            onChange={handleInputChange}
            placeholder="120"
            variant="outlined"
            InputProps={{
              endAdornment: <InputAdornment position="end">m²</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Nombre de pièces"
            name="pieces"
            type="number"
            value={formData.pieces}
            onChange={handleInputChange}
            placeholder="4"
            variant="outlined"
          />
        </Grid>
      </Grid>

      <TextField
        fullWidth
        label="Nombre de chambres"
        name="chambres"
        type="number"
        value={formData.chambres}
        onChange={handleInputChange}
        placeholder="3"
        variant="outlined"
      />

      <FormControl fullWidth>
        <InputLabel>DPE (Diagnostic de Performance Énergétique)</InputLabel>
        <Select
          name="dpe"
          value={formData.dpe}
          onChange={handleInputChange}
          label="DPE (Diagnostic de Performance Énergétique)"
        >
          <MenuItem value="">Sélectionner</MenuItem>
          <MenuItem value="A">A - Très performant</MenuItem>
          <MenuItem value="B">B - Performant</MenuItem>
          <MenuItem value="C">C - Conforme</MenuItem>
          <MenuItem value="D">D - À améliorer</MenuItem>
          <MenuItem value="E">E - À rénover</MenuItem>
          <MenuItem value="F">F - Très énergivore</MenuItem>
          <MenuItem value="G">G - Extrêmement énergivore</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="h6" sx={{ mb: 2, mt: 3, fontWeight: 600 }}>
        📋 Détails de l'annonce
      </Typography>

      <TextField
        fullWidth
        label="Description du bien"
        name="detailsAnnonce"
        value={formData.detailsAnnonce}
        onChange={handleInputChange}
        placeholder="Décrivez les caractéristiques, les points forts, l'ambiance..."
        multiline
        rows={4}
        variant="outlined"
      />
    </Box>
  );

  const Step3Content = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        👤 Vos informations personnelles
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Prénom"
            name="prenom"
            value={formData.prenom}
            onChange={handleInputChange}
            placeholder="Jean"
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Nom"
            name="nom"
            value={formData.nom}
            onChange={handleInputChange}
            placeholder="Dupont"
            variant="outlined"
          />
        </Grid>
      </Grid>

      <TextField
        fullWidth
        label="Adresse Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleInputChange}
        placeholder="jean.dupont@email.com"
        variant="outlined"
        InputProps={{
          startAdornment: <InputAdornment position="start"><Mail size={18} /></InputAdornment>,
        }}
      />

      <TextField
        fullWidth
        label="Numéro de téléphone"
        name="telephone"
        type="tel"
        value={formData.telephone}
        onChange={handleInputChange}
        placeholder="+33 6 12 34 56 78"
        variant="outlined"
        InputProps={{
          startAdornment: <InputAdornment position="start"><Phone size={18} /></InputAdornment>,
        }}
      />

      <Typography
        variant="body2"
        sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, color: '#666' }}
      >
        ✓ Vos données personnelles sont protégées et sécurisées conformément au RGPD.
      </Typography>
    </Box>
  );

  // ============================================================================
  // Testimonials
  // ============================================================================

  const testimonials = [
    {
      name: 'Marie Lefevre',
      role: 'Vendeuse',
      avatar: '👩‍💼',
      text: 'Vendre mon appartement a été simple et rapide. Immo2000 m\'a vraiment aidée!',
      rating: 5,
    },
    {
      name: 'Jean Dupont',
      role: 'Vendeur',
      avatar: '👨‍💼',
      text: 'Interface intuitive et support très réactif. Excellent service!',
      rating: 5,
    },
    {
      name: 'Sophie Martin',
      role: 'Acheteuse',
      avatar: '👩‍🦰',
      text: 'Plateforme fiable pour trouver mon futur logement. Je recommande!',
      rating: 4,
    },
  ];

  // ============================================================================
  // Features/Avantages
  // ============================================================================

  const features = [
    {
      icon: '⚡',
      title: 'Rapide',
      description: 'Créez une annonce en moins de 5 minutes',
    },
    {
      icon: '🔒',
      title: 'Sécurisé',
      description: 'Vos données sont protégées par le RGPD',
    },
    {
      icon: '🎯',
      title: 'Ciblé',
      description: 'Rejoignez des acheteurs qualifiés',
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'Suivez les vues et les intérêts',
    },
    {
      icon: '💬',
      title: 'Support 24/7',
      description: 'Une équipe prête à vous aider',
    },
    {
      icon: '💰',
      title: '100% Gratuit',
      description: 'Aucun frais caché, zéro commission',
    },
  ];

  // ============================================================================
  // FAQ
  // ============================================================================

  const faqItems = [
    {
      question: 'Combien de temps prend la création d\'une annonce?',
      answer: 'La création d\'une annonce prend environ 5 à 10 minutes. Vous devez remplir les informations essentielles: adresse, titre, photos, caractéristiques et vos coordonnées.',
    },
    {
      question: 'Mes données sont-elles sécurisées?',
      answer: 'Oui! Toutes vos données personnelles sont chiffrées et protégées conformément à la réglementation RGPD. Nous ne les partagerons jamais sans votre consentement.',
    },
    {
      question: 'Y a-t-il des frais pour créer une annonce?',
      answer: 'Non! Créer une annonce est 100% gratuit. Il n\'y a aucun frais caché, aucune commission. Vous pouvez créer autant d\'annonces que vous souhaitez.',
    },
    {
      question: 'Puis-je modifier mon annonce après l\'avoir publiée?',
      answer: 'Bien sûr! Vous pouvez modifier, mettre à jour ou supprimer votre annonce à tout moment depuis votre tableau de bord.',
    },
    {
      question: 'Comment contacter un acheteur intéressé?',
      answer: 'Les acheteurs peuvent vous contacter directement via votre formulaire de contact. Vous recevrez une notification et un email avec leurs coordonnées.',
    },
    {
      question: 'Que se passe-t-il quand je vends mon bien?',
      answer: 'Une fois votre bien vendu, vous pouvez marquer votre annonce comme "vendue". Cela la retire de la recherche publique et notifie les acheteurs intéressés.',
    },
  ];

  return (
    <Box sx={{ bgcolor: '#f9f9f9' }}>
      {/* ========================================================================
          HERO SECTION
          ======================================================================== */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 6, sm: 10, md: 12 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            sx={{
              display: 'inline-block',
              px: 2,
              py: 1,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              mb: 2,
              fontSize: '0.9rem',
            }}
          >
            ✨ Plateforme Immobilière Révolutionnaire
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
              lineHeight: 1.2,
            }}
          >
            Vendez votre bien simplement
          </Typography>

          <Typography
            variant="h6"
            sx={{
              mb: 4,
              opacity: 0.95,
              fontSize: { xs: '1rem', sm: '1.2rem' },
              fontWeight: 300,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Créez une annonce en moins de 5 minutes. Rejoignez des milliers de vendeurs satisfaits.
          </Typography>

          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: '#667eea',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: '#f0f0f0',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              },
              transition: 'all 0.3s',
            }}
            onClick={() => navigate('/creer-annonce/etape1')}
          >
            🎉 Créer une annonce →
          </Button>

          <Typography
            variant="body2"
            sx={{
              mt: 2,
              opacity: 0.8,
              fontSize: '0.9rem',
            }}
          >
            Sans engagement · 100% gratuit · Aucune commission
          </Typography>
        </Container>
      </Box>

      {/* ========================================================================
          FORMULAIRE MULTI-ÉTAPES (affiché quand showForm = true)
          ======================================================================== */}
      {showForm && (
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Créer une annonce
              </Typography>

              {/* Stepper */}
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Contenu des étapes */}
              <Box sx={{ mb: 4, minHeight: '300px' }}>
                {activeStep === 0 && <Step1Content />}
                {activeStep === 1 && <Step2Content />}
                {activeStep === 2 && <Step3Content />}
              </Box>

              {/* Boutons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Retour
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  size="large"
                  sx={{ minWidth: 150 }}
                >
                  {activeStep === steps.length - 1 ? '✓ Enregistrer' : 'Suivant →'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      )}

      {/* ========================================================================
          FEATURES / AVANTAGES
          ======================================================================== */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          sx={{
            textAlign: 'center',
            mb: 1,
            fontWeight: 700,
            fontSize: { xs: '1.8rem', sm: '2.5rem' },
          }}
        >
          Pourquoi choisir Immo2000?
        </Typography>
        <Typography
          variant="body1"
          sx={{
            textAlign: 'center',
            mb: 6,
            color: '#666',
            fontSize: '1.1rem',
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          Une plateforme complète pour vendre votre bien en toute confiance
        </Typography>

        <Grid container spacing={3}>
          {features.map((feature, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card
                sx={{
                  h: '100%',
                  boxShadow: 'none',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box sx={{ fontSize: '3rem', mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ========================================================================
          TESTIMONIALS
          ======================================================================== */}
      <Container maxWidth="lg" sx={{ py: 8, bgcolor: '#f9f9f9' }}>
        <Typography
          variant="h3"
          sx={{
            textAlign: 'center',
            mb: 1,
            fontWeight: 700,
            fontSize: { xs: '1.8rem', sm: '2.5rem' },
          }}
        >
          Ils nous font confiance
        </Typography>
        <Typography
          variant="body1"
          sx={{
            textAlign: 'center',
            mb: 6,
            color: '#666',
            fontSize: '1.1rem',
          }}
        >
          Découvrez les avis de nos utilisateurs
        </Typography>

        <Grid container spacing={3}>
          {testimonials.map((testimonial, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Card
                sx={{
                  h: '100%',
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                {/* Rating */}
                <Box sx={{ mb: 2 }}>
                  <Rating value={testimonial.rating} readOnly size="small" />
                </Box>

                {/* Text */}
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: '#666', lineHeight: 1.6, fontStyle: 'italic' }}
                >
                  "{testimonial.text}"
                </Typography>

                {/* Avatar + Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ fontSize: '2rem' }}>{testimonial.avatar}</Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {testimonial.role}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ========================================================================
          FAQ
          ======================================================================== */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          sx={{
            textAlign: 'center',
            mb: 1,
            fontWeight: 700,
            fontSize: { xs: '1.8rem', sm: '2.5rem' },
          }}
        >
          Questions fréquentes
        </Typography>
        <Typography
          variant="body1"
          sx={{
            textAlign: 'center',
            mb: 6,
            color: '#666',
            fontSize: '1.1rem',
          }}
        >
          Trouvez les réponses à vos questions
        </Typography>

        <Box sx={{ maxWidth: '700px', mx: 'auto' }}>
          {faqItems.map((item, idx) => (
            <Accordion
              key={idx}
              expanded={expandedFaq === idx}
              onChange={() => setExpandedFaq(expandedFaq === idx ? -1 : idx)}
              sx={{
                mb: 1,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ fontWeight: 600, color: '#333' }}>
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>

      {/* ========================================================================
          FINAL CTA
          ======================================================================== */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h3"
            sx={{
              mb: 2,
              fontWeight: 700,
              fontSize: { xs: '1.8rem', sm: '2.5rem' },
            }}
          >
            Prêt à vendre votre bien?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              opacity: 0.95,
              fontSize: '1.1rem',
            }}
          >
            Créez votre annonce maintenant et rejoignez des milliers de vendeurs heureux.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: '#667eea',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: '#f0f0f0',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              },
              transition: 'all 0.3s',
            }}
            onClick={() => setShowForm(true)}
          >
            Commencer gratuitement →
          </Button>
        </Container>
      </Box>

      {/* ========================================================================
          FOOTER
          ======================================================================== */}
      <Box sx={{ bgcolor: '#f5f5f5', py: 4, borderTop: '1px solid #e0e0e0' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
            © 2026 Immo2000. Tous droits réservés. · CGU · Politique de confidentialité
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
