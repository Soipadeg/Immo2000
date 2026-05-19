/**
 * Schémas de validation Zod pour tous les formulaires
 * Phase 4.3 - React Hook Form
 */

import { z } from 'zod';

/**
 * Validation de login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Email invalide')
    .min(1, 'Email requis'),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .min(6, 'Minimum 6 caractères'),
  rememberMe: z.boolean().optional(),
});

export const loginDefaultValues = {
  email: '',
  password: '',
  rememberMe: false,
};

/**
 * Validation d'inscription
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Email invalide')
    .min(1, 'Email requis'),
  nom: z
    .string()
    .min(1, 'Nom requis')
    .min(2, 'Minimum 2 caractères'),
  prenom: z
    .string()
    .min(1, 'Prénom requis')
    .min(2, 'Minimum 2 caractères'),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins 1 majuscule')
    .regex(/[a-z]/, 'Au moins 1 minuscule')
    .regex(/[0-9]/, 'Au moins 1 chiffre'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmation requise'),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'Vous devez accepter les conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const registerDefaultValues = {
  email: '',
  nom: '',
  prenom: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
};

/**
 * Validation de création d'annonce
 */
export const listingSchema = z.object({
  titre: z
    .string()
    .min(1, 'Titre requis')
    .min(5, 'Minimum 5 caractères')
    .max(100, 'Maximum 100 caractères'),
  description: z
    .string()
    .min(1, 'Description requise')
    .min(20, 'Minimum 20 caractères')
    .max(5000, 'Maximum 5000 caractères'),
  type_bien: z
    .enum(['maison', 'appartement', 'terrain', 'local'], {
      errorMap: () => ({ message: 'Type de bien requis' })
    }),
  surface: z
    .number()
    .min(1, 'Surface requise')
    .refine((val) => val > 0, 'La surface doit être positive'),
  nbr_chambres: z
    .number()
    .min(0, 'Nombre de chambres requis')
    .optional(),
  nbr_salles_bain: z
    .number()
    .min(0, 'Nombre de salles de bain requis')
    .optional(),
  prix: z
    .number()
    .min(1, 'Prix requis')
    .refine((val) => val > 0, 'Le prix doit être positif'),
  adresse: z
    .string()
    .min(1, 'Adresse requise'),
  ville: z
    .string()
    .min(1, 'Ville requise'),
  code_postal: z
    .string()
    .regex(/^\d{5}$/, 'Code postal invalide'),
  statut: z
    .enum(['brouillon', 'publié', 'vendu'], {
      errorMap: () => ({ message: 'Statut requis' })
    })
    .optional(),
});

export const listingDefaultValues = {
  titre: '',
  description: '',
  type_bien: 'appartement',
  surface: 0,
  nbr_chambres: 0,
  nbr_salles_bain: 1,
  prix: 0,
  adresse: '',
  ville: '',
  code_postal: '',
  statut: 'brouillon',
};

/**
 * Validation de message
 */
export const messageSchema = z.object({
  contenu: z
    .string()
    .min(1, 'Message requis')
    .min(3, 'Minimum 3 caractères')
    .max(5000, 'Maximum 5000 caractères'),
});

export const messageDefaultValues = {
  contenu: '',
};

/**
 * Validation d'offre
 */
export const offerSchema = z.object({
  montant: z
    .number()
    .min(1, 'Montant requis')
    .refine((val) => val > 0, 'Le montant doit être positif'),
  message: z
    .string()
    .optional(),
  condition_financement: z
    .enum(['comptant', 'credit', 'autre'], {
      errorMap: () => ({ message: 'Mode de financement requis' })
    }),
  date_signature: z
    .string()
    .refine((val) => new Date(val) > new Date(), 'La date doit être dans le futur')
    .optional(),
});

export const offerDefaultValues = {
  montant: 0,
  message: '',
  condition_financement: 'credit',
  date_signature: '',
};

/**
 * Validation de profil utilisateur
 */
export const profileSchema = z.object({
  email: z
    .string()
    .email('Email invalide'),
  nom: z
    .string()
    .min(1, 'Nom requis')
    .min(2, 'Minimum 2 caractères'),
  prenom: z
    .string()
    .min(1, 'Prénom requis')
    .min(2, 'Minimum 2 caractères'),
  telephone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, 'Numéro de téléphone invalide')
    .optional(),
  role: z
    .enum(['visiteur', 'user', 'admin', 'notaire'], {
      errorMap: () => ({ message: 'Rôle invalide' })
    }),
});

export const profileDefaultValues = {
  email: '',
  nom: '',
  prenom: '',
  telephone: '',
  role: 'user',
};

/**
 * Validation de recherche
 */
export const searchSchema = z.object({
  query: z
    .string()
    .optional(),
  type_bien: z
    .enum(['maison', 'appartement', 'terrain', 'local'])
    .optional(),
  prix_min: z
    .number()
    .min(0, 'Prix minimum invalide')
    .optional(),
  prix_max: z
    .number()
    .min(0, 'Prix maximum invalide')
    .optional(),
  surface_min: z
    .number()
    .min(0, 'Surface minimum invalide')
    .optional(),
  nbr_chambres: z
    .number()
    .min(0, 'Nombre de chambres invalide')
    .optional(),
  ville: z
    .string()
    .optional(),
}).refine((data) => {
  if (data.prix_min && data.prix_max) {
    return data.prix_min <= data.prix_max;
  }
  return true;
}, {
  message: 'Le prix minimum doit être inférieur au prix maximum',
  path: ['prix_max'],
});

export const searchDefaultValues = {
  query: '',
  type_bien: undefined,
  prix_min: undefined,
  prix_max: undefined,
  surface_min: undefined,
  nbr_chambres: undefined,
  ville: '',
};
