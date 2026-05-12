/**
 * Composant ProtectedRoute pour contrôler l'accès aux routes selon les rôles
 * Utilise le hook useAuth pour vérifier l'authentification et les rôles
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';

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

  // Afficher un chargement pendant la vérification
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Chargement...</Typography>
      </Box>
    );
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
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" color="error" gutterBottom>
            ❌ Accès refusé
          </Typography>
          <Typography variant="body1" gutterBottom>
            Vous n'avez pas les droits d'accès à cette page.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Votre rôle: <strong>{user?.role}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Rôles autorisés: <strong>{requiredRoles.join(', ')}</strong>
          </Typography>
        </Box>
      );
    }
  }

  // Tout est bon, afficher le composant
  return element;
};

export default ProtectedRoute;
