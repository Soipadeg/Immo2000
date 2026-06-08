import { useState, useCallback, useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import apiClient from '../services/api/client';

/**
 * Hook pour monitorer l'état du système
 */
export const useHealthCheck = () => {
  const [health, setHealth] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const { addNotification } = useNotificationStore();

  /**
   * Vérifier l'état du système
   */
  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/health');

      if (response.data) {
        setHealth(response.data.status);
        setServices(response.data.services || []);
        setLastChecked(new Date());
      }
    } catch (err) {
      // En développement, générer les mock data
      if (process.env.NODE_ENV === 'development') {
        setHealth(generateMockHealth());
        setServices(generateMockServices());
        setLastChecked(new Date());
      } else {
        addNotification('error', 'Impossible de vérifier l\'état du système');
      }
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  /**
   * Auto-refresh toutes les 60 secondes
   */
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  /**
   * Redémarrer un service
   */
  const restartService = useCallback(async (serviceName) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/health/restart/${serviceName}`);
      if (response.data) {
        addNotification('success', `${serviceName} redémarré avec succès`);
        await checkHealth();
        return true;
      }
    } catch (err) {
      addNotification('error', `Erreur lors du redémarrage de ${serviceName}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [checkHealth, addNotification]);

  return {
    health,
    services,
    loading,
    lastChecked,
    checkHealth,
    restartService,
  };
};

/**
 * Données mockées
 */
function generateMockHealth() {
  return {
    overall: 'healthy',
    uptime: 720, // heures
    cpu_usage: 45,
    memory_usage: 62,
    disk_usage: 38,
  };
}

function generateMockServices() {
  return [
    {
      name: 'API Backend',
      status: 'healthy',
      response_time: 45,
      uptime: 99.98,
      last_check: new Date().toISOString(),
    },
    {
      name: 'Database',
      status: 'healthy',
      response_time: 12,
      uptime: 99.99,
      last_check: new Date().toISOString(),
    },
    {
      name: 'Email Service',
      status: 'healthy',
      response_time: 230,
      uptime: 99.95,
      last_check: new Date().toISOString(),
    },
    {
      name: 'Cache (Redis)',
      status: 'healthy',
      response_time: 3,
      uptime: 99.87,
      last_check: new Date().toISOString(),
    },
    {
      name: 'File Storage',
      status: 'healthy',
      response_time: 120,
      uptime: 99.92,
      last_check: new Date().toISOString(),
    },
  ];
}
