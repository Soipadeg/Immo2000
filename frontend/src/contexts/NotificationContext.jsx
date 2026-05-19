/**
 * Contexte global pour les notifications (Toasts)
 * Permet d'afficher des messages de succès, erreur, info, warning
 */

import React, { createContext, useState, useCallback } from 'react';
import Alert from '@/components/Alert/Alert';

export const NotificationContext = createContext();

/**
 * Provider pour le contexte de notifications
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, severity = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = {
      id,
      message,
      severity, // 'success' | 'error' | 'warning' | 'info'
      duration,
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration = 5000) => {
    return addNotification(message, 'success', duration);
  }, [addNotification]);

  const showError = useCallback((message, duration = 5000) => {
    return addNotification(message, 'error', duration);
  }, [addNotification]);

  const showWarning = useCallback((message, duration = 5000) => {
    return addNotification(message, 'warning', duration);
  }, [addNotification]);

  const showInfo = useCallback((message, duration = 5000) => {
    return addNotification(message, 'info', duration);
  }, [addNotification]);

  const value = {
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Affichage des Toasts */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '500px',
        }}
      >
        {notifications.map((notification) => (
          <Alert
            key={notification.id}
            type={notification.severity}
            onClose={() => removeNotification(notification.id)}
            style={{
              minWidth: '300px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            {notification.message}
          </Alert>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

/**
 * Hook pour utiliser les notifications
 */
export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
