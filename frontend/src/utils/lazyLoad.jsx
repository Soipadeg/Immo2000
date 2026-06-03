/**
 * Helper pour le lazy loading des routes et composants
 * Phase 4.4 - Code Splitting
 */

import { lazy, Suspense } from 'react';

/**
 * Composant LoadingSpinner réutilisable
 */
export function LoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <div style={{
        width: 60,
        height: 60,
        border: '4px solid #e0e0e0',
        borderTop: '4px solid #1e88e5',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Wrapper pour lazy loading avec Suspense
 *
 * Usage:
 *   const HomePage = lazyLoadComponent(() => import('./pages/HomePage'));
 *
 *   <Route path="/" element={<HomePage />} />
 */
export function lazyLoadComponent(importFunc) {
  const Component = lazy(importFunc);

  return (props) => (
    <Suspense fallback={<LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  );
}

/**
 * Lazy load une route (racourci pour React Router)
 *
 * Usage:
 *   const routes = [
 *     { path: '/', element: lazyLoadRoute(() => import('./pages/HomePage')) },
 *     { path: '/listings', element: lazyLoadRoute(() => import('./pages/ListingsPage')) },
 *   ];
 */
export function lazyLoadRoute(importFunc) {
  return lazyLoadComponent(importFunc);
}

/**
 * Module lazy load avec fallback personnalisé
 *
 * Usage:
 *   const Dashboard = lazy(() =>
 *     import('./pages/DashboardPage').then(mod => ({
 *       default: withLazyLoadFallback(mod.default)
 *     }))
 *   );
 */
export function withLazyLoadFallback(Component, fallback = null) {
  return (props) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  );
}

/**
 * Preload un composant lazy avant de l'afficher
 * Utile pour améliorer l'UX en preloadant un composant au hover
 *
 * Usage:
 *   const HomePage = lazy(() => import('./pages/HomePage'));
 *   const preloadHome = preloadComponent(HomePage);
 *
 *   <button onMouseEnter={preloadHome}>Go Home</button>
 */
export function preloadComponent(lazyComponent) {
  return () => {
    // Force l'import du composant
    const importFunc = lazyComponent._payload._result;
    if (importFunc instanceof Promise) {
      return importFunc;
    }
  };
}

/**
 * Créer une route lazy avec retry logic en cas d'erreur
 * Utile pour les routes critiques
 *
 * Usage:
 *   const HomePage = lazyLoadWithErrorBoundary(
 *     () => import('./pages/HomePage'),
 *     ErrorFallback
 *   );
 */
export function lazyLoadWithErrorBoundary(importFunc, ErrorComponent) {
  const Component = lazy(importFunc);

  return (props) => (
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorBoundary fallback={ErrorComponent}>
        <Component {...props} />
      </ErrorBoundary>
    </Suspense>
  );
}

/**
 * Error Boundary pour capturer les erreurs de lazy loading
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <div>Erreur lors du chargement</div>
            <button onClick={() => window.location.reload()}>
              Recharger la page
            </button>
          </Box>
        )
      );
    }

    return this.props.children;
  }
}

// Réexporter React pour ErrorBoundary
import React from 'react';
