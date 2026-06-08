/**
 * Estimations API Service
 * Gère les appels API pour les estimations immobilières via Melo API
 */

import apiClient from './client';

export const estimationsApi = {
  /**
   * Créer une estimation immobilière
   * POST /api/v1/estimations
   */
  create: async (estimationData) => {
    const response = await apiClient.post('/estimations', {
      adresse: estimationData.adresse,
      surface: estimationData.surface,
      type_bien: estimationData.type_bien
    });
    return response.data;
  },

  /**
   * Comparer plusieurs biens
   * POST /api/v1/estimations/compare
   */
  compare: async (biens) => {
    const response = await apiClient.post('/estimations/compare', {
      biens: biens
    });
    return response.data;
  },

  /**
   * Récupérer les estimations de l'utilisateur
   * GET /api/v1/estimations
   */
  list: async () => {
    const response = await apiClient.get('/api/v1/estimations');
    return response.data;
  }
};

export default estimationsApi;
