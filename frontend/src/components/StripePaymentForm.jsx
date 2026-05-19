/**
 * Composant pour le formulaire de paiement Stripe
 * Encapsule la logique Stripe avec CardElement
 */

import React, { useState, useRef } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button, Alert } from '@/components';
import { STRIPE_CARD_ELEMENT_OPTIONS } from '../config/stripe-config';
import './StripePaymentForm.css';

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
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      {error && (
        <Alert type="error">{error}</Alert>
      )}

      <div className="stripe-payment-form__input-group">
        <label htmlFor="cardName">Nom du titulaire</label>
        <input
          id="cardName"
          type="text"
          className="stripe-payment-form__input"
          placeholder="Jean Dupont"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          disabled={processing || isProcessing}
          required
        />
      </div>

      <div className="stripe-payment-form__input-group">
        <label htmlFor="cardEmail">Email</label>
        <input
          id="cardEmail"
          type="email"
          className="stripe-payment-form__input"
          placeholder="jean@example.com"
          value={cardEmail}
          onChange={(e) => setCardEmail(e.target.value)}
          disabled={processing || isProcessing}
        />
      </div>

      <div className={`stripe-payment-form__card-element ${error ? 'error' : ''}`}>
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
      </div>

      <Button
        type="submit"
        variant="contained"
        disabled={!stripe || processing || isProcessing || !cardName}
        className="stripe-payment-form__button"
      >
        {processing || isProcessing ? (
          <span>Traitement en cours...</span>
        ) : (
          `Payer ${amount?.toLocaleString('fr-FR')} €`
        )}
      </Button>

      <div className="stripe-payment-form__info">
        <p>
          <strong>Test:</strong> Utilisez 4242 4242 4242 4242 pour un succès, 4000 0000 0000 0002 pour un échec.
        </p>
      </div>
    </form>
  );
}
