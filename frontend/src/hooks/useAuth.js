/**
 * Hook personnalisé pour gérer l'authentification et les rôles
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
    // Vérifier immédiatement sans aucun délai
    checkAuth();

    // Écouter les changements de localStorage (pour mode dev)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Vérifier l'état de l'authentification
   */
  const checkAuth = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    const devMode = localStorage.getItem('dev_mode') === 'true';

    console.log('useAuth checkAuth:', { token: !!token, devMode, dev_mode_value: localStorage.getItem('dev_mode') });

    // Mode développement: TOUJOURS utiliser les données stockées dans localStorage
    // sans faire aucun appel API
    if (devMode) {
      const userData = {
        utilisateur_id: localStorage.getItem('user_id'),
        id: localStorage.getItem('user_id'),
        email: localStorage.getItem('user_email'),
        nom: localStorage.getItem('user_nom'),
        prenom: localStorage.getItem('user_prenom'),
        role: localStorage.getItem('user_role'),
      };

      console.log('useAuth dev mode userData:', userData);

      // Si les données requises sont présentes
      if (userData.role && userData.email) {
        setUser({
          id: userData.utilisateur_id || userData.id,
          email: userData.email,
          nom: userData.nom || 'User',
          prenom: userData.prenom || 'Dev',
          role: userData.role,
        });

        setIsAuthenticated(true);
        setLoading(false);
        console.log('useAuth dev mode SUCCESS: User authenticated as', userData.role);
        return;
      }
    }

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Récupérer les infos utilisateur depuis le backend
      const response = await authApi.me();

      if (response.data && response.data.data) {
        const userData = response.data.data;

        // Mettre à jour localStorage avec les données fraîches
        localStorage.setItem('user_id', userData.utilisateur_id || userData.id);
        localStorage.setItem('user_email', userData.email);
        localStorage.setItem('user_role', userData.role);
        localStorage.setItem('user_nom', userData.nom || '');
        localStorage.setItem('user_prenom', userData.prenom || '');

        setUser({
          id: userData.utilisateur_id || userData.id,
          email: userData.email,
          nom: userData.nom,
          prenom: userData.prenom,
          role: userData.role,
          telephone: userData.telephone,
          adresse: userData.adresse_contact,
        });

        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Erreur lors de la vérification de l\'authentification:', err);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_role');
      setIsAuthenticated(false);
      setUser(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Connecter l'utilisateur
   */
  const login = useCallback((userData, token) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_id', userData.utilisateur_id || userData.id);
    localStorage.setItem('user_email', userData.email);
    localStorage.setItem('user_role', userData.role);
    localStorage.setItem('user_nom', userData.nom || '');
    localStorage.setItem('user_prenom', userData.prenom || '');

    setUser({
      id: userData.utilisateur_id || userData.id,
      email: userData.email,
      nom: userData.nom,
      prenom: userData.prenom,
      role: userData.role,
      telephone: userData.telephone,
      adresse: userData.adresse_contact,
    });

    setIsAuthenticated(true);
    setError(null);
  }, []);

  /**
   * Déconnecter l'utilisateur
   */
  const logout = useCallback(() => {
    authApi.logout();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
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
    return roles.includes(user?.role);
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
