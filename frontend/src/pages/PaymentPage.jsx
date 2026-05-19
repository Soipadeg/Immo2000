/**
 * Page de paiement via Stripe
 * Acheteur effectue le paiement du dépôt de garantie (15% du prix)
 * Intégration complète avec Stripe Elements
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import StripePaymentForm from '../components/StripePaymentForm';
import { stripePromise } from '../config/stripe-config';
import { transactionsApi, paymentsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const steps = ['Confirmation', 'Paiement', 'Succès'];

export default function PaymentPage() {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState(null);
  const [paiement, setPaiement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeStep, setActiveStep] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  // Calculs
  const prixVente = transaction?.prix_compromis || 0;
  const pourcentageDépôt = 0.15;
  const montantDépôt = Math.round(prixVente * pourcentageDépôt);
  const montantSolde = prixVente - montantDépôt;

  // Charger la transaction et créer l'intention de paiement
  useEffect(() => {
    const initPayment = async () => {
      try {
        const txRes = await transactionsApi.getById(transactionId);
        setTransaction(txRes.data);

        // Créer le paiement Stripe (PaymentIntent)
        const payRes = await paymentsApi.create({
          transaction_notaire_id: transactionId,
          montant: txRes.data.prix_compromis * pourcentageDépôt,
          type: 'depot_garantie',
          description: `Dépôt de garantie (15% de ${txRes.data.prix_compromis}€)`,
        });

        setPaiement(payRes.data);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors de l\'initialisation du paiement');
        console.error(err);
        setLoading(false);
      }
    };

    if (transactionId) {
      initPayment();
    }
  }, [transactionId]);

  // Confirmer paiement et avancer
  const handlePaymentSuccess = async (paymentData) => {
    try {
      setActiveStep(2);

      // Confirmer le paiement côté serveur
      await paymentsApi.confirm(paiement.paiement_id, {
        payment_intent_id: paymentData.paymentIntentId,
        charge_id: paymentData.chargeId,
      });

      setPaymentResult(paymentData);
      setSuccessOpen(true);

      // Redirection après 2 secondes
      setTimeout(() => {
        navigate(`/transactions/${transactionId}/sign-acte`);
      }, 2000);
    } catch (err) {
      setError('Erreur lors de la confirmation du paiement');
      console.error(err);
      setActiveStep(1);
    }
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
    setActiveStep(1);
  };

  const handleContinueToPayment = () => {
    if (!agreeTerms) {
      setError('Veuillez accepter les conditions');
      return;
    }
    setError('');
    setActiveStep(1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        💳 Paiement du Dépôt de Garantie
      </Typography>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Étape 0: Confirmation */}
      {activeStep === 0 && (
        <>
          {/* Résumé de la transaction */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography color="textSecondary" gutterBottom>
                    Bien
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {transaction?.annonce?.titre}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography color="textSecondary" gutterBottom>
                    Prix de vente (TTC)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {prixVente?.toLocaleString('fr-FR')} €
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography color="textSecondary" gutterBottom>
                    Dépôt à verser (15%)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {montantDépôt?.toLocaleString('fr-FR')} €
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography color="textSecondary" gutterBottom>
                    Solde futur (85%)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {montantSolde?.toLocaleString('fr-FR')} €
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Divider sx={{ my: 3 }} />

          {/* Conditions */}
          <Card sx={{ mb: 4, bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                ⚠️ Conditions
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    Je confirme que je suis le propriétaire de la carte bancaire utilisée et que j'autorise le
                    prélèvement du montant du dépôt.
                  </Typography>
                }
              />
            </CardContent>
          </Card>

          {/* Boutons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              fullWidth
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleContinueToPayment}
              disabled={!agreeTerms}
              fullWidth
            >
              Continuer
            </Button>
          </Box>
        </>
      )}

      {/* Étape 1: Formulaire de Paiement */}
      {activeStep === 1 && (
        <>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon />
                  <Typography variant="body2">
                    Paiement sécurisé par <strong>Stripe</strong>. Vos données bancaires ne sont jamais partagées avec
                    Immo2000.
                  </Typography>
                </Box>
              </Alert>

              {/* Utiliser Stripe Elements via le composant */}
              {!stripePromise ? (
                <Alert severity="warning">
                  Stripe n'est pas chargé. Assurez-vous que REACT_APP_STRIPE_PUBLIC_KEY est configuré.
                </Alert>
              ) : (
                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    clientSecret={paiement?.client_secret}
                    amount={montantDépôt}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              )}
            </CardContent>
          </Card>

          {/* Bouton retour */}
          <Button
            variant="outlined"
            onClick={() => setActiveStep(0)}
            fullWidth
          >
            ← Retour
          </Button>
        </>
      )}

      {/* Étape 2: Succès */}
      {activeStep === 2 && (
        <Card sx={{ bgcolor: '#e8f5e9', border: '2px solid #4caf50' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main', mb: 2 }}>
              Paiement Réussi! ✅
            </Typography>
            <Typography sx={{ mb: 3 }}>
              Votre dépôt de <strong>{montantDépôt?.toLocaleString('fr-FR')} €</strong> a été reçu avec succès.
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              Vous serez redirigé vers la signature de l'acte authentique dans quelques secondes...
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
