import { useState, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import apiClient from '../services/api/client';

/**
 * Hook pour gérer les actions sur les transactions
 * Accept/reject offers, payment status, document signing, timeline
 */
export const useTransactionActions = () => {
  const [transactions, setTransactions] = useState([]);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ skip: 0, limit: 20, total: 0 });
  const { addNotification } = useNotificationStore();

  /**
   * Récupérer les transactions avec filtres
   */
  const fetchTransactions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        skip: params.skip || pagination.skip,
        limit: params.limit || pagination.limit,
        ...(params.status && { status: params.status }),
        ...(params.search && { search: params.search }),
        ...(params.sortBy && { sort_by: params.sortBy }),
      };

      const response = await apiClient.get('/transactions', { params: query });

      if (response.data && response.data.data) {
        setTransactions(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du chargement des transactions';
      setError(message);
      addNotification('error', message);

      // Fallback mockées
      if (process.env.NODE_ENV === 'development') {
        setTransactions(generateMockTransactions());
      }
    } finally {
      setLoading(false);
    }
  }, [pagination, addNotification]);

  /**
   * Récupérer les détails d'une transaction
   */
  const fetchTransactionDetails = useCallback(async (transactionId) => {
    setActionLoading(true);
    try {
      const response = await apiClient.get(`/transactions/${transactionId}`);

      if (response.data && response.data.data) {
        setTransactionDetails(response.data.data);
        setCurrentTransaction(response.data.data);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du chargement des détails';
      addNotification('error', message);

      // Fallback mockées
      if (process.env.NODE_ENV === 'development') {
        setTransactionDetails(generateMockTransactionDetails(transactionId));
      }
    } finally {
      setActionLoading(false);
    }
  }, [addNotification]);

  /**
   * Accepter une offre
   */
  const acceptOffer = useCallback(async (transactionId, offerId) => {
    setActionLoading(true);
    try {
      const response = await apiClient.post(
        `/transactions/${transactionId}/offers/${offerId}/accept`
      );

      if (response.data && response.data.data) {
        // Mettre à jour les transactions
        setTransactions(prev =>
          prev.map(t => t.id === transactionId ? response.data.data : t)
        );
        setCurrentTransaction(response.data.data);
        addNotification('success', 'Offre acceptée avec succès');
        return response.data.data;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'acceptation';
      addNotification('error', message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [addNotification]);

  /**
   * Rejeter une offre
   */
  const rejectOffer = useCallback(async (transactionId, offerId, reason = '') => {
    setActionLoading(true);
    try {
      const response = await apiClient.post(
        `/transactions/${transactionId}/offers/${offerId}/reject`,
        { reason }
      );

      if (response.data && response.data.data) {
        setTransactions(prev =>
          prev.map(t => t.id === transactionId ? response.data.data : t)
        );
        setCurrentTransaction(response.data.data);
        addNotification('success', 'Offre rejetée');
        return response.data.data;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du rejet';
      addNotification('error', message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [addNotification]);

  /**
   * Mettre à jour le statut du paiement
   */
  const updatePaymentStatus = useCallback(async (transactionId, status, details = {}) => {
    setActionLoading(true);
    try {
      const response = await apiClient.put(
        `/transactions/${transactionId}/payment`,
        { status, ...details }
      );

      if (response.data && response.data.data) {
        setTransactions(prev =>
          prev.map(t => t.id === transactionId ? response.data.data : t)
        );
        setCurrentTransaction(response.data.data);
        addNotification('success', 'Statut de paiement mis à jour');
        return response.data.data;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la mise à jour';
      addNotification('error', message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [addNotification]);

  /**
   * Mettre à jour le statut de signature de document
   */
  const updateSigningStatus = useCallback(async (transactionId, documentId, status) => {
    setActionLoading(true);
    try {
      const response = await apiClient.put(
        `/transactions/${transactionId}/documents/${documentId}/sign`,
        { status }
      );

      if (response.data && response.data.data) {
        setCurrentTransaction(response.data.data);
        addNotification('success', 'Document mis à jour');
        return response.data.data;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la mise à jour';
      addNotification('error', message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [addNotification]);

  /**
   * Générer des transactions mockées
   */
  const generateMockTransactions = () => {
    const statuses = ['pending', 'negotiating', 'accepted', 'payment_pending', 'completed'];
    const properties = ['Apt 3 pièces Paris 5e', 'Maison 100m² Bordeaux', 'Studio Paris 11e'];

    return Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      listingId: Math.floor(Math.random() * 100) + 1,
      property: properties[i % properties.length],
      buyer: { id: Math.random() * 1000, name: `Acheteur ${i + 1}`, email: 'buyer@immo2000.fr' },
      seller: { id: Math.random() * 1000, name: `Vendeur ${i + 1}`, email: 'seller@immo2000.fr' },
      status: statuses[Math.floor(Math.random() * statuses.length)],
      offerPrice: 250000 + Math.random() * 100000,
      askingPrice: 300000,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      offers: [
        {
          id: 1,
          price: 280000,
          status: 'pending',
          createdAt: new Date().toISOString(),
          buyer: `Acheteur ${i + 1}`,
        },
      ],
      payment: { status: 'pending', amount: 250000, dueDate: new Date().toISOString() },
      documents: [
        { id: 1, name: 'Promesse de vente', status: 'pending', type: 'promise' },
        { id: 2, name: 'Acte de vente', status: 'not_started', type: 'deed' },
      ],
    }));
  };

  /**
   * Générer les détails mockés d'une transaction
   */
  const generateMockTransactionDetails = (transactionId) => {
    return {
      id: transactionId,
      listingId: Math.floor(Math.random() * 100) + 1,
      property: 'Appartement 3 pièces Paris 5e',
      buyer: {
        id: 1,
        name: 'Jean Dupont',
        email: 'jean.dupont@email.fr',
        phone: '06 12 34 56 78',
      },
      seller: {
        id: 2,
        name: 'Marie Martin',
        email: 'marie.martin@email.fr',
        phone: '06 87 65 43 21',
      },
      status: 'negotiating',
      askingPrice: 350000,
      timeline: [
        {
          id: 1,
          action: 'listing_created',
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          actor: 'seller',
          details: 'Annonce créée',
        },
        {
          id: 2,
          action: 'offer_submitted',
          timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          actor: 'buyer',
          details: 'Offre soumise: 320 000€',
        },
        {
          id: 3,
          action: 'offer_counter',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          actor: 'seller',
          details: 'Contre-offre: 340 000€',
        },
      ],
      offers: [
        {
          id: 1,
          price: 320000,
          status: 'rejected',
          reason: 'Prix trop bas',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          price: 340000,
          status: 'pending',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      payment: {
        status: 'pending',
        amount: 340000,
        deposit: 34000,
        depositPaid: false,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      documents: [
        {
          id: 1,
          name: 'Promesse de vente',
          type: 'promise',
          status: 'pending_signature',
          signatories: [
            { role: 'buyer', signed: false, signedAt: null },
            { role: 'seller', signed: false, signedAt: null },
          ],
        },
        {
          id: 2,
          name: 'Acte authentique',
          type: 'deed',
          status: 'not_started',
          signatories: [
            { role: 'buyer', signed: false, signedAt: null },
            { role: 'seller', signed: false, signedAt: null },
          ],
        },
      ],
    };
  };

  return {
    transactions,
    currentTransaction,
    transactionDetails,
    loading,
    actionLoading,
    error,
    pagination,
    fetchTransactions,
    fetchTransactionDetails,
    acceptOffer,
    rejectOffer,
    updatePaymentStatus,
    updateSigningStatus,
    setCurrentTransaction,
    setPagination,
  };
};
