/**
 * Wrapper pour router vers le dashboard approprié selon le rôle
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import UserDashboardPage from '../pages/UserDashboardPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';

const DashboardRouter = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div>
        <div class="spinner"></div>
      </div>
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
