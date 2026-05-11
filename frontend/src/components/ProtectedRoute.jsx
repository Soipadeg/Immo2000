/**
 * Composant ProtectedRoute pour contrôler l'accès aux routes selon les rôles
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Composant pour protéger les routes selon les rôles
 *
 * @param {Object} props
 * @param {React.ReactNode} props.element - Composant à rendre
 * @param {boolean} props.isAuthenticated - Est-ce que l'utilisateur est connecté?
 * @param {string} props.userRole - Rôle actuel de l'utilisateur
 * @param {Array<string>} props.requiredRoles - Rôles autorisés
 * @param {boolean} props.loading - En cours de chargement?
 * @param {string} props.fallbackPath - Chemin de redirection par défaut
 */
export const ProtectedRoute = ({
  element,
  isAuthenticated,
  userRole,
  requiredRoles = [],
  loading = false,
  fallbackPath = '/',
}) => {
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

  // Si pas d'authentification requise, afficher le composant
  if (requiredRoles.length === 0) {
    return element;
  }

  // Si non authentifié, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si authentifié mais rôle non autorisé
  if (!requiredRoles.includes(userRole)) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" color="error" gutterBottom>
          ❌ Accès refusé
        </Typography>
        <Typography variant="body1" gutterBottom>
          Vous n'avez pas les droits d'accès à cette page.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Votre rôle: <strong>{userRole}</strong>
        </Typography>
      </Box>
    );
  }

  // Tout est bon, afficher le composant
  return element;
};

/**
 * Variante avec hook
 */
export const ProtectedRouteWithHook = ({
  element,
  requiredRoles = [],
  useAuthHook,
}) => {
  const { isAuthenticated, user, loading } = useAuthHook();

  return (
    <ProtectedRoute
      element={element}
      isAuthenticated={isAuthenticated}
      userRole={user?.role}
      requiredRoles={requiredRoles}
      loading={loading}
    />
  );
};

export default ProtectedRoute;
