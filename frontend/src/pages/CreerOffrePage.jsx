/**
 * Page de création d'une offre d'achat
 * Appelée depuis MesRendezVous avec ?annonce_id=X
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { offresApi, annoncesApi } from '../services/api';
import { Button, Alert, Input } from '@/components';
import '../styles/CreerOffrePage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/CreerOffrePage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/CreerOffrePage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/CreerOffrePage.css';





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
      <div>
        <div>
          <div />
        </div>
      </div>
    );
  }

  if (!annonce) {
    return (
      <div>
        <Alert severity="error">Annonce non trouvée</Alert>
      </div>
    );
  }

  const prixMin = annonce.prix * 0.8; // -20%
  const prixMax = annonce.prix * 1.2; // +20%

  return (
    <div maxWidth="md">
      <h4 variant="h4" gutterBottom>
        Faire une offre d'achat
      </h4>

      {error && <Alert severity="error">{error}</Alert>}

      <Stepper activeStep={activeStep}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <div>
        <div>
          {activeStep === 0 && (
            <div>
              <h6 variant="h6" gutterBottom>
                Récapitulatif du bien
              </h6>
              <div container spacing={2}>
                <div item xs={12}>
                  <p variant="subtitle2" color="textSecondary">
                    Titre
                  </h4>
                  <p variant="body1">{annonce.titre}</h6>
                </div>
                <div item xs={12} sm={6}>
                  <p variant="subtitle2" color="textSecondary">
                    Localisation
                  </h4>
                  <p variant="body1">
                    {annonce.adresse}, {annonce.code_postal} {annonce.ville}
                  </h6>
                </div>
                <div item xs={12} sm={6}>
                  <p variant="subtitle2" color="textSecondary">
                    Prix demandé
                  </h4>
                  <p variant="body1">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(annonce.prix)}
                  </h6>
                </div>
                <div item xs={12} sm={6}>
                  <p variant="subtitle2" color="textSecondary">
                    Surface
                  </p>
                  <p variant="body1">
                    {annonce.surface_habitable} m²
                  </p>
                </div>
                <div item xs={12} sm={6}>
                  <p variant="subtitle2" color="textSecondary">
                    Pièces
                  </p>
                  <p variant="body1">
                    {annonce.nombre_pieces}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div>
              <h6 variant="h6" gutterBottom>
                Quel est votre offre ?
              </h6>
              <p variant="body2" color="textSecondary">
                Recommandation: entre {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(prixMin)} et {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(prixMax)}
              </h6>
              <Input
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
            </div>
          )}

          {activeStep === 2 && (
            <div>
              <h6 variant="h6" gutterBottom>
                Message au vendeur
              </h6>
              <p variant="body2" color="textSecondary">
                Présentez votre projet, posez des questions, etc. (Optionnel)
              </h6>
              <Input
                fullWidth
                multiline
                rows={6}
                label="Votre message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Bonjour, je suis très intéressé par ce bien..."
              />
            </div>
          )}

          {activeStep === 3 && (
            <div>
              <h6 variant="h6" gutterBottom>
                Récapitulatif de votre offre
              </h6>
              <div container spacing={2}>
                <div item xs={12}>
                  <div variant="outlined">
                    <div>
                      <p color="textSecondary">Bien</h6>
                      <p variant="body1">{annonce.titre}</h6>
                    </div>
                  </div>
                </div>
                <div item xs={6}>
                  <div variant="outlined">
                    <div>
                      <p color="textSecondary">Prix demandé</h6>
                      <h6 variant="h6">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(annonce.prix)}
                      </h6>
                    </div>
                  </div>
                </div>
                <div item xs={6}>
                  <div variant="outlined">
                    <div>
                      <p color="textSecondary">Votre offre</h6>
                      <h6 variant="h6" color="primary">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(formData.prix_propose || 0)}
                      </h6>
                    </div>
                  </div>
                </div>
                {formData.message && (
                  <div item xs={12}>
                    <div variant="outlined">
                      <div>
                        <p color="textSecondary">Message</h6>
                        <p variant="body2">
                          {formData.message}
                        </h6>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
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
            {submitting ? <div size={24} /> : activeStep === steps.length - 1 ? 'Envoyer l\'offre' : 'Suivant'}
          </Button>
        </div>
      </div>
    </div>
  );
}
