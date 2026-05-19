/**
 * Zustand Store pour l'état UI
 * Gère: thème, sidebar, filtres, etc.
 *
 * Usage:
 *   const { theme, toggleTheme } = useUIStore();
 *   const isSidebarOpen = useUIStore((state) => state.sidebarOpen);
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      // State
      sidebarOpen: true,
      theme: localStorage.getItem('theme') || 'light', // 'light' | 'dark'
      mobileMenuOpen: false,
      searchQuery: '',
      activeFilters: {},
      sortBy: 'date_desc',
      pageSize: 12,

      // Actions
      /**
       * Basculer la sidebar
       */
      toggleSidebar: () => {
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        }));
      },

      /**
       * Ouvrir/fermer la sidebar
       */
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      /**
       * Changer le thème
       */
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          localStorage.setItem('theme', newTheme);
          document.documentElement.setAttribute('data-theme', newTheme);
          return { theme: newTheme };
        });
      },

      /**
       * Définir le thème
       */
      setTheme: (theme) => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },

      /**
       * Basculer le menu mobile
       */
      toggleMobileMenu: () => {
        set((state) => ({
          mobileMenuOpen: !state.mobileMenuOpen,
        }));
      },

      /**
       * Ouvrir/fermer le menu mobile
       */
      setMobileMenuOpen: (open) => {
        set({ mobileMenuOpen: open });
      },

      /**
       * Mettre à jour la requête de recherche
       */
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      /**
       * Mettre à jour les filtres actifs
       */
      setActiveFilters: (filters) => {
        set({ activeFilters: filters });
      },

      /**
       * Ajouter/mettre à jour un filtre
       */
      setFilter: (key, value) => {
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            [key]: value,
          },
        }));
      },

      /**
       * Supprimer un filtre
       */
      removeFilter: (key) => {
        set((state) => {
          const { [key]: _, ...rest } = state.activeFilters;
          return { activeFilters: rest };
        });
      },

      /**
       * Vider tous les filtres
       */
      clearFilters: () => {
        set({ activeFilters: {} });
      },

      /**
       * Changer le tri
       */
      setSortBy: (sortBy) => {
        set({ sortBy });
      },

      /**
       * Changer la taille de la page
       */
      setPageSize: (pageSize) => {
        set({ pageSize });
      },

      /**
       * Réinitialiser l'état UI
       */
      reset: () => {
        set({
          sidebarOpen: true,
          mobileMenuOpen: false,
          searchQuery: '',
          activeFilters: {},
          sortBy: 'date_desc',
          pageSize: 12,
        });
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        pageSize: state.pageSize,
        sortBy: state.sortBy,
      }),
    }
  )
);
