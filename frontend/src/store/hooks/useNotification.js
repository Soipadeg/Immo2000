/**
 * Hook personnalisé pour les notifications
 * Offre une API similaire à useContext mais avec Zustand
 *
 * Usage:
 *   const notifications = useNotification();
 *   notifications.showSuccess('Opération réussie!');
 */

import { useNotificationStore } from '../notificationStore';

const useNotification = () => {
  return {
    notifications: useNotificationStore((state) => state.notifications),
    addNotification: useNotificationStore((state) => state.addNotification),
    removeNotification: useNotificationStore((state) => state.removeNotification),
    showSuccess: useNotificationStore((state) => state.showSuccess),
    showError: useNotificationStore((state) => state.showError),
    showWarning: useNotificationStore((state) => state.showWarning),
    showInfo: useNotificationStore((state) => state.showInfo),
    clearAll: useNotificationStore((state) => state.clearAll),
  };
};

export default useNotification;
