/**
 * API endpoints pour l'authentification
 * Phase 4.2 - Centralisation des appels API
 */

import apiClient from './client';

export const authApi = {
  /**
   * Se connecter
   * @returns {Promise} { token, user }
   */
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  /**
   * S'inscrire
   * @returns {Promise} { token, user }
   */
  register: (userData) =>
    apiClient.post('/auth/register', userData),

  /**
   * Récupérer les infos de l'utilisateur actuel
   * @returns {Promise} { utilisateur }
   */
  me: () =>
    apiClient.get('/auth/me'),

  /**
   * Se déconnecter
   */
  logout: async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
  },

  /**
   * Demander réinitialisation de mot de passe
   */
  requestPasswordReset: (email) =>
    apiClient.post('/auth/forgot-password', { email }),

  /**
   * Vérifier le code de réinitialisation
   */
  verifyResetCode: (code) =>
    apiClient.post('/auth/verify-reset-code', { code }),

  /**
   * Réinitialiser le mot de passe
   */
  resetPassword: (code, newPassword) =>
    apiClient.post('/auth/reset-password', {
      code,
      new_password: newPassword,
    }),

  /**
   * Vérifier l'email
   */
  verifyEmail: (token) =>
    apiClient.post('/auth/verify-email', { token }),

  /**
   * Renvoyer l'email de vérification
   */
  resendVerificationEmail: (email) =>
    apiClient.post('/auth/resend-verification', { email }),

  /**
   * Vérifier le code 2FA
   */
  verify2FA: (code) =>
    apiClient.post('/auth/verify-2fa', { code }),

  /**
   * Renvoyer le code 2FA
   */
  resend2FACode: () =>
    apiClient.post('/auth/resend-2fa', {}),

  /**
   * Valider le captcha reCAPTCHA v3
   */
  validateCaptcha: (token) =>
    apiClient.post('/auth/validate-captcha', { token }),
};
