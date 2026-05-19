/**
 * Zustand Store pour l'authentification
 * Remplace AuthContext.jsx avec une API plus simple
 *
 * Usage:
 *   const { user, login, logout } = useAuthStore();
 *   const isAuth = useAuthStore((state) => state.isAuthenticated);
 */

import { create } from 'zustand';
import { authApi } from '../services/api';

export const useAuthStore = create((set, get) => ({
  // State
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  isDevMode: false,

  // Actions
  /**
   * Vérifier l'état d'authentification au démarrage
   */
  checkAuth: async () => {
    set({ loading: true });

    // Mode dev : utiliser un rôle simulé
    const devRole = localStorage.getItem('dev_role');
    if (devRole) {
      set({
        isDevMode: true,
        isAuthenticated: true,
        user: {
          id: 999,
          email: `dev-${devRole}@immo2000.dev`,
          nom: 'Dev',
          prenom: devRole.charAt(0).toUpperCase() + devRole.slice(1),
          role: devRole,
          isDevMode: true,
        },
        loading: false,
        error: null,
      });
      return;
    }

    try {
      // Appeler /auth/me pour récupérer les infos de l'utilisateur
      const response = await authApi.me();

      if (response.data?.utilisateur) {
        const userData = response.data.utilisateur;
        set({
          user: {
            id: userData.utilisateur_id,
            email: userData.email,
            nom: userData.nom,
            prenom: userData.prenom,
            role: userData.role,
            isDevMode: false,
          },
          isAuthenticated: true,
          error: null,
          loading: false,
        });
      }
    } catch (err) {
      // Token invalide ou expiré
      if (localStorage.getItem('dev_role')) {
        const devRole = localStorage.getItem('dev_role');
        set({
          isDevMode: true,
          isAuthenticated: true,
          user: {
            id: 999,
            email: `dev-${devRole}@immo2000.dev`,
            nom: 'Dev',
            prenom: devRole.charAt(0).toUpperCase() + devRole.slice(1),
            role: devRole,
            isDevMode: true,
          },
          loading: false,
          error: null,
        });
      } else {
        console.error('Auth check failed:', err);
        localStorage.removeItem('auth_token');
        set({
          isAuthenticated: false,
          user: null,
          error: err.response?.data?.error || 'Authentication failed',
          loading: false,
        });
      }
    }
  },

  /**
   * Initialiser le mode dev avec un rôle
   */
  initDevMode: (role) => {
    const validRoles = ['visiteur', 'user', 'admin', 'notaire'];

    if (!validRoles.includes(role)) {
      console.error(`Invalid dev role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
      return false;
    }

    localStorage.setItem('dev_role', role);
    localStorage.setItem('dev_mode', 'true');

    set({
      isDevMode: true,
      user: {
        id: 999,
        email: `dev-${role}@immo2000.dev`,
        nom: 'Dev',
        prenom: role.charAt(0).toUpperCase() + role.slice(1),
        role: role,
        isDevMode: true,
      },
      isAuthenticated: true,
      loading: false,
    });

    return true;
  },

  /**
   * Quitter le mode dev
   */
  exitDevMode: () => {
    localStorage.removeItem('dev_role');
    localStorage.removeItem('dev_mode');
    set({
      isDevMode: false,
      user: null,
      isAuthenticated: false,
    });
  },

  /**
   * Se connecter
   */
  login: async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        set({ isAuthenticated: true, loading: false });

        // Récupérer les infos utilisateur
        await get().checkAuth();
        return true;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      set({
        error: errorMsg,
        isAuthenticated: false,
      });
      return false;
    }
  },

  /**
   * Se déconnecter
   */
  logout: async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('dev_role');
    localStorage.removeItem('dev_mode');
    set({
      isAuthenticated: false,
      user: null,
      isDevMode: false,
      error: null,
    });
  },

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole: (role) => {
    return get().user?.role === role;
  },

  /**
   * Vérifier si l'utilisateur a un des rôles spécifiés
   */
  hasAnyRole: (roles) => {
    return roles.includes(get().user?.role);
  },

  /**
   * Vérifier si l'utilisateur peut accéder à une ressource
   */
  canAccess: (requiredRoles) => {
    const state = get();
    if (!state.isAuthenticated) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return state.hasAnyRole(requiredRoles);
  },

  /**
   * Mettre à jour l'utilisateur
   */
  setUser: (user) => set({ user }),

  /**
   * Vider les erreurs
   */
  clearError: () => set({ error: null }),
}));
