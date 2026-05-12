/**
 * Service de logging des erreurs frontend
 * Envoie les erreurs au backend pour archivage
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ErrorLogger {
  constructor() {
    this.queue = [];
    this.isLogging = false;
  }

  /**
   * Logger une erreur
   * @param {Error} error - L'objet erreur
   * @param {Object} context - Contexte supplémentaire
   */
  async log(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error?.message || 'Unknown error',
      stack: error?.stack || '',
      type: error?.name || 'Error',
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
    };

    // Ajouter à la queue
    this.queue.push(errorInfo);

    // Envoyer au backend (non-bloquant)
    this.flushQueue();

    // Afficher en console en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('[Frontend Error]', errorInfo);
    }

    return errorInfo;
  }

  /**
   * Logger une erreur d'API
   * @param {AxiosError} apiError - Erreur axios
   * @param {string} endpoint - Endpoint appelé
   * @param {Object} requestData - Données de la requête
   */
  async logApiError(apiError, endpoint, requestData = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: apiError?.message || 'API Error',
      type: 'API_ERROR',
      endpoint,
      statusCode: apiError?.response?.status || null,
      errorData: apiError?.response?.data || {},
      requestData: this.sanitizeData(requestData),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
    };

    this.queue.push(errorInfo);
    this.flushQueue();

    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', errorInfo);
    }

    return errorInfo;
  }

  /**
   * Logger une action utilisateur importante
   * @param {string} action - Description de l'action
   * @param {Object} data - Données associées
   */
  async logAction(action, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'USER_ACTION',
      action,
      data: this.sanitizeData(data),
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    this.queue.push(logEntry);
    this.flushQueue();
  }

  /**
   * Vider la queue et envoyer les logs au backend
   */
  private flushQueue = async () => {
    if (this.isLogging || this.queue.length === 0) {
      return;
    }

    this.isLogging = true;
    const logsToSend = [...this.queue];
    this.queue = [];

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return; // Pas de token, on ne peut pas logger
      }

      // Envoyer les logs (endpoint optionnel, peut être créé ultérieurement)
      // Pour maintenant, on just log en console
      if (process.env.NODE_ENV === 'development') {
        console.log('[Logs to send to backend]', logsToSend);
      }
    } catch (err) {
      console.error('Error sending logs to backend:', err);
      // Rajouter à la queue si ça échoue
      this.queue.unshift(...logsToSend);
    } finally {
      this.isLogging = false;
    }
  };

  /**
   * Obtenir l'ID utilisateur actuel
   */
  private getCurrentUserId = (): string | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.user_id || user?.id || null;
      }
    } catch (err) {
      return null;
    }
    return null;
  };

  /**
   * Nettoyer les données sensibles
   */
  private sanitizeData = (data: object): object => {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'auth'];

    for (const key of Object.keys(sanitized)) {
      if (
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
      ) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  };
}

// Exporter une instance globale
export const errorLogger = new ErrorLogger();

// Setup global error handler
window.addEventListener('error', (event) => {
  errorLogger.log(event.error, {
    type: 'UNCAUGHT_ERROR',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Setup unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorLogger.log(new Error(event.reason), {
    type: 'UNHANDLED_REJECTION',
  });
});
