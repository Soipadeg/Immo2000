/**
 * Page de redirection intelligente du dashboard
 * Redirige vers le dashboard approprié selon le rôle de l'utilisateur
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';

const DashboardRedirectPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Non authentifié
        navigate('/');
        return;
      }

      // Redirection basée sur le rôle
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'notaire':
          navigate('/notaire');
          break;
        case 'user':
        default:
          navigate('/user/dashboard');
          break;
      }
    }
  }, [user, loading, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6">Redirection vers votre tableau de bord...</Typography>
    </Box>
  );
};

export default DashboardRedirectPage;
