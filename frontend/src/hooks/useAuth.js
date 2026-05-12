/**
 * Hook personnalisé pour gérer l'authentification et les rôles
 * Utilise JWT pour la vérification d'authentification avec le backend
 */

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

/**
 * Hook pour gérer l'authentification globale
 * @returns {Object} État et fonctions d'authentification
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialiser l'authentification au montage
  useEffect(() => {
    checkAuth();

    // Écouter les changements de localStorage (pour les logouts depuis d'autres onglets)
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token' && !e.newValue) {
        // Token supprimé - l'utilisateur s'est déconnecté
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Vérifier l'état de l'authentification en appelant le backend
   */
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      // Pas de token - non authentifié
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Appeler /auth/me pour récupérer les infos de l'utilisateur
      const response = await authApi.me();

      if (response.data && response.data.utilisateur) {
        const userData = response.data.utilisateur;
        setUser({
          id: userData.utilisateur_id,
          email: userData.email,
          nom: userData.nom,
          prenom: userData.prenom,
          role: userData.role,
        });
        setIsAuthenticated(true);
        setError(null);
      }
    } catch (err) {
      // Token invalide ou expiré
      console.error('Auth check failed:', err);
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      setUser(null);
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Connecter l'utilisateur avec JWT token
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ email, password });

      if (response.data && response.data.access_token) {
        // Stocker le token
        localStorage.setItem('auth_token', response.data.access_token);

        // Récupérer les infos de l'utilisateur
        await checkAuth();
        return response.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  /**
   * Déconnecter l'utilisateur
   */
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    window.location.href = '/';
  }, []);

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  /**
   * Vérifier si l'utilisateur a l'un des rôles spécifiés
   */
  const hasAnyRole = useCallback((roles) => {
    return Array.isArray(roles) && roles.includes(user?.role);
  }, [user]);

  /**
   * Vérifier si l'utilisateur peut accéder une fonctionnalité
   */
  const canAccess = useCallback((requiredRoles) => {
    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles];
    }
    return isAuthenticated && requiredRoles.includes(user?.role);
  }, [isAuthenticated, user]);

  return {
    isAuthenticated,
    user,
    loading,
    error,
    checkAuth,
    login,
    logout,
    hasRole,
    hasAnyRole,
    canAccess,
  };
};

export default useAuth;
