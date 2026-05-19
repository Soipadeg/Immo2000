import React from 'react';
import { Button, Alert, Input } from '@/components';
import '../styles/DevAccessPage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/DevAccessPage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/DevAccessPage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/DevAccessPage.css';





const DevAccessPage = () => {
  const roles = [
    {
      id: 'visitor',
      label: '👁️ Visiteur',
      description: 'Accès public - Navigation limitée',
      icon: Public,
      path: '/',
      color: '#2196F3',
    },
    {
      id: 'user',
      label: '👤 Utilisateur',
      description: 'Accès utilisateur - Vendre et acheter des biens',
      icon: Person,
      path: '/dashboard',
      color: '#4CAF50',
    },
    {
      id: 'admin',
      label: '🔐 Admin',
      description: 'Accès administrateur - Gestion complète',
      icon: Security,
      path: '/admin',
      color: '#FF9800',
    },
    {
      id: 'notaire',
      label: '⚖️ Notaire',
      description: 'Accès notaire - Gestion des contrats',
      icon: Gavel,
      path: '/notaire',
      color: '#9C27B0',
    },
  ];

  const handleAccessRole = (roleId) => {
    // Définir le rôle dans localStorage pour que useAuth le récupère
    const roleMap = {
      visitor: 'visitor',
      user: 'user',
      admin: 'admin',
      notaire: 'notaire',
    };

    const userRole = roleMap[roleId] || 'user';
    const userId = Math.random().toString(36).substr(2, 9);

    // Stocker le rôle et les données utilisateur dans localStorage
    localStorage.setItem('user_role', userRole);
    localStorage.setItem('user_id', userId);
    localStorage.setItem('user_email', `${userRole}_${userId}@immo2000.local`);
    localStorage.setItem('user_nom', 'Utilisateur');
    localStorage.setItem('user_prenom', 'Dev');

    // Récupérer le chemin cible
    const targetPath = roles.find(r => r.id === roleId)?.path || '/';

    // Rediriger directement
    window.location.href = targetPath;
  };

  return (
    <div maxWidth="md">
      <div elevation={3}>
        <div>
          <h3 variant="h3">
            🔑 Mode Développement
          </h3>
          <p variant="body1" color="textSecondary">
            Sélectionnez un profil pour continuer sans login
          </h3>
          <Alert severity="warning">
            ⚠️ Ce mode est pour le développement uniquement. Les vrai système de login sera réactivé après.
          </Alert>
        </div>

        <hr />

        <div container spacing={3}>
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div item xs={12} sm={6} key={role.id}>
                <div
                  elevation={2}
                  onClick={() => handleAccessRole(role.id)}
                >
                  <Icon />
                  <h6 variant="h6">
                    {role.label}
                  </h6>
                  <p variant="body2" color="textSecondary">
                    {role.description}
                  </h6>
                  <Button
                    variant="contained"
                    fullWidth
                  >
                    Accéder
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <hr />

        <div>
          <p variant="body2">
            <strong>💡 Tips:</strong>
          </h3>
          <p variant="body2">
            • Pour changer de rôle: Revenez à <code>/dev</code> et sélectionnez un autre profil
          </h6>
          <p variant="body2">
            • Pour quitter le mode dev: Videz localStorage et redémarrez le navigateur
          </h3>
          <p variant="body2">
            • Les données sont stockées en localStorage sous <code>auth_token</code>, <code>user_role</code>, etc.
          </h6>
        </div>
      </div>
    </div>
  );
};

export default DevAccessPage;
