import { useCallback, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import apiClient from '../services/api/client';

/**
 * useFeedback - Hook for managing visit feedback
 * Handles fetching, creating, and responding to feedback
 */
export function useFeedback() {
  const { addNotification } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [feedbackDetail, setFeedbackDetail] = useState(null);

  /**
   * Fetch all feedback for a vendor
   */
  const fetchVendorFeedbacks = useCallback(async (limit = 50) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/v1/visites/vendeur/feedbacks', {
        params: { limit },
      });
      setFeedback(response.data.data || []);
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors du chargement des feedbacks';
      setError(message);
      addNotification('error', message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Fetch feedback for a specific visit
   */
  const fetchFeedback = useCallback(async (visitId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/v1/visites/${visitId}/feedback`);
      setFeedbackDetail(response.data.data);
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors du chargement du feedback';
      setError(message);
      addNotification('error', message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Submit feedback for a visit (by buyer)
   */
  const submitFeedback = useCallback(
    async (visitId, feedbackData) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.post(`/api/v1/visites/${visitId}/feedback`, feedbackData);
        addNotification('success', 'Feedback envoyé avec succès');
        return response.data.data;
      } catch (err) {
        const message = err.response?.data?.detail || 'Erreur lors de l\'envoi du feedback';
        setError(message);
        addNotification('error', message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Respond to feedback (by seller/vendor)
   */
  const respondToFeedback = useCallback(
    async (visitId, response) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.put(`/api/v1/visites/${visitId}/feedback`, {
          response,
        });
        addNotification('success', 'Réponse envoyée avec succès');
        return result.data.data;
      } catch (err) {
        const message = err.response?.data?.detail || 'Erreur lors de l\'envoi de la réponse';
        setError(message);
        addNotification('error', message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Delete feedback
   */
  const deleteFeedback = useCallback(
    async (visitId) => {
      setLoading(true);
      setError(null);
      try {
        await apiClient.delete(`/api/v1/visites/${visitId}`);
        addNotification('success', 'Feedback supprimé');
        // Remove from list
        setFeedback((prev) => prev.filter((f) => f.visite_id !== visitId));
        return true;
      } catch (err) {
        const message = err.response?.data?.detail || 'Erreur lors de la suppression';
        setError(message);
        addNotification('error', message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addNotification]
  );

  /**
   * Mark feedback as responded
   */
  const markAsResponded = useCallback(
    async (visitId) => {
      setLoading(true);
      try {
        // Update local state optimistically
        setFeedback((prev) =>
          prev.map((f) => (f.visite_id === visitId ? { ...f, responded: true } : f))
        );
        return true;
      } catch (err) {
        addNotification('error', 'Erreur lors de la mise à jour');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addNotification]
  );

  return {
    feedback,
    feedbackDetail,
    loading,
    error,
    fetchVendorFeedbacks,
    fetchFeedback,
    submitFeedback,
    respondToFeedback,
    deleteFeedback,
    markAsResponded,
  };
}
