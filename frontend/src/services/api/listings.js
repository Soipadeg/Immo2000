/**
 * API endpoints pour les annonces (listings)
 * Phase 4.2 - Centralisation des appels API
 */

import apiClient from './client';

export const listingsApi = {
  /**
   * Créer une nouvelle annonce
   */
  create: (data) =>
    apiClient.post('/annonces', data),

  /**
   * Récupérer toutes les annonces de l'utilisateur
   */
  listUserListings: (skip = 0, limit = 20, filters = {}) =>
    apiClient.get('/annonces', {
      params: {
        skip,
        limit,
        utilisateur_id: localStorage.getItem('user_id'),
        ...filters,
      },
    }),

  /**
   * Récupérer une annonce par ID
   */
  getById: (id) =>
    apiClient.get(`/annonces/${id}`),

  /**
   * Mettre à jour une annonce
   */
  update: (id, data) =>
    apiClient.put(`/annonces/${id}`, data),

  /**
   * Supprimer une annonce
   */
  delete: (id) =>
    apiClient.delete(`/annonces/${id}`),

  /**
   * Publier une annonce
   */
  publish: (id) =>
    apiClient.post(`/annonces/${id}/publier`, {}),

  /**
   * Archiver une annonce
   */
  archive: (id) =>
    apiClient.post(`/annonces/${id}/archiver`, {}),

  /**
   * Marquer une annonce comme vendue
   */
  sell: (id, dateVente = null) =>
    apiClient.post(`/annonces/${id}/vendre`, {
      date_vente: dateVente,
    }),

  /**
   * Lister toutes les annonces (publiques)
   */
  listAll: (skip = 0, limit = 20, filters = {}) =>
    apiClient.get('/annonces', {
      params: {
        skip,
        limit,
        ...filters,
      },
    }),

  /**
   * Chercher des annonces
   */
  search: (query, filters = {}) =>
    apiClient.get('/annonces/search', {
      params: {
        q: query,
        ...filters,
      },
    }),

  /**
   * Récupérer les annonces en vedette
   */
  getFeatured: (limit = 10) =>
    apiClient.get('/annonces/featured', {
      params: { limit },
    }),
};
