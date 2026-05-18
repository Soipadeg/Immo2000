// frontend/src/services/performanceService.ts

import {
  getCLS,
  getFCP,
  getFID,
  getLCP,
  getTTFB,
  Metric,
} from 'web-vitals';
import { analytics, trackingEvents } from './analyticsService';

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint
  FID: 100,  // First Input Delay
  CLS: 0.1,  // Cumulative Layout Shift
  FCP: 1800, // First Contentful Paint
  TTFB: 600, // Time to First Byte
};

// Performance metric tracking
export const performanceService = {
  initWebVitals() {
    // Largest Contentful Paint (LCP)
    getLCP((metric: Metric) => {
      this.trackMetric('lcp', metric.value, metric.value > PERFORMANCE_THRESHOLDS.LCP);
    });

    // First Input Delay (FID)
    getFID((metric: Metric) => {
      this.trackMetric('fid', metric.value, metric.value > PERFORMANCE_THRESHOLDS.FID);
    });

    // Cumulative Layout Shift (CLS)
    getCLS((metric: Metric) => {
      this.trackMetric('cls', metric.value, metric.value > PERFORMANCE_THRESHOLDS.CLS);
    });

    // First Contentful Paint (FCP)
    getFCP((metric: Metric) => {
      this.trackMetric('fcp', metric.value, metric.value > PERFORMANCE_THRESHOLDS.FCP);
    });

    // Time to First Byte (TTFB)
    getTTFB((metric: Metric) => {
      this.trackMetric('ttfb', metric.value, metric.value > PERFORMANCE_THRESHOLDS.TTFB);
    });
  },

  trackMetric(metricName: string, value: number, isThresholdExceeded: boolean) {
    analytics.track(`web_vital_${metricName}`, {
      value,
      exceeded_threshold: isThresholdExceeded,
      threshold: PERFORMANCE_THRESHOLDS[metricName.toUpperCase()],
    });

    if (isThresholdExceeded) {
      console.warn(`${metricName} threshold exceeded: ${value}ms`);
    }
  },

  trackPageLoadTime(pageName: string) {
    const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
    trackingEvents.pageLoadTime(pageName, loadTime);
  },

  trackApiResponse(endpoint: string, duration: number) {
    trackingEvents.apiResponseTime(endpoint, duration);
  },

  trackImageLoad(url: string, duration: number, size: number) {
    analytics.track('image_load', {
      url,
      duration,
      size,
    });
  },

  trackMemoryUsage() {
    if (performance.memory) {
      analytics.track('memory_usage', {
        used_mb: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total_mb: Math.round(performance.memory.totalJSHeapSize / 1048576),
      });
    }
  },

  getResourceTiming() {
    const resources = window.performance.getEntriesByType('resource');
    return resources.map(r => ({
      name: r.name,
      duration: r.duration,
      size: (r as any).transferSize,
      type: r.initiatorType,
    }));
  },

  logResourceTiming() {
    const resources = this.getResourceTiming();
    analytics.track('resource_timings', {
      resource_count: resources.length,
      resources: JSON.stringify(resources),
    });
  },

  getNavigationTiming() {
    const timing = window.performance.timing;
    return {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      ttfb: timing.responseStart - timing.navigationStart,
      download: timing.responseEnd - timing.responseStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
      domComplete: timing.domComplete - timing.navigationStart,
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
    };
  },

  logNavigationTiming() {
    const timings = this.getNavigationTiming();
    analytics.track('navigation_timings', timings);
  },

  startSpan(spanName: string) {
    const start = performance.now();
    return {
      end: () => {
        const duration = performance.now() - start;
        analytics.track(`custom_span_${spanName}`, {
          duration,
        });
      },
    };
  },
};

// Initialize on app load
export const initPerformanceTracking = () => {
  performanceService.initWebVitals();

  // Track memory every 30 seconds
  setInterval(() => {
    performanceService.trackMemoryUsage();
  }, 30000);

  // Log timings after page load
  window.addEventListener('load', () => {
    performanceService.logNavigationTiming();
    performanceService.logResourceTiming();
  });
};
