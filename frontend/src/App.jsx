/**
 * Composant racine de l'application
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import { fr } from 'date-fns/locale';
import VendeurDashboard from './components/VendeurDashboard';
import RechercheBiens from './components/RechercheBiens';

// Importer les services
import { authApi } from './services/api';

/**
 * Thème Material-UI personnalisé
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

/**
 * Composant de menu utilisateur
 */
const UserMenu = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authApi.logout();
    onLogout();
    handleMenuClose();
  };

  return (
    <>
      <Button
        onClick={handleMenuOpen}
        startIcon={<Avatar sx={{ width: 32, height: 32 }}>{user?.prenom?.[0]}</Avatar>}
        sx={{ color: 'white' }}
      >
        {user?.prenom} {user?.nom}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Mon profil</MenuItem>
        <MenuItem onClick={handleMenuClose}>Paramètres</MenuItem>
        <MenuItem onClick={handleLogout}>Déconnexion</MenuItem>
      </Menu>
    </>
  );
};

/**
 * Composant principal de l'application
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);

  // Vérifier l'authentification au montage
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    const userEmail = localStorage.getItem('user_email');
    const userRole = localStorage.getItem('user_role');

    if (token && userId) {
      setIsAuthenticated(true);
      setUserRole(userRole);
      setUser({
        user_id: userId,
        email: userEmail,
        role: userRole,
      });
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUser(null);
  };

  // Si pas authentifié, rediriger vers login
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" gutterBottom>
            🏠 Immo2000
          </Typography>
          <Typography variant="body1" gutterBottom>
            Veuillez vous connecter pour accéder à l'application
          </Typography>
          <Button
            variant="contained"
            color="primary"
            href="/login"
            sx={{ mt: 2 }}
          >
            Se connecter
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* En-tête */}
        <AppBar position="sticky">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              🏠 Immo2000
            </Typography>

            {/* Navigation */}
            {userRole === 'vendeur' && (
              <Button color="inherit" href="/dashboard">
                Mon tableau de bord
              </Button>
            )}

            <Button color="inherit" href="/search">
              Rechercher
            </Button>

            {userRole === 'agent' && (
              <Button color="inherit" href="/admin">
                Admin
              </Button>
            )}

            {/* Menu utilisateur */}
            {user && <UserMenu user={user} onLogout={handleLogout} />}
          </Toolbar>
        </AppBar>

        {/* Routes */}
        <Routes>
          {/* Tableau de bord vendeur */}
          {userRole === 'vendeur' && (
            <Route path="/dashboard" element={<VendeurDashboard />} />
          )}

          {/* Recherche publique */}
          <Route path="/search" element={<RechercheBiens />} />

          {/* Redirection par défaut */}
          <Route
            path="/"
            element={
              <Navigate
                to={userRole === 'vendeur' ? '/dashboard' : '/search'}
                replace
              />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
