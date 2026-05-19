/**
 * Composant ProtectedRoute pour contrôler l'accès aux routes selon les rôles
 * Utilise le hook useAuth pour vérifier l'authentification et les rôles
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Composant pour protéger les routes selon les rôles
 * Utilise automatiquement le hook useAuth pour vérifier l'authentification
 *
 * @param {Object} props
 * @param {React.ReactNode} props.element - Composant à rendre
 * @param {Array<string>} props.requiredRoles - Rôles autorisés (optionnel)
 * @param {string} props.fallbackPath - Chemin de redirection par défaut
 */
export const ProtectedRoute = ({
  element,
  requiredRoles = [],
  fallbackPath = '/login',
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Vérifier le mode dev immédiatement (sans dépendre de loading)
  const devRole = localStorage.getItem('dev_role');
  const isDevMode = !!devRole;

  // Afficher un chargement pendant la vérification
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p>Chargement...</p>
      </div>
    );
  }

  // En mode dev, si dev_role est présent, on laisse passer
  if (isDevMode && devRole) {
    return element;
  }

  // Si non authentifié, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Si authentifié et rôles requis spécifiés
  if (requiredRoles.length > 0) {
    // Vérifier si le rôle de l'utilisateur est autorisé
    if (!requiredRoles.includes(user?.role)) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>❌ Accès refusé</h2>
          <p style={{ marginBottom: '0.5rem' }}>Vous n'avez pas les droits d'accès à cette page.</p>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Votre rôle: <strong>{user?.role}</strong>
          </p>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            Rôles autorisés: <strong>{requiredRoles.join(', ')}</strong>
          </p>
        </div>
      );
    }
  }

  // Tout est bon, afficher le composant
  return element;
};

export default ProtectedRoute;
