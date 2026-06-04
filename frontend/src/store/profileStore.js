/**
 * Store de gestion des profils d'utilisateur (Zustand)
 * Permet de switcher entre différents profils en mode développement
 */

import { create } from 'zustand';

const PROFILES = {
  VISITOR: 'visitor',
  USER: 'user',
  NOTAIRE: 'notaire',
  ADMIN: 'admin',
};

const PROFILE_CONFIG = {
  visitor: {
    label: 'Visiteur',
    icon: '👤',
    color: '#9CA3AF',
    description: 'Utilisateur non connecté',
    mockUser: {
      id: 0,
      email: 'visiteur@localhost',
      nom: 'Visiteur',
      prenom: 'Dev',
      role: 'visitor',
    },
  },
  user: {
    label: 'Utilisateur',
    icon: '👨‍💼',
    color: '#3B82F6',
    description: 'Utilisateur connecté standard',
    mockUser: {
      id: 1,
      email: 'user@localhost',
      nom: 'Utilisateur',
      prenom: 'Test',
      role: 'user',
    },
  },
  notaire: {
    label: 'Notaire',
    icon: '⚖️',
    color: '#8B5CF6',
    description: 'Professionnel notaire',
    mockUser: {
      id: 888,
      email: 'notaire@localhost',
      nom: 'Notaire',
      prenom: 'Dev',
      role: 'notaire',
    },
  },
  admin: {
    label: 'Administrateur',
    icon: '👑',
    color: '#EF4444',
    description: 'Administrateur système',
    mockUser: {
      id: 999,
      email: 'admin@localhost',
      nom: 'Admin',
      prenom: 'Dev',
      role: 'admin',
    },
  },
};

export const useProfileStore = create((set, get) => ({
  // État
  currentProfile: localStorage.getItem('dev_profile') || PROFILES.VISITOR,

  // Getters
  getProfileConfig: (profile) => PROFILE_CONFIG[profile],
  getAllProfiles: () => PROFILES,
  getAllProfileConfigs: () => PROFILE_CONFIG,

  // Actions
  setProfile: (profile) => {
    if (!PROFILE_CONFIG[profile]) {
      console.error('[profileStore] Profil invalide:', profile);
      return false;
    }

    set({ currentProfile: profile });
    localStorage.setItem('dev_profile', profile);

    // Mettre à jour localStorage pour que useAuth puisse le lire
    const config = PROFILE_CONFIG[profile];
    const mockUser = config.mockUser;

    if (profile === PROFILES.VISITOR) {
      // Déconnecter
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_nom');
      localStorage.removeItem('user_prenom');
      localStorage.removeItem('dev_role');
      localStorage.removeItem('dev_mode');
    } else {
      // Connecter avec le profil
      localStorage.setItem('dev_role', profile);
      localStorage.setItem('dev_mode', 'true');
      localStorage.setItem('auth_token', `mock_token_${profile}`);
      localStorage.setItem('user_id', String(mockUser.id));
      localStorage.setItem('user_email', mockUser.email);
      localStorage.setItem('user_role', mockUser.role);
      localStorage.setItem('user_nom', mockUser.nom);
      localStorage.setItem('user_prenom', mockUser.prenom);
    }

    console.log(`[profileStore] Profil changé en: ${profile}`, {
      profile,
      mockUser,
    });

    // Dispatcher un événement personnalisé pour notifier les autres composants
    window.dispatchEvent(new CustomEvent('profileChanged', {
      detail: { profile, mockUser }
    }));

    // Dispatcher aussi un événement storage pour que useAuth se mette à jour
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'dev_role',
      newValue: profile,
      oldValue: null,
      storageArea: localStorage,
    }));

    return true;
  },

  getCurrentProfileConfig: () => {
    const { currentProfile } = get();
    return PROFILE_CONFIG[currentProfile];
  },

  isAuthenticated: () => {
    const { currentProfile } = get();
    return currentProfile !== PROFILES.VISITOR;
  },

  resetProfile: () => {
    set({ currentProfile: PROFILES.VISITOR });
    localStorage.removeItem('dev_profile');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_nom');
    localStorage.removeItem('user_prenom');
    localStorage.removeItem('dev_role');
    localStorage.removeItem('dev_mode');
  },
}));

export { PROFILES, PROFILE_CONFIG };
