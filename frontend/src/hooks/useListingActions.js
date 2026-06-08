import { useState, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { annoncesApi } from '../services/api';

/**
 * Hook pour gérer les actions sur les annonces
 * (publish, archive, mark as sold, delete)
 */
export const useListingActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotificationStore();

  /**
   * Publier une annonce
   */
  const publishListing = useCallback(async (listingId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await annoncesApi.publish(listingId);
      showNotification('Annonce publiée avec succès', 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de la publication';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Dépublier une annonce
   */
  const unpublishListing = useCallback(async (listingId) => {
    try {
      setLoading(true);
      setError(null);
      // Dépublier = archiver pour utiliser l'endpoint existant
      const response = await annoncesApi.archive(listingId);
      showNotification('Annonce dépubliée', 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de la dépublication';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Archiver une annonce
   */
  const archiveListing = useCallback(async (listingId, reason = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await annoncesApi.archive(listingId, { reason });
      showNotification('Annonce archivée', 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de l\'archivage';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Marquer une annonce comme vendue
   */
  const markAsSold = useCallback(async (listingId, saleData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await annoncesApi.sell(listingId, saleData);
      showNotification('Annonce marquée comme vendue', 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de la mise à jour';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Supprimer une annonce
   */
  const deleteListing = useCallback(async (listingId) => {
    try {
      setLoading(true);
      setError(null);
      await annoncesApi.delete(listingId);
      showNotification('Annonce supprimée', 'success');
      return true;
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
   * Réduplier une annonce (depuis archives)
   */
  const relistListing = useCallback(async (listingId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await annoncesApi.publish(listingId);
      showNotification('Annonce remise en ligne', 'success');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de la republication';
      setError(message);
      showNotification(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  return {
    loading,
    error,
    publishListing,
    unpublishListing,
    archiveListing,
    markAsSold,
    deleteListing,
    relistListing,
  };
};

export default useListingActions;
