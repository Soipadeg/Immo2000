// frontend/src/services/analyticsService.ts

import { getAnalytics, logEvent, setUserId } from 'firebase/analytics';
import mixpanel from 'mixpanel-browser';

// Firebase Analytics
export class FirebaseAnalytics {
  private analytics: any;

  constructor() {
    this.analytics = getAnalytics();
  }

  trackEvent(eventName: string, params?: Record<string, any>) {
    logEvent(this.analytics, eventName, params);
  }

  setUserId(userId: string) {
    setUserId(this.analytics, userId);
  }

  setUserProperties(properties: Record<string, any>) {
    // Firebase Analytics
    Object.entries(properties).forEach(([key, value]) => {
      setUserProperty(this.analytics, key, String(value));
    });
  }
}

// Mixpanel Analytics
export const initMixpanel = () => {
  const token = import.meta.env.VITE_MIXPANEL_TOKEN || '';
  if (token) {
    mixpanel.init(token);
  }
};

export class MixpanelAnalytics {
  constructor(token: string) {
    if (token) {
      mixpanel.init(token);
    }
  }

  trackEvent(eventName: string, properties?: Record<string, any>) {
    mixpanel.track(eventName, properties);
  }

  identifyUser(userId: string, properties?: Record<string, any>) {
    mixpanel.identify(userId);
    if (properties) {
      mixpanel.people.set({
        $name: properties.name,
        $email: properties.email,
        $created: new Date(),
        ...properties,
      });
    }
  }

  trackFunnel(funnelName: string, step: number, properties?: Record<string, any>) {
    this.trackEvent(`${funnelName}_step_${step}`, {
      funnel: funnelName,
      step,
      ...properties,
    });
  }
}

// Initialize both
const firebaseAnalytics = new FirebaseAnalytics();
const mixpanelAnalytics = new MixpanelAnalytics(
  process.env.REACT_APP_MIXPANEL_TOKEN || ''
);

// Export combined API
export const analytics = {
  track: (event: string, params?: any) => {
    firebaseAnalytics.trackEvent(event, params);
    mixpanelAnalytics.trackEvent(event, params);
  },
  setUserId: (userId: string) => {
    firebaseAnalytics.setUserId(userId);
    mixpanelAnalytics.identifyUser(userId);
  },
  setUserProperties: (props: any) => {
    firebaseAnalytics.setUserProperties(props);
    mixpanelAnalytics.identifyUser('', props);
  },
};

// Event tracking functions
export const trackingEvents = {
  // Auth events
  signupStart: () => analytics.track('signup_start'),
  signupComplete: (role: string) => analytics.track('signup_complete', { role }),
  loginSuccess: (method: string) => analytics.track('login_success', { method }),
  logoutSuccess: () => analytics.track('logout_success'),

  // Listing events
  listingViewed: (listingId: string) =>
    analytics.track('listing_viewed', { listing_id: listingId }),
  listingCreated: (listingId: string) =>
    analytics.track('listing_created', { listing_id: listingId }),
  listingEdited: (listingId: string) =>
    analytics.track('listing_edited', { listing_id: listingId }),
  listingDeleted: (listingId: string) =>
    analytics.track('listing_deleted', { listing_id: listingId }),

  // Search events
  searchPerformed: (query: string, resultsCount: number) =>
    analytics.track('search_performed', { query, results_count: resultsCount }),
  filterApplied: (filterType: string, filterValue: string) =>
    analytics.track('filter_applied', { filter_type: filterType, filter_value: filterValue }),

  // Message events
  messageSent: (conversationId: string) =>
    analytics.track('message_sent', { conversation_id: conversationId }),
  conversationOpened: (conversationId: string) =>
    analytics.track('conversation_opened', { conversation_id: conversationId }),

  // Image events
  imageUploaded: (size: number, type: string) =>
    analytics.track('image_uploaded', { size, type }),
  imageDeleted: (imageId: string) =>
    analytics.track('image_deleted', { image_id: imageId }),

  // Error events
  errorOccurred: (errorType: string, errorMessage: string) =>
    analytics.track('error_occurred', { error_type: errorType, error_message: errorMessage }),

  // Performance events
  pageLoadTime: (pageName: string, loadTime: number) =>
    analytics.track('page_load_time', { page_name: pageName, load_time: loadTime }),
  apiResponseTime: (endpoint: string, responseTime: number) =>
    analytics.track('api_response_time', { endpoint, response_time: responseTime }),
};

// Funnel tracking
export const funnels = {
  signup: {
    start: () => mixpanelAnalytics.trackFunnel('signup', 1),
    emailEntered: () => mixpanelAnalytics.trackFunnel('signup', 2),
    passwordEntered: () => mixpanelAnalytics.trackFunnel('signup', 3),
    verified: () => mixpanelAnalytics.trackFunnel('signup', 4),
    completed: () => mixpanelAnalytics.trackFunnel('signup', 5),
  },
  listing: {
    start: () => mixpanelAnalytics.trackFunnel('listing_creation', 1),
    basicInfo: () => mixpanelAnalytics.trackFunnel('listing_creation', 2),
    images: () => mixpanelAnalytics.trackFunnel('listing_creation', 3),
    pricing: () => mixpanelAnalytics.trackFunnel('listing_creation', 4),
    published: () => mixpanelAnalytics.trackFunnel('listing_creation', 5),
  },
};
