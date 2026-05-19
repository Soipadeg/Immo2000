/**
 * API endpoints pour les transactions notariales et paiements
 * Phase 4 - Parcours de vente complète
 */

import apiClient from './client';

/**
 * Transactions notariales
 */
export const transactionsApi = {
  /**
   * Lister les transactions de l'utilisateur
   */
  list: (filters = {}) =>
    apiClient.get('/api/v1/transactions', { params: filters }),

  /**
   * Récupérer une transaction
   */
  getById: (transactionId) =>
    apiClient.get(`/api/v1/transactions/${transactionId}`),

  /**
   * Sélectionner un notaire pour une transaction
   */
  selectNotaire: (transactionId, notaireId) =>
    apiClient.post(`/api/v1/transactions/${transactionId}/notaire`, {
      notaire_id: notaireId,
    }),

  /**
   * Valider les frais notaire
   */
  validateFees: (transactionId, data) =>
    apiClient.post(`/api/v1/transactions/${transactionId}/frais/valider`, data),

  /**
   * Calculer les frais totaux
   */
  calculateFees: (transactionId) =>
    apiClient.get(`/api/v1/transactions/${transactionId}/calcul-frais`),

  /**
   * Signer le compromis
   */
  signComromis: (transactionId) =>
    apiClient.post(`/api/v1/transactions/${transactionId}/compromis/sign`, {}),

  /**
   * Signer l'acte authentique
   */
  signActe: (transactionId) =>
    apiClient.post(`/api/v1/transactions/${transactionId}/acte/sign`, {}),
};

/**
 * Paiements (Stripe)
 */
export const paymentsApi = {
  /**
   * Créer un paiement (PaymentIntent)
   */
  create: (data) =>
    apiClient.post('/api/v1/paiements', data),

  /**
   * Récupérer les détails d'un paiement
   */
  getById: (paiementId) =>
    apiClient.get(`/api/v1/paiements/${paiementId}`),

  /**
   * Confirmer un paiement après succès Stripe
   */
  confirm: (paiementId, data = {}) =>
    apiClient.post(`/api/v1/paiements/${paiementId}/confirmer`, data),

  /**
   * Enregistrer un paiement échoué
   */
  recordFailure: (paiementId, data = {}) =>
    apiClient.post(`/api/v1/paiements/${paiementId}/echec`, data),

  /**
   * Lister les paiements d'une transaction
   */
  listForTransaction: (transactionId) =>
    apiClient.get(`/api/v1/paiements/transaction/${transactionId}`),

  /**
   * Effectuer un remboursement
   */
  refund: (paiementId, data = {}) =>
    apiClient.post(`/api/v1/paiements/${paiementId}/remboursement`, data),
};

/**
 * Notaires
 */
export const notairesApi = {
  /**
   * Lister les notaires disponibles (optionnel - si endpoint existe)
   */
  list: (filters = {}) =>
    apiClient.get('/api/v1/notaires', { params: filters }),

  /**
   * Récupérer un notaire
   */
  getById: (notaireId) =>
    apiClient.get(`/api/v1/notaires/${notaireId}`),

  /**
   * Rechercher notaires par zone géographique
   */
  searchByLocation: (codePostal) =>
    apiClient.get('/api/v1/notaires/search', {
      params: { code_postal: codePostal },
    }),
};
