// mobile/src/services/analyticsService.ts

import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent, setUserId as setAnalyticsUserId } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const mobileAnalytics = {
  // Initialization
  setUserId: (userId: string) => {
    setAnalyticsUserId(analytics, userId);
  },

  clearUserId: () => {
    setAnalyticsUserId(analytics, null);
  },

  // Auth events
  trackSignup: (method: string) => {
    logEvent(analytics, 'sign_up', {
      method,
    });
  },

  trackLogin: (method: string) => {
    logEvent(analytics, 'login', {
      method,
    });
  },

  trackLogout: () => {
    logEvent(analytics, 'logout', {});
  },

  trackPasswordReset: () => {
    logEvent(analytics, 'password_reset', {});
  },

  trackBiometricAuth: (success: boolean) => {
    logEvent(analytics, 'biometric_auth', {
      success,
    });
  },

  // Listing events
  trackListingViewed: (listingId: string, price: number) => {
    logEvent(analytics, 'view_item', {
      content_type: 'listing',
      items: [{ id: listingId, price }],
    });
  },

  trackListingCreated: (listingId: string, price: number) => {
    logEvent(analytics, 'post_score', {
      score: 1,
      content_type: 'listing',
    });
  },

  trackListingDeleted: (listingId: string) => {
    logEvent(analytics, 'delete_item', {
      content_type: 'listing',
      content_id: listingId,
    });
  },

  trackListingShared: (listingId: string, method: string) => {
    logEvent(analytics, 'share', {
      content_type: 'listing',
      items: [{ id: listingId }],
      method,
    });
  },

  // Search events
  trackSearch: (query: string, resultsCount: number) => {
    logEvent(analytics, 'search', {
      search_term: query,
      number_of_night: resultsCount,
    });
  },

  trackFilterApplied: (filterType: string, value: string) => {
    logEvent(analytics, 'view_search_results', {
      search_term: `${filterType}:${value}`,
    });
  },

  // Message events
  trackMessageSent: (conversationId: string) => {
    logEvent(analytics, 'send_message', {
      conversation_id: conversationId,
    });
  },

  trackConversationOpened: (conversationId: string) => {
    logEvent(analytics, 'view_item', {
      content_type: 'conversation',
      items: [{ id: conversationId }],
    });
  },

  // Media events
  trackImagePickerOpened: (source: string) => {
    logEvent(analytics, 'select_content', {
      content_type: 'image_picker',
      items: [{ id: source }],
    });
  },

  trackImageUploaded: (size: number, duration: number) => {
    logEvent(analytics, 'upload_item', {
      size_bytes: size,
      duration_ms: duration,
      content_type: 'image',
    });
  },

  trackCameraOpened: () => {
    logEvent(analytics, 'select_content', {
      content_type: 'camera',
    });
  },

  trackPhotoCapture: (duration: number) => {
    logEvent(analytics, 'upload_item', {
      duration_ms: duration,
      content_type: 'photo',
    });
  },

  // Location events
  trackLocationPermissionRequested: (granted: boolean) => {
    logEvent(analytics, 'location_permission', {
      granted,
    });
  },

  trackLocationShared: (listingId: string) => {
    logEvent(analytics, 'share', {
      content_type: 'listing_location',
      items: [{ id: listingId }],
      method: 'location',
    });
  },

  // Offline events
  trackOfflineMode: (enabled: boolean) => {
    logEvent(analytics, 'offline_mode', {
      enabled,
    });
  },

  trackDataSync: (itemsCount: number, duration: number) => {
    logEvent(analytics, 'sync_data', {
      items_count: itemsCount,
      duration_ms: duration,
    });
  },

  // Performance events
  trackScreenLoad: (screenName: string, duration: number) => {
    logEvent(analytics, 'screen_load', {
      screen_name: screenName,
      duration_ms: duration,
    });
  },

  trackApiCall: (endpoint: string, duration: number, statusCode: number) => {
    logEvent(analytics, 'api_call', {
      endpoint,
      duration_ms: duration,
      status_code: statusCode,
    });
  },

  trackMemoryWarning: (memoryUsage: number) => {
    logEvent(analytics, 'memory_warning', {
      memory_usage_mb: memoryUsage,
    });
  },

  // Error events
  trackError: (errorType: string, errorMessage: string) => {
    logEvent(analytics, 'exception', {
      description: `${errorType}: ${errorMessage}`,
      fatal: true,
    });
  },

  trackCrash: (crashType: string) => {
    logEvent(analytics, 'crash', {
      crash_type: crashType,
    });
  },

  // Feature usage events
  trackFeatureUsed: (featureName: string) => {
    logEvent(analytics, 'feature_used', {
      feature_name: featureName,
    });
  },

  // User engagement
  trackSessionStart: () => {
    logEvent(analytics, 'session_start', {});
  },

  trackSessionEnd: (duration: number) => {
    logEvent(analytics, 'session_end', {
      session_duration_ms: duration,
    });
  },

  // Funnel events
  trackFunnelStep: (funnelName: string, step: number) => {
    logEvent(analytics, `funnel_${funnelName}_step_${step}`, {
      funnel_name: funnelName,
      step,
    });
  },
};

export default mobileAnalytics;
