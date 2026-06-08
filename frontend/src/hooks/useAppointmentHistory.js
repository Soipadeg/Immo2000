import { useState, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import apiClient from '../services/api/client';

/**
 * Hook pour gérer l'historique des rendez-vous
 * Récupérer, filtrer, re-calendriser, annuler
 */
export const useAppointmentHistory = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ skip: 0, limit: 20, total: 0 });
  const [statistics, setStatistics] = useState(null);
  const { addNotification } = useNotificationStore();

  /**
   * Récupérer l'historique des rendez-vous
   */
  const fetchAppointments = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        skip: params.skip || pagination.skip,
        limit: params.limit || pagination.limit,
        ...(params.status && { status: params.status }),
        ...(params.type && { type: params.type }),
        ...(params.dateFrom && { date_from: params.dateFrom }),
        ...(params.dateTo && { date_to: params.dateTo }),
        ...(params.propertyId && { property_id: params.propertyId }),
        ...(params.search && { search: params.search }),
        ...(params.sortBy && { sort_by: params.sortBy }),
      };

      const response = await apiClient.get('/appointments', { params: query });

      if (response.data) {
        setAppointments(response.data.data || []);
        setFilteredAppointments(response.data.data || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du chargement de l\'historique';
      setError(message);
      addNotification('error', message);

      // Fallback mockées
      if (process.env.NODE_ENV === 'development') {
        setAppointments(generateMockAppointments());
        setFilteredAppointments(generateMockAppointments());
        setStatistics(generateMockStatistics());
      }
    } finally {
      setLoading(false);
    }
  }, [pagination, addNotification]);

  /**
   * Filtrer les rendez-vous localement
   */
  const filterAppointments = useCallback(
    (filters) => {
      let filtered = [...appointments];

      if (filters.status) {
        filtered = filtered.filter((a) => a.status === filters.status);
      }

      if (filters.type) {
        filtered = filtered.filter((a) => a.type === filters.type);
      }

      if (filters.dateFrom) {
        filtered = filtered.filter(
          (a) => new Date(a.scheduled_date) >= new Date(filters.dateFrom)
        );
      }

      if (filters.dateTo) {
        filtered = filtered.filter(
          (a) => new Date(a.scheduled_date) <= new Date(filters.dateTo)
        );
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.property_name.toLowerCase().includes(search) ||
            a.participant_name.toLowerCase().includes(search)
        );
      }

      setFilteredAppointments(filtered);
    },
    [appointments]
  );

  /**
   * Re-calendriser un rendez-vous
   */
  const rescheduleAppointment = useCallback(async (appointmentId, newDate, newTime) => {
    setUpdating(true);
    setError(null);
    try {
      const response = await apiClient.put(`/appointments/${appointmentId}/reschedule`, {
        new_date: newDate,
        new_time: newTime,
      });

      if (response.data) {
        // Mettre à jour localement
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  scheduled_date: `${newDate}T${newTime}`,
                  status: 'rescheduled',
                }
              : a
          )
        );
        addNotification('success', 'Rendez-vous re-calendrisé avec succès');
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la re-calendrisation';
      setError(message);
      addNotification('error', message);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [addNotification]);

  /**
   * Annuler un rendez-vous
   */
  const cancelAppointment = useCallback(async (appointmentId, reason) => {
    setUpdating(true);
    setError(null);
    try {
      const response = await apiClient.put(`/appointments/${appointmentId}/cancel`, {
        reason,
      });

      if (response.data) {
        // Mettre à jour localement
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  status: 'cancelled',
                  cancellation_reason: reason,
                }
              : a
          )
        );
        addNotification('success', 'Rendez-vous annulé');
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'annulation';
      setError(message);
      addNotification('error', message);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [addNotification]);

  /**
   * Générer un rapport de rendez-vous
   */
  const generateReport = useCallback(async (format = 'pdf') => {
    setUpdating(true);
    try {
      const response = await apiClient.get('/appointments/report', {
        params: { format },
        responseType: format === 'pdf' ? 'blob' : 'json',
      });

      if (response.data) {
        addNotification('success', `Rapport généré au format ${format.toUpperCase()}`);
        return response.data;
      }
    } catch (err) {
      addNotification('error', 'Erreur lors de la génération du rapport');
      return null;
    } finally {
      setUpdating(false);
    }
  }, [addNotification]);

  /**
   * Exporter rendez-vous
   */
  const exportAppointments = useCallback(async (format = 'csv') => {
    setUpdating(true);
    try {
      const response = await apiClient.get('/appointments/export', {
        params: { format },
        responseType: 'blob',
      });

      if (response.data) {
        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `appointments.${format}`
        );
        document.body.appendChild(link);
        link.click();
        link.parentElement.removeChild(link);
        window.URL.revokeObjectURL(url);

        addNotification('success', `Rendez-vous exportés au format ${format.toUpperCase()}`);
        return true;
      }
    } catch (err) {
      addNotification('error', 'Erreur lors de l\'export');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [addNotification]);

  return {
    // État
    appointments,
    filteredAppointments,
    statistics,
    loading,
    updating,
    error,
    pagination,

    // Fonctions
    fetchAppointments,
    filterAppointments,
    rescheduleAppointment,
    cancelAppointment,
    generateReport,
    exportAppointments,
  };
};

/**
 * Données mockées
 */
function generateMockAppointments() {
  const now = new Date();
  const types = ['visite', 'consultation', 'estimation', 'signature'];
  const statuses = ['completed', 'cancelled', 'rescheduled', 'completed'];
  const properties = [
    '123 rue de la Paix',
    '456 avenue des Champs',
    '789 boulevard Saint-Germain',
    '321 quai de la Seine',
    '654 rue Taitbout',
  ];

  return Array.from({ length: 15 }, (_, i) => {
    const daysAgo = Math.floor(Math.random() * 60);
    const appointmentDate = new Date(now);
    appointmentDate.setDate(appointmentDate.getDate() - daysAgo);

    return {
      id: `appt-${i + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      property_name: properties[Math.floor(Math.random() * properties.length)],
      participant_name: [
        'Jean Dupont',
        'Marie Martin',
        'Pierre Moreau',
        'Sophie Lefevre',
        'Thomas Beaumont',
      ][Math.floor(Math.random() * 5)],
      scheduled_date: appointmentDate.toISOString(),
      duration_minutes: [30, 45, 60][Math.floor(Math.random() * 3)],
      notes: 'Notes du rendez-vous...',
      location: 'Sur site',
      feedback_rating: Math.floor(Math.random() * 5) + 1,
    };
  });
}

function generateMockStatistics() {
  return {
    total: 47,
    completed: 32,
    cancelled: 8,
    rescheduled: 7,
    average_duration: 52,
    average_rating: 4.3,
    by_type: {
      visite: 22,
      consultation: 12,
      estimation: 8,
      signature: 5,
    },
    by_status: {
      completed: 32,
      cancelled: 8,
      rescheduled: 7,
    },
  };
}
