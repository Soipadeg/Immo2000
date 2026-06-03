/**
 * Panneau Admin - Navigation principale
 */

import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import SessionTimeoutDialog from './SessionTimeoutDialog';
import DevModeWaitingWrapper from './DevModeWaitingWrapper';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showWarning, timeRemaining, extendSession, forceLogout } = useSessionTimeout();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const menuItems = [
    { label: 'Accueil', path: '/admin', icon: <Dashboard /> },
    { label: 'Dashboard', path: '/admin/dashboard', icon: <Analytics /> },
    { label: 'Utilisateurs', path: '/admin/users', icon: <People /> },
    { label: 'Annonces', path: '/admin/listings', icon: <Home /> },
    { label: 'Transactions', path: '/admin/transactions', icon: <ShoppingCart /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <TrendingUp /> },
    { label: 'Audit Trail', path: '/admin/audit', icon: <History /> },
    { label: 'Sécurité', path: '/admin/security', icon: <Security /> },
    { label: 'Paramètres', path: '/admin/settings', icon: <Settings /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div>
      {/* AppBar */}
      <AppBar position="fixed">
        <Toolbar>
          <Button color="inherit" onClick={() => navigate('/admin')}>
            🏢 Immo2000 Admin
          </Button>
          <div>
            <div>
              v3.0.0 - Task 3 Complete
            </div>
            <Divider orientation="vertical" />
            <div
                 onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar>
                {user?.nom?.charAt(0).toUpperCase()}
              </Avatar>
              <div>{user?.email}</div>
            </div>
          </div>
        </Toolbar>
      </AppBar>

      {/* Menu Profil */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <Person /> Profil
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          logout();
          navigate('/login');
        }}>
          <Logout /> Déconnexion
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            mt: '64px',
          },
        }}
      >
        <div>
          <div>
            TÂCHES
          </div>
        </div>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <li key={item.path} disablePadding>
              <button
                onClick={() => navigate(item.path)}
                selected={isActive(item.path)}
                sx={{
                  bgcolor: isActive(item.path) ? 'primary.light' : 'transparent',
                  color: isActive(item.path) ? 'primary.main' : 'text.primary',
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                  },
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </button>
            </li>
          ))}
        </List>
      </Drawer>

      {/* Contenu Principal */}
      <div>
        <div /> {/* Espacement pour AppBar */}
        <div>
          <DevModeWaitingWrapper>
            <Outlet />
          </DevModeWaitingWrapper>
        </div>
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
