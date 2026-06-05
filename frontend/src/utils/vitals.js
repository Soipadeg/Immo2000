/**
 * Web Vitals Collection Utility
 *
 * Tracks Core Web Vitals:
 * - FCP: First Contentful Paint
 * - LCP: Largest Contentful Paint
 * - CLS: Cumulative Layout Shift
 * - TTFB: Time to First Byte
 * - FID: First Input Delay
 * - INP: Interaction to Next Paint
 */

class WebVitalsCollector {
  constructor(backendUrl = '/api/v1/analytics') {
    this.backendUrl = backendUrl;
    this.vitals = {};
    this.init();
  }

  /**
   * Initialize Web Vitals collection
   */
  init() {
    // Collect Core Web Vitals using PerformanceObserver
    if ('PerformanceObserver' in window) {
      this.collectPaintEntries();
      this.collectLargestContentfulPaint();
      this.collectLayoutShifts();
      this.collectFirstInputDelay();
      this.collectInteractionToNextPaint();
    }

    // Collect Navigation Timing
    window.addEventListener('load', () => {
      this.collectNavigationTiming();
    });

    // Send vitals when user leaves page
    window.addEventListener('beforeunload', () => {
      this.sendVitals();
    });
  }

  /**
   * Collect Paint entries (FCP, FP)
   */
  collectPaintEntries() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.vitals.FCP = entry.startTime;
            this.sendVital('FCP', entry.startTime);
          } else if (entry.name === 'first-paint') {
            this.vitals.FP = entry.startTime;
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('Paint entries collection failed:', e);
    }
  }

  /**
   * Collect Largest Contentful Paint (LCP)
   */
  collectLargestContentfulPaint() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
        this.sendVital('LCP', this.vitals.LCP);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP collection failed:', e);
    }
  }

  /**
   * Collect Cumulative Layout Shift (CLS)
   */
  collectLayoutShifts() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.vitals.CLS = clsValue;
            this.sendVital('CLS', clsValue);
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS collection failed:', e);
    }
  }

  /**
   * Collect First Input Delay (FID)
   */
  collectFirstInputDelay() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.vitals.FID = entry.processingDuration;
          this.sendVital('FID', entry.processingDuration);
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID collection failed:', e);
    }
  }

  /**
   * Collect Interaction to Next Paint (INP)
   */
  collectInteractionToNextPaint() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          this.vitals.INP = lastEntry.duration;
          this.sendVital('INP', lastEntry.duration);
        }
      });
      observer.observe({ entryTypes: ['event'] });
    } catch (e) {
      console.warn('INP collection failed:', e);
    }
  }

  /**
   * Collect Navigation Timing metrics
   */
  collectNavigationTiming() {
    try {
      const perfData = window.performance.timing;
      const perfNavigationData = window.performance.navigation;

      const timings = {
        TTFB: perfData.responseStart - perfData.fetchStart,
        DNS: perfData.domainLookupEnd - perfData.domainLookupStart,
        TCP: perfData.connectEnd - perfData.connectStart,
        REQUEST: perfData.responseStart - perfData.requestStart,
        RESPONSE: perfData.responseEnd - perfData.responseStart,
        DOM: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        LOAD: perfData.loadEventEnd - perfData.loadEventStart,
      };

      this.vitals = { ...this.vitals, ...timings };

      // Send all navigation timings
      Object.entries(timings).forEach(([name, value]) => {
        if (value > 0) {
          this.sendVital(name, value);
        }
      });
    } catch (e) {
      console.warn('Navigation timing collection failed:', e);
    }
  }

  /**
   * Send a single vital to backend
   */
  sendVital(name, value) {
    try {
      const data = {
        vital_name: name,
        value: Math.round(value),
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
      };

      // Use sendBeacon for reliability
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${this.backendUrl}/web-vitals`,
          JSON.stringify(data)
        );
      } else {
        // Fallback to fetch
        fetch(`${this.backendUrl}/web-vitals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to send vital:', e);
    }
  }

  /**
   * Send all collected vitals
   */
  sendVitals() {
    try {
      const data = {
        vitals: this.vitals,
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${this.backendUrl}/vitals-batch`,
          JSON.stringify(data)
        );
      }
    } catch (e) {
      console.warn('Failed to send vitals batch:', e);
    }
  }

  /**
   * Get collected vitals
   */
  getVitals() {
    return this.vitals;
  }

  /**
   * Get vitals summary
   */
  getSummary() {
    return {
      FCP: this.vitals.FCP ? `${Math.round(this.vitals.FCP)}ms` : 'N/A',
      LCP: this.vitals.LCP ? `${Math.round(this.vitals.LCP)}ms` : 'N/A',
      CLS: this.vitals.CLS ? this.vitals.CLS.toFixed(3) : 'N/A',
      FID: this.vitals.FID ? `${Math.round(this.vitals.FID)}ms` : 'N/A',
      INP: this.vitals.INP ? `${Math.round(this.vitals.INP)}ms` : 'N/A',
      TTFB: this.vitals.TTFB ? `${Math.round(this.vitals.TTFB)}ms` : 'N/A',
    };
  }
}

/**
 * Track custom page events
 */
class PageEventTracker {
  constructor(backendUrl = '/api/v1/analytics') {
    this.backendUrl = backendUrl;
    this.events = [];
  }

  /**
   * Track a page event
   */
  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties: properties,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
    };
    this.events.push(event);

    // Send immediately
    this.sendEvent(event);
  }

  /**
   * Track page view
   */
  trackPageView(pageName) {
    this.trackEvent('pageview', {
      page: pageName,
      referrer: document.referrer,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(element, action) {
    this.trackEvent('user_interaction', {
      element: element,
      action: action,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track API call
   */
  trackAPICall(endpoint, method, duration, statusCode) {
    this.trackEvent('api_call', {
      endpoint: endpoint,
      method: method,
      duration_ms: duration,
      status_code: statusCode,
    });
  }

  /**
   * Send event to backend
   */
  sendEvent(event) {
    try {
      fetch(`${this.backendUrl}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true,
      }).catch(() => {});
    } catch (e) {
      console.warn('Failed to send event:', e);
    }
  }

  /**
   * Get all events
   */
  getEvents() {
    return this.events;
  }
}

// Initialize Web Vitals collection when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.webVitalsCollector = new WebVitalsCollector();
    window.pageEventTracker = new PageEventTracker();
  });
} else {
  window.webVitalsCollector = new WebVitalsCollector();
  window.pageEventTracker = new PageEventTracker();
}

export { WebVitalsCollector, PageEventTracker };
