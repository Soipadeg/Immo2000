import '../styles/DashboardRedirectPage.css';
import { Alert,Button,Input } from '@/components';
/**
 * Page de redirection intelligente du dashboard
 * Redirige vers le dashboard approprié selon le rôle de l'utilisateur
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';





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
    <div
    >
      <div size={60} />
      <div>Redirection vers votre tableau de bord...</div>
    </div>
  );
};

export default DashboardRedirectPage;
