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
import Chatbot from './components/Chatbot';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MatchingPage from './pages/MatchingPage';

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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Routes protégées */}
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

/**
 * Layout protégé pour les routes authentifiées
 */
function ProtectedLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);

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
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          🏠 Immo2000
        </Typography>
        <Typography variant="body1" gutterBottom>
          Veuillez vous connecter pour accéder à l'application
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            href="/login"
            sx={{ mr: 1 }}
          >
            Se connecter
          </Button>
          <Button
            variant="outlined"
            color="primary"
            href="/register"
          >
            S'inscrire
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <>
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

          <Button color="inherit" href="/matching">
            Trouver un bien
          </Button>

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

      {/* Routes protégées */}
      <Routes>
        {/* Tableau de bord vendeur */}
        {userRole === 'vendeur' && (
          <Route path="/dashboard" element={<VendeurDashboard />} />
        )}

        {/* Page de matching */}
        <Route path="/matching" element={<MatchingPage />} />

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

      {/* Bouton du chatbot - widget flottant */}
      {!chatbotOpen && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9998,
            cursor: 'pointer',
          }}
          onClick={() => setChatbotOpen(true)}
        >
          <Button
            variant="contained"
            color="primary"
            sx={{
              borderRadius: '50%',
              width: 60,
              height: 60,
              minWidth: 60,
              fontSize: 24,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            💬
          </Button>
        </Box>
      )}

      {/* Composant Chatbot */}
      <Chatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </>
  );
}

export default App;
