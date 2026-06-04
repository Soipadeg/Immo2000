// frontend/src/services/sentryService.ts

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export const initSentry = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          window.history
        ),
        tracingOrigins: [
          import.meta.env.VITE_API_URL || 'localhost',
          /^\//,
        ],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_RATE || '0.1'),
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    release: import.meta.env.VITE_VERSION,
    environment: import.meta.env.VITE_ENV,
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
    ],
  });
};

// Error boundary component
export const ErrorBoundary = Sentry.withProfiler(
  Sentry.ErrorBoundary as any
);

// Capturing functions
export const captureException = (error: Error, context?: any) => {
  if (context) {
    Sentry.setContext('error_context', context);
  }
  Sentry.captureException(error);
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: any) => {
  if (context) {
    Sentry.setContext('message_context', context);
  }
  Sentry.captureMessage(message, level);
};

// User context
export const setUserContext = (userId: string, email?: string, username?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

// Breadcrumbs
export const addBreadcrumb = (
  message: string,
  category: string = 'info',
  level: Sentry.SeverityLevel = 'info',
  data?: any
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
};

// Tracing
export const startTransaction = (name: string, op: string = 'http.request') => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

// React Error Boundary Wrapper
export const withErrorBoundary = (Component: any, options?: any) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: <div>An error has occurred. The error has been reported.</div>,
    showDialog: false,
    ...options,
  });
};
