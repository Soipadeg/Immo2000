/**
 * Panneau Admin - Navigation principale
 */

import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, Container, Divider, Avatar, Menu, MenuItem,
} from '@mui/material';
import {
  Dashboard, People, Home, ShoppingCart, Settings, Analytics,
  Logout, Person, History, Security, TrendingUp,
} from '@mui/icons-material';
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
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flex: 1, cursor: 'pointer', fontWeight: 700 }}
            onClick={() => navigate('/admin')}
          >
            🏢 Immo2000 Admin
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              v3.0.0 - Task 3 Complete
            </Typography>
            <Divider orientation="vertical" sx={{ height: 24, bgcolor: 'rgba(255,255,255,0.3)' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                 onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.3)' }}>
                {user?.nom?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2">{user?.email}</Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menu Profil */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <Person sx={{ mr: 2 }} /> Profil
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          logout();
          navigate('/login');
        }}>
          <Logout sx={{ mr: 2 }} /> Déconnexion
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
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="textSecondary">
            TÂCHES
          </Typography>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
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
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Contenu Principal */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mt: '64px' }} /> {/* Espacement pour AppBar */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <DevModeWaitingWrapper>
            <Outlet />
          </DevModeWaitingWrapper>
        </Box>
      </Box>

      {/* Session Timeout Warning Dialog */}
      {showWarning && (
        <SessionTimeoutDialog
          timeRemaining={timeRemaining}
          onExtend={extendSession}
          onLogout={forceLogout}
        />
      )}
    </Box>
  );
};

export default AdminLayout;
