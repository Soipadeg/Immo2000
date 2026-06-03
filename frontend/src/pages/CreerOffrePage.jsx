import '../styles/CreerOffrePage.css';
import { Alert,Button,Input } from '@/components';
/**
 * Page de création d'une offre d'achat
 * Appelée depuis MesRendezVous avec ?annonce_id=X
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
      <div>
        Faire une offre d'achat
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Stepper activeStep={activeStep}>
        {steps.map((label) => (
          <Step key={label}>
            <div>{label}</div>
          </Step>
        ))}
      </Stepper>

      <div>
        <div>
          {activeStep === 0 && (
            <div>
              <div>
                Récapitulatif du bien
              </div>
              <div container spacing={2}>
                <div item xs={12}>
                  <div>
                    Titre
                  </div>
                  <div>{annonce.titre}</div>
                </div>
                <div item xs={12} sm={6}>
                  <div>
                    Localisation
                  </div>
                  <div>
                    {annonce.adresse}, {annonce.code_postal} {annonce.ville}
                  </div>
                </div>
                <div item xs={12} sm={6}>
                  <div>
                    Prix demandé
                  </div>
                  <div>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(annonce.prix)}
                  </div>
                </div>
                <div item xs={12} sm={6}>
                  <div>
                    Surface
                  </div>
                  <div>
                    {annonce.surface_habitable} m²
                  </div>
                </div>
                <div item xs={12} sm={6}>
                  <div>
                    Pièces
                  </div>
                  <div>
                    {annonce.nombre_pieces}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div>
              <div>
                Quel est votre offre ?
              </div>
              <div>
                Recommandation: entre {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(prixMin)} et {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(prixMax)}
              </div>
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
              <div>
                Message au vendeur
              </div>
              <div>
                Présentez votre projet, posez des questions, etc. (Optionnel)
              </div>
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
              <div>
                Récapitulatif de votre offre
              </div>
              <div container spacing={2}>
                <div item xs={12}>
                  <div>
                    <div>
                      <div>Bien</div>
                      <div>{annonce.titre}</div>
                    </div>
                  </div>
                </div>
                <div item xs={6}>
                  <div>
                    <div>
                      <div>Prix demandé</div>
                      <div>
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(annonce.prix)}
                      </div>
                    </div>
                  </div>
                </div>
                <div item xs={6}>
                  <div>
                    <div>
                      <div>Votre offre</div>
                      <div>
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(formData.prix_propose || 0)}
                      </div>
                    </div>
                  </div>
                </div>
                {formData.message && (
                  <div item xs={12}>
                    <div>
                      <div>
                        <div>Message</div>
                        <div>
                          {formData.message}
                        </div>
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
