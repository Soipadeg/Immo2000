import React from 'react';
import {
  Container,
  Paper,
  Button,
  Box,
  Typography,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import {
  Public,
  Person,
  Security,
  Gavel,
} from '@mui/icons-material';

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
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, bgcolor: '#f5f5f5' }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
            🔑 Mode Développement
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            Sélectionnez un profil pour continuer sans login
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            ⚠️ Ce mode est pour le développement uniquement. Les vrai système de login sera réactivé après.
          </Alert>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Grid container spacing={3}>
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Grid item xs={12} sm={6} key={role.id}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `3px solid transparent`,
                    '&:hover': {
                      elevation: 8,
                      border: `3px solid ${role.color}`,
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${role.color}40`,
                    },
                  }}
                  onClick={() => handleAccessRole(role.id)}
                >
                  <Icon sx={{ fontSize: 48, color: role.color, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {role.label}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {role.description}
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: role.color,
                      '&:hover': { bgcolor: role.color, opacity: 0.9 },
                    }}
                    fullWidth
                  >
                    Accéder
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mt: 4, p: 2, bgcolor: '#fff3cd', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>💡 Tips:</strong>
          </Typography>
          <Typography variant="body2">
            • Pour changer de rôle: Revenez à <code>/dev</code> et sélectionnez un autre profil
          </Typography>
          <Typography variant="body2">
            • Pour quitter le mode dev: Videz localStorage et redémarrez le navigateur
          </Typography>
          <Typography variant="body2">
            • Les données sont stockées en localStorage sous <code>auth_token</code>, <code>user_role</code>, etc.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DevAccessPage;
