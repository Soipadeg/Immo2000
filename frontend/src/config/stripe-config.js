/**
 * Configuration Stripe
 * Initialisation et options pour Stripe.js
 */

export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_demo';

export const stripePromise = typeof window !== 'undefined' && window.Stripe
  ? Promise.resolve(window.Stripe(STRIPE_PUBLIC_KEY))
  : null;

export const STRIPE_CARD_ELEMENT_OPTIONS = {
  base: {
    color: '#32325d',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    '::placeholder': {
      color: '#aab7c4',
    },
  },
  invalid: {
    color: '#fa755a',
    iconColor: '#fa755a',
  },
};

export const STRIPE_PAYMENT_METHOD_OPTIONS = {
  billing_details: {
    name: null,
    email: null,
    phone: null,
  },
};
