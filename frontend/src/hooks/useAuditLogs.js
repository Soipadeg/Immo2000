import { useState, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import apiClient from '../services/api/client';

/**
 * Hook pour gérer les logs d'audit système
 * Récupère et filtre les événements d'audit
 */
export const useAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    byAction: {},
    byUser: {},
    byResult: { success: 0, failed: 0, warning: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ skip: 0, limit: 20, total: 0 });
  const { addNotification } = useNotificationStore();

  /**
   * Récupérer les logs d'audit avec filtres
   */
  const fetchAuditLogs = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        skip: params.skip || pagination.skip,
        limit: params.limit || pagination.limit,
        ...(params.action && { action: params.action }),
        ...(params.userId && { user_id: params.userId }),
        ...(params.startDate && { start_date: params.startDate }),
        ...(params.endDate && { end_date: params.endDate }),
        ...(params.result && { result: params.result }),
        ...(params.search && { search: params.search }),
      };

      const response = await apiClient.get('/admin/audit-logs', { params: query });

      if (response.data && response.data.data) {
        setLogs(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du chargement des logs';
      setError(message);
      addNotification('error', message);

      // Fallback à des données mockées en dev
      if (process.env.NODE_ENV === 'development') {
        setLogs(generateMockAuditLogs(params.limit || 20));
      }
    } finally {
      setLoading(false);
    }
  }, [pagination, addNotification]);

  /**
   * Récupérer les statistiques d'audit
   */
  const fetchAuditStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/audit-logs/stats');
      if (response.data && response.data.data) {
        setStats(response.data.data);
      }
    } catch (err) {
      // Fallback à des stats mockées
      if (process.env.NODE_ENV === 'development') {
        setStats(generateMockStats());
      }
    }
  }, []);

  /**
   * Exporter les logs en CSV
   */
  const exportLogs = useCallback(async (format = 'csv', filters = {}) => {
    try {
      const params = {
        format,
        ...(filters.action && { action: filters.action }),
        ...(filters.userId && { user_id: filters.userId }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
      };

      const response = await apiClient.get('/admin/audit-logs/export', {
        params,
        responseType: 'blob',
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);

      addNotification('success', 'Logs exportés avec succès');
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'export';
      addNotification('error', message);
    }
  }, [addNotification]);

  /**
   * Générer des logs mockés pour développement
   */
  const generateMockAuditLogs = (count = 20) => {
    const actions = [
      'CREATE_LISTING',
      'APPROVE_LISTING',
      'REJECT_LISTING',
      'DELETE_LISTING',
      'PUBLISH_LISTING',
      'ARCHIVE_LISTING',
      'APPROVE_TRANSACTION',
      'CREATE_TRANSACTION',
      'UPDATE_TRANSACTION',
      'USER_LOGIN',
      'USER_LOGOUT',
      'CHANGE_PASSWORD',
      'UPDATE_PROFILE',
      'SUBMIT_FEEDBACK',
      'DELETE_FEEDBACK',
    ];

    const results = ['success', 'failed', 'warning'];
    const users = [
      { id: 1, name: 'Admin User', email: 'admin@immo2000.fr' },
      { id: 2, name: 'Support Team', email: 'support@immo2000.fr' },
      { id: 3, name: 'John Vendor', email: 'john@immo2000.fr' },
    ];

    const logs = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - Math.random() * 24 * 60 * 60 * 1000);
      logs.push({
        id: i + 1,
        timestamp: timestamp.toISOString(),
        action: actions[Math.floor(Math.random() * actions.length)],
        user: users[Math.floor(Math.random() * users.length)],
        resource: `Annonce ${Math.floor(Math.random() * 100) + 1}`,
        resourceId: Math.floor(Math.random() * 100) + 1,
        description: `Event ${i + 1}`,
        result: results[Math.floor(Math.random() * results.length)],
        ipAddress: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        details: {
          before: { status: 'brouillon' },
          after: { status: 'publiée' },
          changes: ['status'],
        },
      });
    }

    return logs;
  };

  /**
   * Générer des stats mockées
   */
  const generateMockStats = () => {
    return {
      totalEvents: 1247,
      byAction: {
        CREATE_LISTING: 245,
        APPROVE_LISTING: 189,
        REJECT_LISTING: 67,
        USER_LOGIN: 412,
        UPDATE_PROFILE: 156,
        OTHER: 178,
      },
      byUser: {
        'Admin User': 234,
        'Support Team': 567,
        'John Vendor': 123,
        OTHER: 323,
      },
      byResult: {
        success: 1180,
        failed: 45,
        warning: 22,
      },
      todayEvents: 67,
      thisWeekEvents: 412,
    };
  };

  return {
    logs,
    stats,
    loading,
    error,
    pagination,
    fetchAuditLogs,
    fetchAuditStats,
    exportLogs,
    setPagination,
  };
};
