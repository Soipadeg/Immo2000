/**
 * Barre de navigation dynamique selon les rôles
 */

import React, { useState } from 'react';
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
    items.push({ label: 'Accueil', path: '/', icon: <HomeIcon /> });
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
      <Toolbar>
        {/* Logo */}
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontWeight: 'bold',
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
          }}
          onClick={() => handleNavigate('/')}
        >
          🏠 Immo2000
        </Typography>

        {/* Navigation desktop */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => handleNavigate(item.path)}
                startIcon={item.icon}
                sx={{
                  opacity: location.pathname === item.path ? 1 : 0.7,
                  borderBottom: location.pathname === item.path ? '2px solid white' : 'none',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

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
                sx={{ color: 'white', ml: 2 }}
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
            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
              <Button
                color="inherit"
                onClick={() => handleNavigate('/login')}
              >
                Se connecter
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleNavigate('/register')}
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
                <ListItemIcon>{item.icon}</ListItemIcon>
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
