/**
 * Hook personnalisé pour l'authentification
 * Offre une API similaire à useContext mais avec Zustand
 *
 * Usage:
 *   const auth = useAuth();
 *   const { user, login, logout } = useAuth();
 */

import { useAuthStore } from '../authStore';

const useAuth = () => {
  return {
    isAuthenticated: useAuthStore((state) => state.isAuthenticated),
    user: useAuthStore((state) => state.user),
    loading: useAuthStore((state) => state.loading),
    error: useAuthStore((state) => state.error),
    isDevMode: useAuthStore((state) => state.isDevMode),
    checkAuth: useAuthStore((state) => state.checkAuth),
    initDevMode: useAuthStore((state) => state.initDevMode),
    exitDevMode: useAuthStore((state) => state.exitDevMode),
    login: useAuthStore((state) => state.login),
    logout: useAuthStore((state) => state.logout),
    hasRole: useAuthStore((state) => state.hasRole),
    hasAnyRole: useAuthStore((state) => state.hasAnyRole),
    canAccess: useAuthStore((state) => state.canAccess),
    setUser: useAuthStore((state) => state.setUser),
    clearError: useAuthStore((state) => state.clearError),
  };
};

export default useAuth;
