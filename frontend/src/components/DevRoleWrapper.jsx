import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Wrapper pour accès direct à un rôle en mode développement
 */
const DevRoleWrapper = ({ roleId, targetPath }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Créer les users mock
    const mockUsers = {
      visitor: {
        id: 0,
        email: 'visiteur@localhost',
        nom: 'Visiteur',
        prenom: 'Dev',
        role: 'visitor',
      },
      user: {
        id: 1,
        email: 'user@localhost',
        nom: 'Utilisateur',
        prenom: 'Test',
        role: 'user',
      },
      admin: {
        id: 999,
        email: 'admin@localhost',
        nom: 'Admin',
        prenom: 'Dev',
        role: 'admin',
      },
      notaire: {
        id: 888,
        email: 'notaire@localhost',
        nom: 'Notaire',
        prenom: 'Dev',
        role: 'notaire',
      },
    };

    const user = mockUsers[roleId];

    if (user) {
      // Stocker le user mock AVANT de faire le dispatch de navigation
      localStorage.setItem('auth_token', `mock_token_${roleId}`);
      localStorage.setItem('user_id', String(user.id));
      localStorage.setItem('user_email', user.email);
      localStorage.setItem('user_role', user.role);
      localStorage.setItem('user_nom', user.nom);
      localStorage.setItem('user_prenom', user.prenom);
      localStorage.setItem('dev_mode', 'true');

      // Attendre plus longtemps pour que React se mette à jour et que localStorage soit synchronisé
      setTimeout(() => {
        setIsProcessing(false);
        // Rediriger vers la page appropriée
        navigate(targetPath, { replace: true });
      }, 500);
    }
  }, [roleId, targetPath, navigate]);

  if (isProcessing) {
    return (
      <div>
        <div class="spinner"></div>
        <p>Activation du profil {roleId}...</p>
      </div>
    );
  }

  return null;
};

export default DevRoleWrapper;
