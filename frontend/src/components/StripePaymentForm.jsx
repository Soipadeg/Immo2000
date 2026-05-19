/**
 * Composant pour le formulaire de paiement Stripe
 * Encapsule la logique Stripe avec CardElement
 */

import React, { useState, useRef } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Grid,
} from '@mui/material';
import { STRIPE_CARD_ELEMENT_OPTIONS } from '../config/stripe-config';

export default function StripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onError,
  isProcessing = false,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardEmail, setCardEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe non disponible');
      return;
    }

    if (!clientSecret) {
      setError('PaymentIntent non valide');
      return;
    }

    if (!cardName.trim()) {
      setError('Veuillez entrer le nom du titulaire');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Créer un PaymentMethod depuis le CardElement
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
        billing_details: {
          name: cardName,
          email: cardEmail,
        },
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message);
        onError?.(paymentMethodError.message);
        setProcessing(false);
        return;
      }

      // Confirmer le paiement avec le clientSecret
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) {
        setError(confirmError.message);
        onError?.(confirmError.message);
        setProcessing(false);
        return;
      }

      // Paiement réussi
      if (paymentIntent.status === 'succeeded') {
        onSuccess?.({
          paymentIntentId: paymentIntent.id,
          chargeId: paymentIntent.charges.data[0]?.id,
          amount: paymentIntent.amount / 100, // Convertir cents en euros
        });
      } else {
        setError(`État du paiement: ${paymentIntent.status}`);
        onError?.(`État du paiement: ${paymentIntent.status}`);
      }
    } catch (err) {
      console.error('Erreur Stripe:', err);
      setError('Erreur lors du paiement');
      onError?.('Erreur lors du paiement');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Nom du titulaire"
            placeholder="Jean Dupont"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            disabled={processing || isProcessing}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            placeholder="jean@example.com"
            value={cardEmail}
            onChange={(e) => setCardEmail(e.target.value)}
            disabled={processing || isProcessing}
          />
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: error ? 'error.main' : 'divider',
              borderRadius: 1,
              backgroundColor: '#fafafa',
            }}
          >
            <CardElement
              options={STRIPE_CARD_ELEMENT_OPTIONS}
              onChange={(e) => {
                if (e.error) {
                  setError(e.error.message);
                } else {
                  setError('');
                }
              }}
            />
          </Box>
        </Grid>
      </Grid>

      <Button
        fullWidth
        variant="contained"
        color="success"
        size="large"
        type="submit"
        disabled={!stripe || processing || isProcessing || !cardName}
      >
        {processing || isProcessing ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Traitement...
          </>
        ) : (
          `Payer ${amount?.toLocaleString('fr-FR')} €`
        )}
      </Button>

      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'info.lighter', borderRadius: 1 }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          <strong>Test:</strong> Utilisez 4242 4242 4242 4242 pour un succès, 4000 0000 0000 0002 pour un échec.
        </p>
      </Box>
    </Box>
  );
}
