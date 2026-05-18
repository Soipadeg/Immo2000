/**
 * Index des stores Zustand
 * Exporte tous les stores pour faciliter les imports
 */

export { useAuthStore } from './authStore';
export { useNotificationStore } from './notificationStore';
export { useUIStore } from './uiStore';

/**
 * Hooks utiles pour les imports communs
 */
export { default as useAuth } from './hooks/useAuth';
export { default as useNotification } from './hooks/useNotification';
