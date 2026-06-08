import { useState, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import apiClient from '../services/api/client';

/**
 * Hook pour récupérer les statistiques des propriétés
 */
export const usePropertyStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addNotification } = useNotificationStore();

  /**
   * Récupérer les statistiques globales
   */
  const fetchStatistics = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        ...(params.startDate && { start_date: params.startDate }),
        ...(params.endDate && { end_date: params.endDate }),
      };

      const response = await apiClient.get('/statistics/properties', { params: query });

      if (response.data) {
        setStatistics(response.data);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du chargement des statistiques';
      setError(message);
      addNotification('error', message);

      if (process.env.NODE_ENV === 'development') {
        setStatistics(generateMockStatistics());
      }
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Récupérer les performances par propriété
   */
  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/statistics/performance');

      if (response.data && response.data.properties) {
        setPerformanceData(response.data.properties);
      }
    } catch (err) {
      addNotification('error', 'Erreur lors du chargement des performances');

      if (process.env.NODE_ENV === 'development') {
        setPerformanceData(generateMockPerformance());
      }
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Télécharger un rapport statistique
   */
  const downloadReport = useCallback(async (format = 'pdf') => {
    setLoading(true);
    try {
      const response = await apiClient.get('/statistics/report', {
        params: { format },
        responseType: 'blob',
      });

      if (response.data) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `statistics-report.${format}`);
        document.body.appendChild(link);
        link.click();
        link.parentElement.removeChild(link);
        window.URL.revokeObjectURL(url);

        addNotification('success', `Rapport téléchargé (${format.toUpperCase()})`);
        return true;
      }
    } catch (err) {
      addNotification('error', 'Erreur lors du téléchargement du rapport');
      return false;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  return {
    statistics,
    performanceData,
    loading,
    error,
    fetchStatistics,
    fetchPerformance,
    downloadReport,
  };
};

/**
 * Données mockées
 */
function generateMockStatistics() {
  return {
    total_properties: 42,
    active_listings: 28,
    sold_count: 12,
    average_sale_price: 285000,
    average_days_to_sell: 45,
    total_views: 15430,
    total_contacts: 342,
    contact_conversion_rate: 12.5,
    by_status: {
      active: 28,
      sold: 12,
      inactive: 2,
    },
    by_type: {
      apartment: 18,
      house: 16,
      commercial: 5,
      land: 3,
    },
    by_location: {
      paris: 22,
      lyon: 8,
      marseille: 6,
      other: 6,
    },
    price_distribution: {
      '0-200k': 8,
      '200k-400k': 18,
      '400k-600k': 10,
      '600k+': 6,
    },
    monthly_trends: [
      { month: 'Jan', views: 1200, contacts: 28, sales: 1 },
      { month: 'Fev', views: 1450, contacts: 32, sales: 2 },
      { month: 'Mar', views: 1800, contacts: 45, sales: 3 },
      { month: 'Avr', views: 2100, contacts: 52, sales: 4 },
      { month: 'Mai', views: 2400, contacts: 58, sales: 2 },
      { month: 'Jun', views: 3040, contacts: 127, sales: 2 },
    ],
  };
}

function generateMockPerformance() {
  return [
    {
      id: 'prop-1',
      address: '123 rue de la Paix, Paris',
      type: 'Apartment',
      price: 285000,
      views: 450,
      contacts: 18,
      conversion: 4.0,
      days_listed: 32,
      status: 'sold',
    },
    {
      id: 'prop-2',
      address: '456 avenue des Champs, Paris',
      type: 'House',
      price: 450000,
      views: 620,
      contacts: 24,
      conversion: 3.9,
      days_listed: 28,
      status: 'sold',
    },
    {
      id: 'prop-3',
      address: '789 boulevard Saint-Germain, Paris',
      type: 'Apartment',
      price: 325000,
      views: 780,
      contacts: 32,
      conversion: 4.1,
      days_listed: 18,
      status: 'active',
    },
  ];
}
