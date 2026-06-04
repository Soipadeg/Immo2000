/**
 * Client Axios centralisé avec interceptors améliorés
 * Gère: authentication, retry logic, error handling
 *
 * Phase 4.2 - Centralisation des appels API
 */

import axios from 'axios';
import { useNotificationStore } from '../../store/notificationStore';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Créer l'instance axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Compteur pour éviter les boucles infinies de retry
 * Clé: `${config.url}:${config.method}`
 */
const retryCount = new Map();

/**
 * Interceptor Request - Ajouter le token et les headers
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    const devRole = localStorage.getItem('dev_role');

    console.log('[API] Request to', config.url, '| token:', !!token, '| devRole:', devRole);

    // Mode dev - ajouter X-Dev-Role header
    if (devRole) {
      config.headers['X-Dev-Role'] = devRole;
      console.log('[API] ✅ Added X-Dev-Role header:', devRole);
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] ✅ Added Authorization header');
    } else {
      console.log('[API] ⚠️  No auth token or dev role found!');
    }

    // Ajouter un ID unique pour le tracking
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor Response - Gestion des erreurs et retry
 */
apiClient.interceptors.response.use(
  (response) => {
    // Réinitialiser le compteur de retry en cas de succès
    const key = `${response.config.url}:${response.config.method}`;
    retryCount.delete(key);

    return response;
  },
  async (error) => {
    const config = error.config;
    const key = `${config.url}:${config.method}`;
    const count = retryCount.get(key) || 0;

    // 401 - Token expiré ou invalide
    if (error.response?.status === 401) {
      const devMode = localStorage.getItem('dev_mode') === 'true';
      if (!devMode) {
        localStorage.removeItem('auth_token');
        // Émettre un événement pour que le composant Auth se re-check
        window.dispatchEvent(new Event('auth:logout'));
      }
      return Promise.reject(error);
    }

    // 403 - Accès refusé
    if (error.response?.status === 403) {
      const showError = useNotificationStore.getState()?.showError;
      if (showError) {
        showError('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
      }
      return Promise.reject(error);
    }

    // 404 - Ressource non trouvée
    if (error.response?.status === 404) {
      return Promise.reject(error);
    }

    // Retry logic pour les erreurs réseau et 5xx (max 3 fois)
    const isRetryable =
      !error.response || // Erreur réseau
      (error.response?.status >= 500 && error.response?.status < 600);

    if (isRetryable && count < 3) {
      retryCount.set(key, count + 1);

      // Attendre avant de retry (exponential backoff)
      const delayMs = 1000 * (2 ** count); // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      return apiClient(config);
    }

    // Erreur réseau - notification
    if (!error.response) {
      const showError = useNotificationStore.getState()?.showError;
      if (showError) {
        showError('Erreur de connexion. Vérifiez votre internet.');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
