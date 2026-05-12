/**
 * Barre de navigation dynamique selon les rôles
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
  Badge,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BuildIcon from '@mui/icons-material/Build';
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';
import FeedIcon from '@mui/icons-material/Feed';
import PersonIcon from '@mui/icons-material/Person';
import TimelineIcon from '@mui/icons-material/Timeline';
import { notificationsApi } from '../services/api';

/**
 * Composant Navbar dynamique
 *
 * @param {Object} props
 * @param {boolean} props.isAuthenticated - Utilisateur connecté?
 * @param {string} props.userRole - Rôle de l'utilisateur (user, admin, notaire)
 * @param {Object} props.user - Données utilisateur
 * @param {function} props.onLogout - Callback de déconnexion
 */
export const DynamicNavbar = ({
  isAuthenticated,
  userRole,
  user,
  onLogout,
  showAppBar = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Charger le count des notifications non-lues
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      // Actualiser toutes les 30 secondes
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadUnreadCount = async () => {
    try {
      // Skip API call if in dev mode
      const devMode = localStorage.getItem('dev_mode') === 'true';
      if (devMode) {
        setUnreadNotifications(0);
        return;
      }

      const response = await notificationsApi.getUnreadCount();
      if (response.data) {
        setUnreadNotifications(response.data.unread_count || 0);
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Ne pas afficher la navbar sur certaines pages
  if (!showAppBar || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  /**
   * Éléments du menu selon le rôle
   */
  const getNavItems = () => {
    const items = [];

    // Items disponibles pour tous (connecté ou pas)
    items.push({ label: 'Annonces', path: '/search', icon: <SearchIcon /> });
    items.push({ label: 'Simulateur', path: '/simulateur-pret', icon: <TimelineIcon /> });

    if (!isAuthenticated) {
      return items;
    }

    // Items pour utilisateurs connectés
    items.push({ label: 'Matching', path: '/matching', icon: <BookmarkIcon /> });
    items.push({ label: 'Alertes', path: '/alertes', icon: <NotificationsIcon /> });
    items.push({ label: 'Guides', path: '/guides', icon: <SpeakerNotesIcon /> });
    items.push({ label: 'Modèles', path: '/modeles', icon: <FeedIcon /> });

    if (userRole === 'user') {
      items.push({ label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> });
      items.push({ label: 'Favoris', path: '/favoris', icon: <BookmarkIcon /> });
      items.push({ label: 'Historique', path: '/historique', icon: <FeedIcon /> });
      items.push({ label: 'Notifications', path: '/notifications', icon: <NotificationsIcon />, badge: unreadNotifications });
    }

    if (userRole === 'admin') {
      items.push({ label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> });
      items.push({ label: 'Admin', path: '/admin', icon: <AdminPanelSettingsIcon /> });
      items.push({ label: 'Utilisateurs', path: '/admin/users', icon: <PersonIcon /> });
      items.push({ label: 'Modération', path: '/admin/moderation', icon: <SpeakerNotesIcon /> });
    }

    if (userRole === 'notaire') {
      items.push({ label: 'Dashboard', path: '/notaire/dashboard', icon: <BuildIcon /> });
    }

    return items;
  };

  const navItems = getNavItems();

  /**
   * Ouvrir le menu utilisateur
   */
  const handleUserMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  /**
   * Fermer le menu utilisateur
   */
  const handleUserMenuClose = () => {
    setMenuAnchorEl(null);
  };

  /**
   * Gérer la déconnexion
   */
  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
    navigate('/login');
  };

  /**
   * Naviguer vers une page
   */
  const handleNavigate = (path) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  return (
    <AppBar position="sticky">
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          minHeight: '64px',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Logo - left aligned */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
          onClick={() => handleNavigate('/')}
        >
          🏠 Immo2000
        </Typography>

        {/* Navigation and Buttons container - kept together */}
        {!isMobile && (
          <Box
            sx={{
              display: 'flex',
              gap: 0,
              alignItems: 'center',
              justifyContent: 'flex-end',
              flex: '0 1 auto',
            }}
          >
            {/* Navigation items */}
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => handleNavigate(item.path)}
                  startIcon={
                    item.badge !== undefined && item.badge > 0 ? (
                      <Badge badgeContent={item.badge} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )
                  }
                  sx={{
                    opacity: location.pathname === item.path ? 1 : 0.7,
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '6px 12px',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    '&:hover': { opacity: 1 },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {/* Spacer to push buttons to the right */}
        <Box sx={{ flex: 1 }} />

        {/* Menu utilisateur ou boutons login */}
        {isAuthenticated && user ? (
          <>
            {/* Desktop: Avatar menu */}
            {!isMobile && (
              <Button
                onClick={handleUserMenuOpen}
                startIcon={
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    {user?.prenom?.[0]?.toUpperCase()}
                  </Avatar>
                }
                sx={{
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '6px 12px',
                  textTransform: 'uppercase',
                }}
              >
                {user?.prenom}
              </Button>
            )}

            {/* Mobile: Menu icon */}
            {isMobile && (
              <IconButton
                color="inherit"
                onClick={() => setMobileDrawerOpen(true)}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Menu utilisateur desktop */}
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleUserMenuClose}
            >
              <MenuItem disabled>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="subtitle2">
                  {user?.prenom} {user?.nom}
                </Typography>
              </MenuItem>
              <MenuItem disabled>
                <Typography variant="caption" color="textSecondary">
                  {user?.email}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleUserMenuClose(); handleNavigate('/profile'); }}>
                <SettingsIcon sx={{ mr: 1 }} />
                Mon Profil
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                Déconnexion
              </MenuItem>
            </Menu>
          </>
        ) : (
          /* Buttons pour non-authentifiés */
          !isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                onClick={() => window.location.href = 'http://localhost:5000/login.html'}
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '6px 12px',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                  '&:hover': { opacity: 1 },
                }}
              >
                Se connecter
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => window.location.href = 'http://localhost:5000/register.html'}
                sx={{
                  fontSize: '14px',
                  fontWeight: 700,
                  padding: '6px 24px',
                  textTransform: 'uppercase',
                  borderRadius: '4px',
                }}
              >
                S'inscrire
              </Button>
            </Box>
          )
        )}

        {/* Mobile: Menu icon si pas connecté */}
        {!isAuthenticated && isMobile && (
          <IconButton
            color="inherit"
            onClick={() => setMobileDrawerOpen(true)}
            sx={{ ml: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>

      {/* Drawer mobile */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Navigation
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <List>
            {navItems.map((item) => (
              <ListItem
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: location.pathname === item.path ? 'action.selected' : 'transparent',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemIcon>
                  {item.badge !== undefined && item.badge > 0 ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>

          {isAuthenticated ? (
            <>
              <Divider sx={{ my: 2 }} />
              <List>
                <ListItem onClick={() => { setMobileDrawerOpen(false); handleNavigate('/profile'); }} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Mon Profil" />
                </ListItem>
                <ListItem onClick={handleLogout} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon><LogoutIcon /></ListItemIcon>
                  <ListItemText primary="Déconnexion" />
                </ListItem>
              </List>
            </>
          ) : (
            <>
              <Divider sx={{ my: 2 }} />
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={() => handleNavigate('/login')}
                sx={{ mb: 1 }}
              >
                Se connecter
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => handleNavigate('/register')}
              >
                S'inscrire
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default DynamicNavbar;
