/**
 * Schémas de validation Zod pour les formulaires
 * Utilisés avec React Hook Form
 *
 * Phase 5.2.5 - Form Validation
 */

import { z } from 'zod';

// Messages d'erreur en français
const errorMessages = {
  required: 'Ce champ est requis',
  email: 'Email invalide',
  minLength: (min) => `Minimum ${min} caractères`,
  maxLength: (max) => `Maximum ${max} caractères`,
  pattern: 'Format invalide',
  number: 'Doit être un nombre',
  positive: 'Doit être positif',
};

/**
 * Schéma: Validation du formulaire de sélection de notaire
 */
export const selectNotaireSchema = z.object({
  notaire_id: z.number({
    required_error: errorMessages.required,
  }),
});

/**
 * Schéma: Validation du formulaire de confirmation des frais
 */
export const validateFeesSchema = z.object({
  agree_fees: z.boolean({
    required_error: errorMessages.required,
  }),
});

/**
 * Schéma: Validation du formulaire de signature du compromis
 */
export const signCompromisSchema = z.object({
  agree_terms: z.boolean({
    required_error: 'Vous devez accepter les conditions',
  }),
  agree_irrevocable: z.boolean({
    required_error: 'Vous devez confirmer que vous comprenez le caractère irrévocable',
  }),
});

/**
 * Schéma: Validation du formulaire de signature de l'acte
 */
export const signActeSchema = z.object({
  agree_terms: z.boolean({
    required_error: 'Vous devez accepter les conditions',
  }),
  agree_irrevocable: z.boolean({
    required_error: 'Vous devez confirmer que vous comprenez le caractère irrévocable de cette signature',
  }),
});

/**
 * Schéma: Validation du formulaire de paiement (dépôt)
 */
export const paymentDepositSchema = z.object({
  card_name: z.string({
    required_error: errorMessages.required,
  }).min(2, errorMessages.minLength(2)),

  card_email: z.string({
    required_error: errorMessages.required,
  }).email(errorMessages.email),

  agree_payment: z.boolean({
    required_error: 'Vous devez accepter les conditions de paiement',
  }),
});

/**
 * Schéma: Validation du formulaire de paiement solde
 */
export const paymentBalanceSchema = z.object({
  card_name: z.string({
    required_error: errorMessages.required,
  }).min(2, errorMessages.minLength(2)),

  card_email: z.string({
    required_error: errorMessages.required,
  }).email(errorMessages.email),

  agree_payment: z.boolean({
    required_error: 'Vous devez accepter les conditions de paiement',
  }),
});

/**
 * Schéma: Validation du formulaire de contact
 */
export const contactFormSchema = z.object({
  email: z.string({
    required_error: errorMessages.required,
  }).email(errorMessages.email),

  message: z.string({
    required_error: errorMessages.required,
  }).min(10, errorMessages.minLength(10))
    .max(1000, errorMessages.maxLength(1000)),
});

/**
 * Schéma: Validation du formulaire de recherche
 */
export const searchSchema = z.object({
  query: z.string({
    required_error: errorMessages.required,
  }).min(2, errorMessages.minLength(2))
    .optional()
    .or(z.literal('')),

  location: z.string().optional().or(z.literal('')),

  price_min: z.number().positive(errorMessages.positive).optional(),
  price_max: z.number().positive(errorMessages.positive).optional(),

  bedrooms: z.number().positive(errorMessages.positive).optional(),
});

export default {
  selectNotaireSchema,
  validateFeesSchema,
  signCompromisSchema,
  signActeSchema,
  paymentDepositSchema,
  paymentBalanceSchema,
  contactFormSchema,
  searchSchema,
};
