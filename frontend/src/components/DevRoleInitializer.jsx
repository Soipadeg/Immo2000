/**
 * Composant pour initialiser le mode développement avec un rôle spécifique
 * Utilisé par les 4 routes dev: /dev/visiteur, /dev/user, /dev/admin, /dev/notaire
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Composant qui initialise le mode dev et redirige vers la bonne page
 * @param {string} role - Le rôle à initialiser (visiteur, user, admin, notaire)
 */
const DevRoleInitializer = ({ role }) => {
  const navigate = useNavigate();
  const { initDevMode } = useAuth();

  useEffect(() => {
    console.log('[DevRoleInitializer] Component mounted with role:', role);

    // Test localStorage access
    try {
      localStorage.setItem('_test', 'test');
      const testValue = localStorage.getItem('_test');
      console.log('[DevRoleInitializer] localStorage test:', testValue === 'test' ? 'OK' : 'FAILED');
      localStorage.removeItem('_test');
    } catch (e) {
      console.error('[DevRoleInitializer] localStorage error:', e);
    }

    // Initialiser le mode dev avec le rôle spécifié
    const success = initDevMode(role);
    console.log('[DevRoleInitializer] initDevMode returned:', success);

    if (!success) {
      // Rôle invalide
      console.error('[DevRoleInitializer] Invalid role, navigating to home');
      navigate('/');
      return;
    }

    // Vérifier que localStorage a bien été mis à jour
    const devRoleInStorage = localStorage.getItem('dev_role');
    console.log('[DevRoleInitializer] Dev role initialized:', devRoleInStorage);
    console.log('[DevRoleInitializer] localStorage contents:', {
      dev_role: localStorage.getItem('dev_role'),
      dev_mode: localStorage.getItem('dev_mode'),
    });

    // Attendre que le state useAuth se mette à jour dans le contexte
    // et que localStorage soit correctement synchronisé avant de naviguer
    const timer = setTimeout(() => {
      console.log('[DevRoleInitializer] Timer fired, navigating to target role');
      // Redirection selon le rôle
      switch (role) {
        case 'visiteur':
          navigate('/', { replace: true });
          break;
        case 'user':
          navigate('/user/dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'notaire':
          navigate('/notaire', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }, 800); // Augmenter le délai pour s'assurer que useAuth a lu localStorage

    return () => {
      clearTimeout(timer);
      console.log('[DevRoleInitializer] Component unmounting');
    };
  }, [role, navigate, initDevMode]);

  return (
    <div
    >
      <div class="spinner"></div>
      <div>
        🚀 Initialisation du mode {role.toUpperCase()}...
      </div>
      <div>
        Chargement des données...
      </div>
    </div>
  );
};

export default DevRoleInitializer;
