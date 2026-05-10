/**
 * Service API pour communiquer avec le backend Immo2000
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Instance axios avec configuration de base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le JWT token à chaque requête
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion des erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Service d'annonces
 */
export const annoncesApi = {
  /**
   * Créer une nouvelle annonce
   */
  create: (data) => apiClient.post('/annonces', data),

  /**
   * Récupérer toutes les annonces de l'utilisateur
   */
  listUserAnnonces: (skip = 0, limit = 20, filters = {}) =>
    apiClient.get('/annonces', {
      params: {
        skip,
        limit,
        utilisateur_id: localStorage.getItem('user_id'),
        ...filters,
      },
    }),

  /**
   * Récupérer une annonce par ID
   */
  getById: (id) => apiClient.get(`/annonces/${id}`),

  /**
   * Mettre à jour une annonce
   */
  update: (id, data) => apiClient.put(`/annonces/${id}`, data),

  /**
   * Supprimer une annonce
   */
  delete: (id) => apiClient.delete(`/annonces/${id}`),

  /**
   * Publier une annonce
   */
  publish: (id) => apiClient.post(`/annonces/${id}/publier`, {}),

  /**
   * Archiver une annonce
   */
  archive: (id) => apiClient.post(`/annonces/${id}/archiver`, {}),

  /**
   * Marquer une annonce comme vendue
   */
  sell: (id, dateVente = null) =>
    apiClient.post(`/annonces/${id}/vendre`, {
      date_vente: dateVente,
    }),

  /**
   * Lister toutes les annonces (publiques)
   */
  listAll: (skip = 0, limit = 20, filters = {}) =>
    apiClient.get('/annonces', {
      params: {
        skip,
        limit,
        ...filters,
      },
    }),
};

/**
 * Service d'authentification
 */
export const authApi = {
  /**
   * Récupérer les infos de l'utilisateur connecté
   */
  me: () => apiClient.get('/auth/me'),

  /**
   * Se déconnecter
   */
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
  },
};

/**
 * Fonction de connexion (pour LoginPage)
 */
export const login = (credentials) =>
  apiClient.post('/auth/login', credentials);

/**
 * Fonction d'inscription (pour RegisterPage)
 */
export const register = (userData) =>
  apiClient.post('/auth/register', userData);

/**
 * Service authentification (Auth API)
 */
export const authApi = {
  /**
   * Demander réinitialisation de mot de passe
   */
  requestPasswordReset: (data) =>
    apiClient.post('/auth/forgot-password', data),

  /**
   * Vérifier le code de réinitialisation
   */
  verifyResetCode: (data) =>
    apiClient.post('/auth/verify-reset-code', data),

  /**
   * Réinitialiser le mot de passe
   */
  resetPassword: (data) =>
    apiClient.post('/auth/reset-password', data),

  /**
   * Vérifier l'email
   */
  verifyEmail: (data) =>
    apiClient.post('/auth/verify-email', data),

  /**
   * Renvoyer l'email de vérification
   */
  resendVerificationEmail: (data) =>
    apiClient.post('/auth/resend-verification', data),

  /**
   * Vérifier le code 2FA
   */
  verify2FA: (data) =>
    apiClient.post('/auth/verify-2fa', data),

  /**
   * Renvoyer le code 2FA
   */
  resend2FACode: (data) =>
    apiClient.post('/auth/resend-2fa', data),

  /**
   * Valider le captcha reCAPTCHA v3
   */
  validateCaptcha: (token) =>
    apiClient.post('/auth/validate-captcha', { token }),

  /**
   * Se déconnecter
   */
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    window.location.href = '/login';
  },
};

/**
 * Service administrateur
 */
export const adminApi = {
  /**
   * Lister tous les utilisateurs (admin only)
   */
  listUsers: (skip = 0, limit = 20, filters = {}) =>
    apiClient.get('/utilisateurs', {
      params: {
        skip,
        limit,
        ...filters,
      },
    }),

  /**
   * Récupérer les détails d'un utilisateur
   */
  getUserDetails: (userId) => apiClient.get(`/utilisateurs/${userId}`),

  /**
   * Désactiver un utilisateur
   */
  deactivateUser: (userId) => apiClient.patch(`/utilisateurs/${userId}/deactivate`),
};

/**
 * Service notifications
 */
export const notificationsApi = {
  /**
   * Tester l'email SMTP
   */
  testEmail: (email, name) =>
    apiClient.post('/notifications/test', {
      email,
      name,
    }),

  /**
   * Health check notifications
   */
  health: () => apiClient.get('/notifications/health'),
};

/**
 * Service de matching pour les acheteurs
 */
export const matchingApi = {
  /**
   * Récupérer les annonces matchées pour un acheteur
   * @param {number} acheteur_id - ID de l'acheteur
   * @param {object} filters - Filtres optionnels (ville, budget_max, surface_min, type_bien)
   * @returns {Promise} Liste des annonces matchées triées par score
   */
  getMatches: (acheteur_id, filters = {}) =>
    apiClient.post('/matching', {
      acheteur_id,
      ...filters,
    }),

  /**
   * Récupérer les détails du matching pour une annonce spécifique
   * @param {number} acheteur_id - ID de l'acheteur
   * @param {number} annonce_id - ID de l'annonce
   * @returns {Promise} Détails du matching
   */
  getMatchDetails: (acheteur_id, annonce_id) =>
    apiClient.get(`/matching/${acheteur_id}/${annonce_id}`),
};

export default apiClient;
