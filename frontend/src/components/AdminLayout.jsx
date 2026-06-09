/**
 * Panneau Admin - Navigation principale
 */

import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import SessionTimeoutDialog from './SessionTimeoutDialog';
import DevModeWaitingWrapper from './DevModeWaitingWrapper';
import '../styles/AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showWarning, timeRemaining, extendSession, forceLogout } = useSessionTimeout();

  const menuItems = [
    { label: 'Accueil', path: '/admin', icon: '🏠' },
    { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { label: 'Utilisateurs', path: '/admin/users', icon: '👥' },
    { label: 'Annonces', path: '/admin/listings', icon: '🏘️' },
    { label: 'Approbation', path: '/admin/listings/approval', icon: '✅' },
    { label: 'Transactions', path: '/admin/transactions', icon: '💳' },
    { label: 'Modération', path: '/admin/moderation', icon: '🛡️' },
    { label: 'Audit Logs', path: '/admin/audit', icon: '📋' },
    { label: 'Sécurité', path: '/admin/security', icon: '🔒' },
    { label: 'Paramètres', path: '/admin/settings', icon: '⚙️' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-layout">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header__left">
          <button
            className="admin-header__brand"
            onClick={() => navigate('/admin')}
          >
            🏢 Immo2000 Admin
          </button>
        </div>

        <div className="admin-header__right">
          <div className="admin-header__user">
            <span className="admin-header__user-name">{user?.prenom} {user?.nom}</span>
          </div>
          <button
            className="admin-header__logout"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            🚪 Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="admin-wrapper">
        {/* Sidebar Navigation */}
        <nav className="admin-sidebar">
          <div className="admin-sidebar__title">MENU</div>
          <ul className="admin-sidebar__nav">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  className={`admin-sidebar__link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="admin-sidebar__icon">{item.icon}</span>
                  <span className="admin-sidebar__label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className="admin-main">
          <DevModeWaitingWrapper>
            <Outlet />
          </DevModeWaitingWrapper>
        </main>
      </div>

      {/* Session Timeout Warning Dialog */}
      {showWarning && (
        <SessionTimeoutDialog
          timeRemaining={timeRemaining}
          onExtend={extendSession}
          onLogout={forceLogout}
        />
      )}
    </div>
  );
};

export default AdminLayout;
