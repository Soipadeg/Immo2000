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
  const devRole = localStorage.getItem('dev_role'); // Dev mode header

  // En mode dev, ajouter le header X-Dev-Role au lieu du token Bearer
  if (devRole) {
    config.headers['X-Dev-Role'] = devRole;
    console.log('[API Interceptor] Adding X-Dev-Role header:', devRole, 'for URL:', config.url);
  } else if (token) {
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
      // Ne pas rediriger automatiquement - laisser les composants gérer l'authentification
      // sauf si on n'est pas en mode dev
      const devMode = localStorage.getItem('dev_mode') === 'true';
      if (!devMode) {
        // Nettoyer le token et laisser le composant gérer la redirection
        localStorage.removeItem('auth_token');
        // NOTE: Ne pas rediriger automatiquement vers /login
        // Les pages protégées utiliseront useAuth() pour vérifier et rediriger
      }
    }
    return Promise.reject(error);
  }
);

// Wrapper pour créer des fonctions API qui retournent des données simulées en mode dev
const createDevSafeApiCall = (actualCall, mockData) => {
  return async (...args) => {
    const devMode = localStorage.getItem('dev_mode') === 'true';
    if (devMode) {
      // Return mock data in dev mode without making any API call
      return Promise.resolve({
        data: mockData,
        status: 200,
        statusText: 'OK (Mock)',
      });
    }
    return actualCall(...args);
  };
};

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
   * Lister les notifications de l'utilisateur
   */
  list: (skip = 0, limit = 20) =>
    apiClient.get('/notifications', {
      params: { skip, limit },
    }),

  /**
   * Compter les notifications non lues
   */
  getUnreadCount: () => apiClient.get('/notifications/unread'),

  /**
   * Marquer une notification comme lue
   */
  markAsRead: (notificationId) =>
    apiClient.patch(`/notifications/${notificationId}/mark-as-read`),

  /**
   * Supprimer une notification
   */
  delete: (notificationId) =>
    apiClient.delete(`/notifications/${notificationId}`),

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

/**
 * Service des alertes
 */
export const alertesApi = {
  /**
   * Lister les alertes de l'utilisateur
   */
  list: (skip = 0, limit = 20) =>
    apiClient.get('/alertes', {
      params: { skip, limit },
    }),

  /**
   * Créer une nouvelle alerte
   */
  create: (data) => apiClient.post('/alertes', data),

  /**
   * Mettre à jour une alerte
   */
  update: (id, data) => apiClient.put(`/alertes/${id}`, data),

  /**
   * Supprimer une alerte
   */
  delete: (id) => apiClient.delete(`/alertes/${id}`),

  /**
   * Basculer l'état d'une alerte (active/inactive)
   */
  toggle: (id) => apiClient.patch(`/alertes/${id}/toggle`),
};

/**
 * Service des favoris
 */
export const favorisApi = {
  /**
   * Lister les favoris de l'utilisateur
   */
  list: (skip = 0, limit = 20) =>
    apiClient.get('/favoris', {
      params: { skip, limit },
    }),

  /**
   * Ajouter un favori
   */
  add: (annonceId, data = {}) =>
    apiClient.post('/favoris', {
      annonce_id: annonceId,
      ...data,
    }),

  /**
   * Supprimer un favori
   */
  remove: (favoriteId) =>
    apiClient.delete(`/favoris/${favoriteId}`),

  /**
   * Mettre à jour un favori
   */
  update: (id, data) => apiClient.put(`/favoris/${id}`, data),

  /**
   * Vérifier si une annonce est favorite
   */
  isFavorite: (annonceId) =>
    apiClient.get(`/favoris/check/${annonceId}`),
};

/**
 * Fonction pour récupérer les annonces publiques (sans authentification requise)
 * Utilisée par PublicAnnonceListPage
 *
 * @param {object} filters - Filtres: { ville, type_bien, prix_min, prix_max, surface_min, skip, limit }
 * @returns {Promise} Liste des annonces publiques (statut="publiée")
 */
