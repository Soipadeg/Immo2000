/**
 * Zustand Store pour les notifications
 * Remplace NotificationContext.jsx avec une API plus simple
 *
 * Usage:
 *   const { showSuccess, showError } = useNotificationStore();
 *   useNotificationStore().showSuccess('Opération réussie!');
 */

import { create } from 'zustand';

// Counter pour les IDs uniques
let notificationIdCounter = 0;

export const useNotificationStore = create((set) => ({
  // State
  notifications: [],

  // Actions
  /**
   * Ajouter une notification
   */
  addNotification: (message, severity = 'info', duration = 5000) => {
    const id = notificationIdCounter++;
    const notification = {
      id,
      message,
      severity, // 'success' | 'error' | 'warning' | 'info'
      duration,
      timestamp: Date.now(),
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }

    return id;
  },

  /**
   * Supprimer une notification
   */
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  /**
   * Afficher une notification de succès
   */
  showSuccess: (message, duration = 5000) => {
    return set((state) => {
      const id = notificationIdCounter++;
      const notification = {
        id,
        message,
        severity: 'success',
        duration,
        timestamp: Date.now(),
      };

      if (duration > 0) {
        setTimeout(() => {
          set((s) => ({
            notifications: s.notifications.filter((n) => n.id !== id),
          }));
        }, duration);
      }

      return {
        notifications: [...state.notifications, notification],
      };
    }), id;
  },

  /**
   * Afficher une notification d'erreur
   */
  showError: (message, duration = 5000) => {
    return set((state) => {
      const id = notificationIdCounter++;
      const notification = {
        id,
        message,
        severity: 'error',
        duration,
        timestamp: Date.now(),
      };

      if (duration > 0) {
        setTimeout(() => {
          set((s) => ({
            notifications: s.notifications.filter((n) => n.id !== id),
          }));
        }, duration);
      }

      return {
        notifications: [...state.notifications, notification],
      };
    }), id;
  },

  /**
   * Afficher une notification d'avertissement
   */
  showWarning: (message, duration = 5000) => {
    return set((state) => {
      const id = notificationIdCounter++;
      const notification = {
        id,
        message,
        severity: 'warning',
        duration,
        timestamp: Date.now(),
      };

      if (duration > 0) {
        setTimeout(() => {
          set((s) => ({
            notifications: s.notifications.filter((n) => n.id !== id),
          }));
        }, duration);
      }

      return {
        notifications: [...state.notifications, notification],
      };
    }), id;
  },

  /**
   * Afficher une notification d'info
   */
  showInfo: (message, duration = 5000) => {
    return set((state) => {
      const id = notificationIdCounter++;
      const notification = {
        id,
        message,
        severity: 'info',
        duration,
        timestamp: Date.now(),
      };

      if (duration > 0) {
        setTimeout(() => {
          set((s) => ({
            notifications: s.notifications.filter((n) => n.id !== id),
          }));
        }, duration);
      }

      return {
        notifications: [...state.notifications, notification],
      };
    }), id;
  },

  /**
   * Vider toutes les notifications
   */
  clearAll: () => set({ notifications: [] }),
}));
