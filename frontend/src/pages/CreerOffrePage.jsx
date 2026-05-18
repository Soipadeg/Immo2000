/**
 * Page de création d'une offre d'achat
 * Appelée depuis MesRendezVous avec ?annonce_id=X
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { offresApi, annoncesApi } from '../services/api';

const steps = ['Information', 'Prix', 'Message', 'Confirmation'];

export default function CreerOffrePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const annonceId = searchParams.get('annonce_id');

  const [activeStep, setActiveStep] = useState(0);
  const [annonce, setAnnonce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    prix_propose: '',
    message: '',
  });

  // Charger les infos de l'annonce
  useEffect(() => {
    const loadAnnonce = async () => {
      try {
        if (!annonceId) {
          setError('Annonce non spécifiée');
          return;
        }
        const res = await annoncesApi.getById(annonceId);
        setAnnonce(res.data);
      } catch (err) {
        setError('Erreur lors du chargement de l\'annonce');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAnnonce();
  }, [annonceId]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await offresApi.create({
        annonce_id: parseInt(annonceId),
        prix_propose: parseFloat(formData.prix_propose),
        message: formData.message || null,
      });

      // Redirection vers la page des offres avec message de succès
      navigate('/offres?created=true');
    } catch (err) {
      setError('Erreur lors de la création de l\'offre');
      console.error(err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!annonce) {
    return (
      <Container>
        <Alert severity="error">Annonce non trouvée</Alert>
      </Container>
    );
  }

  const prixMin = annonce.prix * 0.8; // -20%
  const prixMax = annonce.prix * 1.2; // +20%

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Faire une offre d'achat
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent>
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Récapitulatif du bien
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Titre
                  </Typography>
                  <Typography variant="body1">{annonce.titre}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Localisation
                  </Typography>
                  <Typography variant="body1">
                    {annonce.adresse}, {annonce.code_postal} {annonce.ville}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Prix demandé
                  </Typography>
                  <Typography variant="body1">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(annonce.prix)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Surface
                  </Typography>
                  <Typography variant="body1">
                    {annonce.surface_habitable} m²
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Pièces
                  </Typography>
                  <Typography variant="body1">
                    {annonce.nombre_pieces}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Quel est votre offre ?
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Recommandation: entre {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(prixMin)} et {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(prixMax)}
              </Typography>
              <TextField
                fullWidth
                label="Prix proposé (€)"
                type="number"
                name="prix_propose"
                value={formData.prix_propose}
                onChange={handleInputChange}
                inputProps={{ step: '1000' }}
                helperText={
                  formData.prix_propose
                    ? `${((formData.prix_propose / annonce.prix - 1) * 100).toFixed(1)}% du prix demandé`
                    : ''
                }
              />
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Message au vendeur
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Présentez votre projet, posez des questions, etc. (Optionnel)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Votre message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Bonjour, je suis très intéressé par ce bien..."
              />
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Récapitulatif de votre offre
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="textSecondary">Bien</Typography>
                      <Typography variant="body1">{annonce.titre}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="textSecondary">Prix demandé</Typography>
                      <Typography variant="h6">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(annonce.prix)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="textSecondary">Votre offre</Typography>
                      <Typography variant="h6" color="primary">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(formData.prix_propose || 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                {formData.message && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary">Message</Typography>
                        <Typography variant="body2">
                          {formData.message}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            disabled={activeStep === 0 || submitting}
            onClick={handleBack}
          >
            Précédent
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              submitting ||
              (activeStep === 1 && !formData.prix_propose)
            }
          >
            {submitting ? <CircularProgress size={24} /> : activeStep === steps.length - 1 ? 'Envoyer l\'offre' : 'Suivant'}
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
}
