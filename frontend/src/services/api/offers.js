/**
 * API endpoints pour les offres, visites, rendez-vous
 * Phase 4.2 - Centralisation des appels API
 */

import apiClient from './client';

export const offersApi = {
  /**
   * Faire une offre pour une annonce
   */
  create: (annonceId, data) =>
    apiClient.post(`/annonces/${annonceId}/offres`, data),

  /**
   * Lister les offres pour une annonce
   */
  listForAnnonce: (annonceId, skip = 0, limit = 20) =>
    apiClient.get(`/annonces/${annonceId}/offres`, {
      params: { skip, limit },
    }),

  /**
   * Accepter une offre
   */
  accept: (offerId) =>
    apiClient.post(`/offres/${offerId}/accepter`, {}),

  /**
   * Refuser une offre
   */
  reject: (offerId) =>
    apiClient.post(`/offres/${offerId}/refuser`, {}),

  /**
   * Annuler une offre
   */
  cancel: (offerId) =>
    apiClient.post(`/offres/${offerId}/annuler`, {}),
};

export const visitsApi = {
  /**
   * Créer une visite programmée
   */
  create: (data) =>
    apiClient.post('/visites', data),

  /**
   * Lister les visites pour une annonce
   */
  listForAnnonce: (annonceId, skip = 0, limit = 20) =>
    apiClient.get(`/annonces/${annonceId}/visites`, {
      params: { skip, limit },
    }),

  /**
   * Marquer une visite comme confirmée
   */
  confirm: (visitId) =>
    apiClient.post(`/visites/${visitId}/confirmer`, {}),

  /**
   * Marquer une visite comme annulée
   */
  cancel: (visitId) =>
    apiClient.post(`/visites/${visitId}/annuler`, {}),

  /**
   * Ajouter un avis après visite
   */
  addFeedback: (visitId, feedback) =>
    apiClient.post(`/visites/${visitId}/feedback`, feedback),
};

export const appointmentsApi = {
  /**
   * Créer un rendez-vous
   */
  create: (data) =>
    apiClient.post('/rendez_vous', data),

  /**
   * Lister les rendez-vous
   */
  list: (skip = 0, limit = 20, filters = {}) =>
    apiClient.get('/rendez_vous', {
      params: { skip, limit, ...filters },
    }),

  /**
   * Récupérer un rendez-vous
   */
  getById: (id) =>
    apiClient.get(`/rendez_vous/${id}`),

  /**
   * Mettre à jour un rendez-vous
   */
  update: (id, data) =>
    apiClient.put(`/rendez_vous/${id}`, data),

  /**
   * Confirmer un rendez-vous
   */
  confirm: (id) =>
    apiClient.post(`/rendez_vous/${id}/confirmer`, {}),

  /**
   * Annuler un rendez-vous
   */
  cancel: (id) =>
    apiClient.post(`/rendez_vous/${id}/annuler`, {}),
};
