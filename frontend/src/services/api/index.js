/**
 * Index des APIs centralisées
 * Exporte tous les modules API
 *
 * Phase 4.2 - Centralisation des appels API
 */

// Client axios avec interceptors
export { default as apiClient } from './client';

// API modules
export { authApi } from './auth';
export { listingsApi } from './listings';
export { messagesApi, conversationsApi, notificationsApi } from './messages';
export { offersApi, visitsApi, appointmentsApi } from './offers';

// Re-export de api.js pour compatibilité
// TODO: Migrer progressivement vers les nouveaux modules
export { default as api } from './client';
