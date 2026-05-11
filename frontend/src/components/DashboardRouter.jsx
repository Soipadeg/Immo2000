/**
 * Wrapper pour router vers le dashboard approprié selon le rôle
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import UserDashboardPage from '../pages/UserDashboardPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';

const DashboardRouter = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Route to appropriate dashboard based on role
  try {
    if (user?.role === 'admin') {
      return <AdminDashboardPage />;
    } else if (user?.role === 'notaire') {
      return <Navigate to="/notaire/dashboard" replace />;
    } else {
      return <UserDashboardPage />;
    }
  } catch (error) {
    console.error('Error in DashboardRouter:', error);
    return <Navigate to="/login" replace />;
  }
};

export default DashboardRouter;