export const getAnnonces = async (filters = {}) => {
  const params = {
    skip: filters.skip || 0,
    limit: filters.limit || 20,
    ...filters,
  };
  // Supprimer skip/limit des params pour eviter de les inclure deux fois
  delete params.skip;
  delete params.limit;

  const response = await apiClient.get('/annonces', {
    params: {
      skip: filters.skip || 0,
      limit: filters.limit || 20,
      ...params,
    },
  });
  return response.data?.data || response.data;
};

/**
 * Fonction pour mettre à jour le profil acheteur (ÉTAPE 2 de l'inscription)
 * Appelée par BuyerProfilePage
 *
 * @param {object} data - Données du profil: { type_bien_recherche, nombre_pieces_min, surface_min, budget_max, ville_recherchee, dpe_ideale }
 * @returns {Promise} Réponse du serveur avec le profil mis à jour
 */
export const updateBuyerProfile = async (data) => {
  const response = await apiClient.post('/auth/update-buyer-profile', data);
  return response.data;
};

/**
 * === TUNNEL DE CRÉATION D'ANNONCE ===
 */

/**
 * Créer un brouillon d'annonce (Étape 1)
 * Accessible sans authentification
 *
 * @param {FormData} formData - Données du brouillon incluant photos
 * @returns {Promise} { annonce_id, temp_photo_urls }
 */
