/**
 * Contexte d'authentification pour Immo2000
 * Fournit l'état d'authentification global à tous les composants
 */

import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { authApi } from '../services/api';

// Créer le contexte
export const AuthContext = createContext();

// Fournisseur de contexte
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDevMode, setIsDevMode] = useState(false);

  // Utiliser une ref pour éviter les infinite loops
  const checkAuthRef = useRef(null);

  // Initialiser l'authentification au montage
  useEffect(() => {
    checkAuth();

    // Écouter les changements de localStorage (pour les logouts depuis d'autres onglets)
    const handleStorageChange = (e) => {
      if ((e.key === 'auth_token' || e.key === 'dev_role') && !e.newValue) {
        // Token ou dev_role supprimé - l'utilisateur s'est déconnecté
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
    // Mode dev : utiliser un rôle simulé
    const devRole = localStorage.getItem('dev_role');
    if (devRole) {
      setIsDevMode(true);
      setIsAuthenticated(true);
      setUser({
        id: 999,
        email: `dev-${devRole}@immo2000.dev`,
        nom: 'Dev',
        prenom: devRole.charAt(0).toUpperCase() + devRole.slice(1),
        role: devRole,
        isDevMode: true,
      });
      setLoading(false);
      setError(null);
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
          isDevMode: false,
        });
        setIsAuthenticated(true);
        setError(null);
      }
    } catch (err) {
      // Token invalide ou expiré - sauf en mode dev où on ignore les erreurs
      if (localStorage.getItem('dev_role')) {
        // On est en mode dev, créer un user mock avec le rôle dev
        const devRole = localStorage.getItem('dev_role');
        setIsDevMode(true);
        setIsAuthenticated(true);
        setUser({
          id: 999,
          email: `dev-${devRole}@immo2000.dev`,
          nom: 'Dev',
          prenom: devRole.charAt(0).toUpperCase() + devRole.slice(1),
          role: devRole,
          isDevMode: true,
        });
        setLoading(false);
        setError(null);
        return;
      }

      console.error('Auth check failed:', err);
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      setUser(null);
      setIsDevMode(false);
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Stocker la référence de checkAuth pour l'utiliser dans initDevMode
  useEffect(() => {
    checkAuthRef.current = checkAuth;
  }, [checkAuth]);

  /**
   * Initialiser le mode dev avec un rôle spécifique
   */
  const initDevMode = useCallback((role) => {
    const validRoles = ['visiteur', 'user', 'admin', 'notaire'];

    if (!validRoles.includes(role)) {
      console.error(`Invalid dev role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
      return false;
    }

    console.log('[AuthContext] initDevMode called with role:', role);
    localStorage.setItem('dev_role', role);
    localStorage.setItem('dev_mode', 'true');
    console.log('[AuthContext] localStorage updated:', {
      dev_role: localStorage.getItem('dev_role'),
      dev_mode: localStorage.getItem('dev_mode'),
    });

    // Mettre à jour l'état directement sans appeler checkAuth pour éviter les boucles
    setIsDevMode(true);
    setUser({
      id: 999,
      email: `dev-${role}@immo2000.dev`,
      nom: 'Dev',
      prenom: role.charAt(0).toUpperCase() + role.slice(1),
      role: role,
      isDevMode: true,
    });
    setIsAuthenticated(true);
    setLoading(false);

    return true;
  }, []);

  /**
   * Quitter le mode dev
   */
  const exitDevMode = useCallback(() => {
    localStorage.removeItem('dev_role');
    localStorage.removeItem('dev_mode');
    setIsDevMode(false);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  /**
   * Se connecter avec email/password
   */
  const login = useCallback(async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        setIsAuthenticated(true);
        setLoading(false);
        // Appeler checkAuth pour récupérer les infos utilisateur
        if (checkAuthRef.current) {
          await checkAuthRef.current();
        }
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  /**
   * Se déconnecter
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('dev_role');
    localStorage.removeItem('dev_mode');
    setIsAuthenticated(false);
    setUser(null);
    setIsDevMode(false);
    setError(null);
  }, []);

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  /**
   * Vérifier si l'utilisateur a un des rôles spécifiés
   */
  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role);
  }, [user]);

  /**
   * Vérifier si l'utilisateur peut accéder à une ressource
   */
  const canAccess = useCallback((requiredRoles) => {
    if (!isAuthenticated) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return hasAnyRole(requiredRoles);
  }, [isAuthenticated, hasAnyRole]);

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    isDevMode,
    checkAuth,
    initDevMode,
    exitDevMode,
    login,
    logout,
    hasRole,
    hasAnyRole,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
