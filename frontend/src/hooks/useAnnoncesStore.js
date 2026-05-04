/**
 * Hook personnalisé pour gérer l'état des annonces du vendeur
 */

import { create } from 'zustand';
import { annoncesApi } from '../services/api';

/**
 * Store Zustand pour les annonces du vendeur
 */
export const useAnnoncesStore = create((set, get) => ({
  // État
  annonces: [],
  total: 0,
  skip: 0,
  limit: 20,
  loading: false,
  error: null,
  filters: {
    statut: null,
    ville: null,
    type_bien: null,
  },

  // Actions
  /**
   * Charger les annonces du vendeur
   */
  loadAnnonces: async (skip = 0, limit = 20) => {
    set({ loading: true, error: null });
    try {
      const filters = get().filters;
      const response = await annoncesApi.listUserAnnonces(skip, limit, filters);
      set({
        annonces: response.data.items,
        total: response.data.total,
        skip: response.data.skip,
        limit: response.data.limit,
        loading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Erreur lors du chargement des annonces',
        loading: false,
      });
    }
  },

  /**
   * Publier une annonce
   */
  publishAnnonce: async (annonceId) => {
    set({ loading: true, error: null });
    try {
      const response = await annoncesApi.publish(annonceId);
      // Mettre à jour l'annonce dans la liste
      const annonces = get().annonces.map((a) =>
        a.annonce_id === annonceId ? response.data : a
      );
      set({ annonces, loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de la publication';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  /**
   * Archiver une annonce
   */
  archiveAnnonce: async (annonceId) => {
    set({ loading: true, error: null });
    try {
      const response = await annoncesApi.archive(annonceId);
      // Mettre à jour l'annonce dans la liste
      const annonces = get().annonces.map((a) =>
        a.annonce_id === annonceId ? response.data : a
      );
      set({ annonces, loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de l\'archivage';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  /**
   * Marquer une annonce comme vendue
   */
  sellAnnonce: async (annonceId, dateVente = null) => {
    set({ loading: true, error: null });
    try {
      const response = await annoncesApi.sell(annonceId, dateVente);
      // Mettre à jour l'annonce dans la liste
      const annonces = get().annonces.map((a) =>
        a.annonce_id === annonceId ? response.data : a
      );
      set({ annonces, loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de la vente';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  /**
   * Supprimer une annonce
   */
  deleteAnnonce: async (annonceId) => {
    set({ loading: true, error: null });
    try {
      await annoncesApi.delete(annonceId);
      // Supprimer l'annonce de la liste
      const annonces = get().annonces.filter((a) => a.annonce_id !== annonceId);
      set({ annonces, total: get().total - 1, loading: false });
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de la suppression';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  /**
   * Mettre à jour les filtres
   */
  setFilters: (filters) => {
    set({ filters });
  },

  /**
   * Réinitialiser l'erreur
   */
  clearError: () => set({ error: null }),
}));

export default useAnnoncesStore;
