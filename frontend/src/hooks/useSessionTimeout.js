/**
 * Hook pour gérer le timeout de session
 * Affiche un avertissement avant l'expiration du JWT
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 heures
const WARNING_TIME_MS = 5 * 60 * 1000; // Avertissement 5 min avant expiration

export function useSessionTimeout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const handleSessionExpired = useCallback(() => {
    logout();
    navigate('/login', { state: { message: 'Votre session a expiré. Veuillez vous reconnecter.' } });
  }, [logout, navigate]);

  useEffect(() => {
    let loginTime = localStorage.getItem('loginTime');

    if (!loginTime) {
      // Nouvelle connexion
      loginTime = Date.now().toString();
      localStorage.setItem('loginTime', loginTime);
    }

    const checkSessionTimeout = setInterval(() => {
      const elapsed = Date.now() - parseInt(loginTime);
      const remaining = SESSION_TIMEOUT_MS - elapsed;

      if (remaining <= 0) {
        // Session expirée
        clearInterval(checkSessionTimeout);
        localStorage.removeItem('loginTime');
        handleSessionExpired();
      } else if (remaining <= WARNING_TIME_MS && !showWarning) {
        // Afficher l'avertissement
        setShowWarning(true);
        setTimeRemaining(Math.floor(remaining / 1000)); // Temps en secondes
      } else if (showWarning && remaining > WARNING_TIME_MS) {
        // Réinitialiser l'avertissement si la session est prolongée
        setShowWarning(false);
        setTimeRemaining(null);
      }

      // Mettre à jour le temps restant s'il est affiché
      if (showWarning) {
        setTimeRemaining(Math.floor(remaining / 1000));
      }
    }, 1000); // Vérifier toutes les secondes

    return () => {
      clearInterval(checkSessionTimeout);
    };
  }, [showWarning, handleSessionExpired]);

  const extendSession = useCallback(() => {
    // Réinitialiser le temps de connexion pour prolonger la session
    localStorage.setItem('loginTime', Date.now().toString());
    setShowWarning(false);
    setTimeRemaining(null);
  }, []);

  const forceLogout = useCallback(() => {
    localStorage.removeItem('loginTime');
    handleSessionExpired();
  }, [handleSessionExpired]);

  return { showWarning, timeRemaining, extendSession, forceLogout };
}
