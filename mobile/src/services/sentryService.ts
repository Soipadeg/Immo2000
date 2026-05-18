// mobile/src/services/sentryService.ts

import * as Sentry from "@sentry/react-native";

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_RATE || '0.1'),
    release: process.env.APP_VERSION,
    dist: process.env.APP_BUILD,
    environment: process.env.ENVIRONMENT,
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    sendDefaultPii: false,
    enableNativeCrashHandling: true,
    autoSessionTracking: true,
    enableAppHangDetection: true,
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        enableNativeFramesTracking: true,
        enableAppStartTracking: true,
      }),
      new Sentry.Replay({
        maskAllText: true,
        maskAllImages: true,
      }),
    ],
  });
};

// Error boundary
export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>An error has occurred. Our team has been notified.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Capture functions
export const captureException = (error: Error, context?: any) => {
  if (context) {
    Sentry.setContext('error_context', context);
  }
  Sentry.captureException(error);
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: any
) => {
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
  Sentry.captureMessage(message, {
    breadcrumbs: [
      {
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000,
      },
    ],
  });
};

// Performance tracking
export const startTransaction = (name: string, op: string = 'http.request') => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

// Native crashes
export const captureNativeCrash = (crashData: any) => {
  Sentry.captureException(new Error('Native Crash'), {
    contexts: {
      native_crash: crashData,
    },
  });
};

// Memory profiling
export const captureMemoryProfile = (memoryUsage: number, threshold: number) => {
  if (memoryUsage > threshold) {
    captureMessage(
      `High memory usage detected: ${(memoryUsage / 1024 / 1024).toFixed(2)} MB`,
      'warning',
      { memory_usage_mb: memoryUsage / 1024 / 1024 }
    );
  }
};

import React from 'react';
import { View, Text } from 'react-native';