export const createBrouillonAnnonce = async (formData) => {
  const response = await apiClient.post('/annonces/brouillon', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Compléter et publier une annonce (Étape 4)
 * Requiert JWT + propriétaire de l'annonce
 *
 * @param {number} annonceId - ID de l'annonce
 * @param {object} data - Données complètes (description, prix, surface, etc.)
 * @returns {Promise} Annonce mise à jour avec statut "publiée"
 */
export const completerAnnonce = async (annonceId, data) => {
  const response = await apiClient.put(`/annonces/${annonceId}/completer`, data);
  return response.data;
};

/**
 * Signer le contrat d'exclusivité (Étape 3)
 * Requiert JWT
 *
 * @param {object} data - { accepte: boolean }
 * @returns {Promise} { has_exclusivity_contract: boolean }
 */
export const signContratExclusivite = async (data) => {
  const response = await apiClient.post('/contrats/exclusivite', data);
  return response.data;
};

/**
 * Récupérer les annonces de l'utilisateur connecté
 * Requiert JWT
 *
 * @param {object} filters - { skip, limit, statut }
 * @returns {Promise} { total, annonces: [] }
 */
export const getMesAnnonces = async (filters = {}) => {
  const params = {
    skip: filters.skip || 0,
    limit: filters.limit || 20,
    ...filters,
  };

  const response = await apiClient.get('/utilisateurs/me/annonces', { params });
  return response.data;
};

/**
 * Service de gestion des visites
 */
export const visitesApi = {
  /**
   * Créer une nouvelle visite
   */
  create: (data) => apiClient.post('/visites', data),

  /**
   * Lister toutes les visites de l'utilisateur
   */
  listAll: (skip = 0, limit = 100) =>
    apiClient.get('/visites', {
      params: { skip, limit },
    }),

  /**
   * Récupérer une visite par ID
   */
  getById: (id) => apiClient.get(`/visites/${id}`),

  /**
   * Modifier une visite
   */
  modify: (id, data) => apiClient.put(`/visites/${id}`, data),

  /**
   * Annuler une visite
   */
  cancel: (id) => apiClient.delete(`/visites/${id}`),

  /**
   * Télécharger l'invitation en format ICS
   */
  downloadIcs: (id) => apiClient.get(`/visites/${id}/download-ics`, {
    responseType: 'blob',
  }),
};

/**
 * Service de gestion des feedbacks
 */
export const feedbacksApi = {
  /**
   * Soumettre un feedback pour une visite
   */
  create: (data) => apiClient.post('/visites/feedbacks', data),

  /**
   * Récupérer le feedback d'une visite
   */
  getForVisite: (visiteId) =>
    apiClient.get(`/visites/${visiteId}/feedback`),

  /**
   * Récupérer tous les feedbacks pour le vendeur
   */
  getVendorDashboard: () =>
    apiClient.get('/visites/vendeur/feedbacks'),

  /**
   * Ajouter une réponse du vendeur à un feedback
   */
  addVendorReply: (feedbackId, data) =>
    apiClient.put(`/feedbacks/${feedbackId}/reponse`, data),
};

/**
 * Service de gestion des offres d'achat
 */
export const offresApi = {
  /**
   * Créer une nouvelle offre
   */
  create: (data) => apiClient.post('/offres', data),

  /**
   * Récupérer une offre par ID
   */
  getById: (id) => apiClient.get(`/offres/${id}`),

  /**
   * Lister les offres pour une annonce
   */
  listForAnnonce: (annonceId) =>
    apiClient.get(`/offres/annonce/${annonceId}`),

  /**
   * Récupérer les offres faites par l'acheteur
   */
  getBuyerOffers: () =>
    apiClient.get('/offres/buyer'),

  /**
   * Récupérer les offres reçues pour les annonces du vendeur
   */
  getVendorOffers: () =>
    apiClient.get('/offres/vendor'),

  /**
   * Mettre à jour le statut d'une offre
   */
  updateStatus: (id, status) =>
    apiClient.put(`/offres/${id}/status`, { statut: status }),

  /**
   * Accepter une offre
   */
  accept: (id) => apiClient.post(`/offres/${id}/accept`),

  /**
   * Refuser une offre
   */
  reject: (id) => apiClient.post(`/offres/${id}/reject`),

  /**
   * Faire une contre-offre
   */
  counter: (id, data) =>
    apiClient.post(`/offres/${id}/counter`, data),
};

/**
 * Service de gestion des transactions
 */
export const transactionsApi = {
  /**
   * Lister toutes les transactions de l'utilisateur
   */
  list: (skip = 0, limit = 100) =>
    apiClient.get('/transactions', {
      params: { skip, limit },
    }),

  /**
   * Récupérer une transaction par ID
   */
  getById: (id) => apiClient.get(`/transactions/${id}`),

  /**
   * Créer une nouvelle transaction
   */
  create: (data) => apiClient.post('/transactions', data),

  /**
   * Mettre à jour une transaction
   */
  update: (id, data) => apiClient.put(`/transactions/${id}`, data),

  /**
   * Changer le statut d'une transaction
   */
  updateStatus: (id, status) =>
    apiClient.put(`/transactions/${id}/status`, { statut: status }),
};

/**
 * Service de gestion des notaires
 */
export const notairesApi = {
  /**
   * Lister tous les notaires avec filtres
   */
  list: (filters = {}) =>
    apiClient.get('/notaires', { params: filters }),

  /**
   * Récupérer un notaire par ID
   */
  getById: (id) => apiClient.get(`/notaires/${id}`),

  /**
   * Chercher des notaires par code postal
   */
  search: (codePostal) =>
    apiClient.get('/notaires/search', {
      params: { code_postal: codePostal },
    }),

  /**
   * Sélectionner un notaire pour une transaction
   */
  select: (transactionId, notaireId) =>
    apiClient.post(`/transactions/${transactionId}/select-notaire`, {
      notaire_id: notaireId,
    }),
};

/**
 * Service de gestion des paiements
 */
export const paymentsApi = {
  /**
   * Créer une intention de paiement
   */
  createPaymentIntent: (data) =>
    apiClient.post('/payments/create-intent', data),

  /**
   * Récupérer l'état d'un paiement
   */
  getStatus: (paymentId) =>
    apiClient.get(`/payments/${paymentId}`),

  /**
   * Confirmer un paiement
   */
  confirm: (paymentId, data) =>
    apiClient.post(`/payments/${paymentId}/confirm`, data),
};

/**
 * Service de gestion des documents DocuSign
 */
export const docusignApi = {
  /**
   * Créer un enveloppe DocuSign
   */
  createEnvelope: (data) =>
    apiClient.post('/docusign/envelopes', data),

  /**
   * Récupérer le statut d'une enveloppe
   */
  getEnvelopeStatus: (envelopeId) =>
    apiClient.get(`/docusign/envelopes/${envelopeId}`),

  /**
   * Télécharger un document signé
   */
  downloadDocument: (envelopeId, documentId) =>
    apiClient.get(`/docusign/envelopes/${envelopeId}/documents/${documentId}`, {
      responseType: 'blob',
    }),
};

/**
 * Service de gestion des utilisateurs
 */
export const usersApi = {
  /**
   * Récupérer le profil de l'utilisateur
   */
  getProfile: () =>
    apiClient.get('/users/profile'),

  /**
   * Mettre à jour le profil
   */
  updateProfile: (data) =>
    apiClient.put('/users/profile', data),

  /**
   * Changer le mot de passe
   */
  changePassword: (data) =>
    apiClient.post('/users/change-password', data),
};

/**
 * Service de gestion des biens immobiliers
 */
export const biensApi = {
  /**
   * Lister tous les biens
   */
  list: (filters = {}) =>
    apiClient.get('/biens', { params: filters }),

  /**
   * Récupérer un bien par ID
   */
  getById: (id) =>
    apiClient.get(`/biens/${id}`),

  /**
   * Créer un bien
   */
  create: (data) =>
    apiClient.post('/biens', data),

  /**
   * Mettre à jour un bien
   */
  update: (id, data) =>
    apiClient.put(`/biens/${id}`, data),
};

/**
 * Service de gestion des estimations
 */
export const estimationsApi = {
  /**
   * Créer une estimation
   */
  create: (data) =>
    apiClient.post('/estimations', data),

  /**
   * Lister les estimations
   */
  list: () =>
    apiClient.get('/estimations'),

  /**
   * Récupérer une estimation
   */
  getById: (id) =>
    apiClient.get(`/estimations/${id}`),
};

/**
 * Service de gestion des images
 */
export const imagesApi = {
  /**
   * Uploader une image
   */
  upload: (formData) =>
    apiClient.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Supprimer une image
   */
  delete: (imageId) =>
    apiClient.delete(`/images/${imageId}`),
};

/**
 * Service analytics
 */
export const analyticsApi = {
  /**
   * Récupérer les statistiques
   */
  getStats: (startDate, endDate) =>
    apiClient.get('/analytics/stats', {
      params: { start_date: startDate, end_date: endDate },
    }),

  /**
   * Envoyer un événement
   */
  trackEvent: (eventData) =>
    apiClient.post('/analytics/events', eventData),
};

/**
 * Service audit
 */
export const auditApi = {
  /**
   * Récupérer les logs audit
   */
  getLogs: (skip = 0, limit = 100) =>
    apiClient.get('/audit/logs', {
      params: { skip, limit },
    }),
};

/**
 * Service dashboard
 */
export const dashboardApi = {
  /**
   * Récupérer les données du tableau de bord
   */
  getData: () =>
    apiClient.get('/dashboard'),
};

/**
 * Service liste des annonces
 */
export const listingsApi = {
  /**
   * Lister les annonces
   */
  list: (filters = {}) =>
    apiClient.get('/listings', { params: filters }),

  /**
   * Récupérer une annonce
   */
  getById: (id) =>
    apiClient.get(`/listings/${id}`),
};

/**
 * Service offres (alias pour offresApi)
 */
export const offersApi = offresApi;

/**
 * Service FAQ
 */
export const faqApi = {
  /**
   * Récupérer les FAQ
   */
  list: () =>
    apiClient.get('/faq'),

  /**
   * Rechercher dans les FAQ
   */
  search: (query) =>
    apiClient.get('/faq/search', {
      params: { q: query },
    }),
};

/**
 * Service paramètres
 */
export const settingsApi = {
  /**
   * Récupérer les paramètres utilisateur
   */
  getSettings: () =>
    apiClient.get('/users/settings'),

  /**
   * Mettre à jour les paramètres
   */
  updateSettings: (data) =>
    apiClient.put('/users/settings', data),
};

export default apiClient;
