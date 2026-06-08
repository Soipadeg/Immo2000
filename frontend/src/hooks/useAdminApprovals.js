import { useState, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import apiClient from '../services/api/client';

/**
 * Hook pour gérer les approbations admin
 * (listings, transactions, rejections)
 */
export const useAdminApprovals = () => {
  const [pendingListings, setPendingListings] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotificationStore();

  /**
   * Récupérer les annonces en attente d'approbation
   */
  const fetchPendingListings = useCallback(async (limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/v1/admin/listings/pending', {
        params: { limit },
      });
      setPendingListings(response.data || []);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors du chargement des annonces';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Approbation d'une annonce
   */
  const approveListing = useCallback(async (listingId, notes = '') => {
    try {
      setLoading(true);
      const response = await apiClient.post(
        `/api/v1/admin/listings/${listingId}/approve`,
        { admin_notes: notes }
      );
      // Retirer de la liste pending
      setPendingListings(prev => prev.filter(l => l.id !== listingId));
      showNotification('Annonce approuvée', 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de l\'approbation';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Rejet d'une annonce
   */
  const rejectListing = useCallback(async (listingId, reason, message = '') => {
    try {
      setLoading(true);
      const response = await apiClient.post(
        `/api/v1/admin/listings/${listingId}/reject`,
        {
          reason,
          message,
        }
      );
      // Retirer de la liste pending
      setPendingListings(prev => prev.filter(l => l.id !== listingId));
      showNotification('Annonce rejetée', 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors du rejet';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Suppression d'une annonce par admin
   */
  const removeListing = useCallback(async (listingId, reason = '') => {
    try {
      setLoading(true);
      const response = await apiClient.post(
        `/api/v1/admin/listings/${listingId}/remove`,
        { reason }
      );
      setPendingListings(prev => prev.filter(l => l.id !== listingId));
      showNotification('Annonce supprimée', 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de la suppression';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Récupérer les transactions en attente
   */
  const fetchPendingTransactions = useCallback(async (limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/v1/admin/transactions/pending', {
        params: { limit },
      });
      setPendingTransactions(response.data || []);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors du chargement des transactions';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Accepter une transaction
   */
  const acceptTransaction = useCallback(async (transactionId, notes = '') => {
    try {
      setLoading(true);
      const response = await apiClient.post(
        `/api/v1/admin/transactions/${transactionId}/accept`,
        { notes }
      );
      setPendingTransactions(prev => prev.filter(t => t.id !== transactionId));
      showNotification('Transaction acceptée', 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de l\'acceptation';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Décliner une transaction
   */
  const declineTransaction = useCallback(async (transactionId, reason, message = '') => {
    try {
      setLoading(true);
      const response = await apiClient.post(
        `/api/v1/admin/transactions/${transactionId}/decline`,
        { reason, message }
      );
      setPendingTransactions(prev => prev.filter(t => t.id !== transactionId));
      showNotification('Transaction déclinée', 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors du déclin';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Annuler une transaction
   */
  const cancelTransaction = useCallback(async (transactionId, reason = '') => {
    try {
      setLoading(true);
      const response = await apiClient.post(
        `/api/v1/admin/transactions/${transactionId}/cancel`,
        { reason }
      );
      setPendingTransactions(prev => prev.filter(t => t.id !== transactionId));
      showNotification('Transaction annulée', 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de l\'annulation';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Récupérer détails d'une transaction
   */
  const getTransaction = useCallback(async (transactionId) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/v1/admin/transactions/${transactionId}`);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors du chargement';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    pendingListings,
    pendingTransactions,
    loading,
    error,
    fetchPendingListings,
    approveListing,
    rejectListing,
    removeListing,
    fetchPendingTransactions,
    acceptTransaction,
    declineTransaction,
    cancelTransaction,
    getTransaction,
  };
};

export default useAdminApprovals;
