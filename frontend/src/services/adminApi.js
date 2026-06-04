/**
 * Service API pour les routes administrateur
 * Communication avec les endpoints /api/v1/admin/*
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Instance axios avec configuration de base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le JWT token
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
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * TASK 1: Dashboard Admin
 */
export const dashboardApi = {
  getSummary: () => apiClient.get('/admin/dashboard'),
};

/**
 * TASK 2: User Management - Gestion des utilisateurs
 */
export const usersApi = {
  list: (skip = 0, limit = 20) =>
    apiClient.get('/admin/utilisateurs', {
      params: { skip, limit },
    }),

  search: (query) =>
    apiClient.get('/admin/utilisateurs/search', {
      params: { q: query },
    }),

  getById: (id) => apiClient.get(`/admin/utilisateurs/${id}`),

  changeRole: (id) => apiClient.post(`/admin/utilisateurs/${id}/role`, {}),

  suspend: (id, durationHours = 48) =>
    apiClient.post(`/admin/utilisateurs/${id}/suspend`, {
      duration_hours: durationHours,
    }),

  reactivate: (id) => apiClient.post(`/admin/utilisateurs/${id}/reactivate`, {}),

  delete: (id) => apiClient.delete(`/admin/utilisateurs/${id}?confirm=true`),
};

/**
 * TASK 3: Listing Moderation - Modération des annonces
 */
export const listingsApi = {
  getPending: () => apiClient.get('/admin/listings/pending'),

  approve: (id) => apiClient.post(`/admin/listings/${id}/approve`, {}),

  reject: (id, reason = '') =>
    apiClient.post(`/admin/listings/${id}/reject`, {
      reason,
    }),

  remove: (id) => apiClient.post(`/admin/listings/${id}/remove`, {}),
};

/**
 * TASK 4: Transaction Management - Gestion des transactions
 */
export const transactionsApi = {
  list: (status = null) => {
    const params = {};
    if (status) params.status = status;
    return apiClient.get('/admin/transactions', { params });
  },

  getById: (id) => apiClient.get(`/admin/transactions/${id}`),

  accept: (id) => apiClient.post(`/admin/transactions/${id}/accept`, {}),

  decline: (id, reason = '') =>
    apiClient.post(`/admin/transactions/${id}/decline`, {
      reason,
    }),

  cancel: (id, reason = '') =>
    apiClient.post(`/admin/transactions/${id}/cancel`, {
      reason,
    }),
};

/**
 * TASK 5: System Settings - Paramètres système
 */
export const settingsApi = {
  list: () => apiClient.get('/admin/settings'),

  get: (key) => apiClient.get(`/admin/settings/${key}`),

  update: (key, value) =>
    apiClient.post(`/admin/settings/${key}`, {
      valeur_parametre: value,
    }),

  reset: () =>
    apiClient.post('/admin/settings/reset', {
      confirm: true,
    }),
};

/**
 * TASK 6: Analytics - Statistiques avancées
 */
export const analyticsApi = {
  getSummary: () => apiClient.get('/admin/analytics/summary'),

  getUsers: (days = 30) =>
    apiClient.get('/admin/analytics/users', {
      params: { days },
    }),

  getListings: () => apiClient.get('/admin/analytics/listings'),

  getTransactions: () => apiClient.get('/admin/analytics/transactions'),
};

/**
 * TASK 3: Audit & Security - Sécurité et Logging
 */
export const auditApi = {
  // Récupérer les logs d'audit filtrés
  getAuditLogs: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.admin_id) params.append('admin_id', filters.admin_id);
    if (filters.action) params.append('action', filters.action);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.days) params.append('days', filters.days);
    if (filters.skip !== undefined) params.append('skip', filters.skip);
    if (filters.limit !== undefined) params.append('limit', filters.limit);

    return apiClient.get(`/admin/audit-logs?${params.toString()}`);
  },

  // Exporter les logs en CSV
  exportAuditLogs: () =>
    apiClient.get('/admin/audit-logs/export', {
      responseType: 'text',
    }),

  // Récupérer le statut de sécurité
  getSecurityStatus: () => apiClient.get('/admin/security/status'),
};
