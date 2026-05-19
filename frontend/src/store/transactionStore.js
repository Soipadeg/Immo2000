/**
 * Zustand Store pour la gestion d'état globale
 * Gère les données partagées entre les pages du parcours de vente
 *
 * Phase 5.2.4 - State Management Refactoring
 */

import { create } from 'zustand';
import { transactionsApi } from '../services/api/transactions';

export const useTransactionStore = create((set, get) => ({
  // État
  transaction: null,
  paiement: null,
  selectedNotaire: null,
  loading: false,
  error: null,
  successMessage: null,

  // Actions - Transaction
  setTransaction: (transaction) => set({ transaction }),

  loadTransaction: async (transactionId) => {
    set({ loading: true, error: null });
    try {
      const res = await transactionsApi.getById(transactionId);
      set({ transaction: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  clearTransaction: () => set({ transaction: null }),

  // Actions - Paiement
  setPayment: (paiement) => set({ paiement }),

  clearPayment: () => set({ paiement: null }),

  // Actions - Notaire Sélectionné
  setSelectedNotaire: (notaire) => set({ selectedNotaire: notaire }),

  clearSelectedNotaire: () => set({ selectedNotaire: null }),

  // Actions - UI State
  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  setSuccessMessage: (message) => set({ successMessage: message }),

  clearSuccessMessage: () => set({ successMessage: null }),

  // Actions - Reset All
  resetStore: () =>
    set({
      transaction: null,
      paiement: null,
      selectedNotaire: null,
      loading: false,
      error: null,
      successMessage: null,
    }),

  // Selectors
  getTransactionId: () => get().transaction?.transaction_id,

  hasTransaction: () => get().transaction !== null,

  hasPayment: () => get().paiement !== null,

  hasSelectedNotaire: () => get().selectedNotaire !== null,
}));

/**
 * Hook personnalisé pour accéder aux données de transaction
 * Utilise Zustand pour éviter les re-renders inutiles
 */
export const useTransaction = () => {
  const transaction = useTransactionStore((state) => state.transaction);
  const setTransaction = useTransactionStore((state) => state.setTransaction);
  const clearTransaction = useTransactionStore((state) => state.clearTransaction);

  return { transaction, setTransaction, clearTransaction };
};

/**
 * Hook personnalisé pour accéder aux données de paiement
 */
export const usePayment = () => {
  const paiement = useTransactionStore((state) => state.paiement);
  const setPaiement = useTransactionStore((state) => state.setPayment);
  const clearPaiement = useTransactionStore((state) => state.clearPayment);

  return { paiement, setPaiement, clearPaiement };
};

/**
 * Hook personnalisé pour accéder au notaire sélectionné
 */
export const useSelectedNotaire = () => {
  const selectedNotaire = useTransactionStore((state) => state.selectedNotaire);
  const setSelectedNotaire = useTransactionStore((state) => state.setSelectedNotaire);
  const clearSelectedNotaire = useTransactionStore((state) => state.clearSelectedNotaire);

  return { selectedNotaire, setSelectedNotaire, clearSelectedNotaire };
};

/**
 * Hook personnalisé pour accéder à l'état UI (loading, error, success)
 */
export const useUIState = () => {
  const loading = useTransactionStore((state) => state.loading);
  const error = useTransactionStore((state) => state.error);
  const successMessage = useTransactionStore((state) => state.successMessage);
  const setLoading = useTransactionStore((state) => state.setLoading);
  const setError = useTransactionStore((state) => state.setError);
  const clearError = useTransactionStore((state) => state.clearError);
  const setSuccessMessage = useTransactionStore((state) => state.setSuccessMessage);
  const clearSuccessMessage = useTransactionStore((state) => state.clearSuccessMessage);

  return {
    loading,
    error,
    successMessage,
    setLoading,
    setError,
    clearError,
    setSuccessMessage,
    clearSuccessMessage,
  };
};

export default useTransactionStore;
