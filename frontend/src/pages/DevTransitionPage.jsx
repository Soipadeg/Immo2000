import '../styles/DevTransitionPage.css';
import { Alert,Button,Input } from '@/components';
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';





/**
 * Page de transition pour activer le mode dev
 * Vérifie que les données sont bien stockées avant de rediriger
 */
const DevTransitionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('Activation...');

  useEffect(() => {
    // Récupérer les paramètres de redirection
    const params = new URLSearchParams(location.search);
    const roleId = params.get('role');
    const targetPath = params.get('target') || '/';

    if (!roleId) {
      navigate('/dev', { replace: true });
      return;
    }

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
      setStatus(`Activation du profil ${roleId}...`);

      // Stocker les données EXACTEMENT comme le useAuth les attend
      localStorage.setItem('auth_token', `mock_token_${roleId}`);
      localStorage.setItem('user_id', String(user.id));
      localStorage.setItem('user_email', String(user.email));
      localStorage.setItem('user_role', String(user.role));
      localStorage.setItem('user_nom', String(user.nom));
      localStorage.setItem('user_prenom', String(user.prenom));
      localStorage.setItem('dev_mode', 'true');

      // Vérifier immédiatement que tout est bien stocké
      setStatus(`Vérification des données...`);

      setTimeout(() => {
        const verifyToken = localStorage.getItem('auth_token');
        const verifyRole = localStorage.getItem('user_role');
        const verifyMode = localStorage.getItem('dev_mode');

        console.log('DevTransitionPage verification:', { verifyToken, verifyRole, verifyMode });

        if (verifyToken && verifyRole && verifyMode === 'true') {
          setStatus(`Redirection vers ${targetPath}...`);
          // Attendre plus longtemps pour que React se mette à jour
          setTimeout(() => {
            navigate(targetPath, { replace: true });
          }, 800);
        } else {
          setStatus('Erreur: Les données n\'ont pas été stockées correctement');
        }
      }, 300);
    } else {
      setStatus('Erreur: Rôle inconnu');
    }
  }, [navigate, location.search]);

  return (
    <div
    >
      <div />
      <div>{status}</div>
      <Alert severity="info">
        ℹ️ Ne fermez pas cette page, elle se fermera automatiquement dans quelques secondes
      </Alert>
    </div>
  );
};

export default DevTransitionPage;
