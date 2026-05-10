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
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import Verify2FAPage from './pages/Verify2FAPage';
import MatchingPage from './pages/MatchingPage';
import SimulateurPret from './pages/SimulateurPret';
import CreateAnnoncePage from './pages/CreateAnnoncePage';
import AdminPage from './pages/AdminPage';
import AlertesPage from './pages/AlertesPage';
import AnnoncePage from './pages/AnnoncePage';
import CGUPage from './pages/CGUPage';
import PolitiqueConfidentialitePage from './pages/PolitiqueConfidentialitePage';

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Routes protégées et publiques */}
          <Route
            path="/*"
            element={
              <Layout
                isAuthenticated={isAuthenticated}
                userRole={userRole}
                user={user}
                onLogout={handleLogout}
              />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

/**
 * Layout principal avec AppBar et routes
 */
function Layout({ isAuthenticated, userRole, user, onLogout }) {
  const [chatbotOpen, setChatbotOpen] = useState(false);

  return (
    <>
      {/* En-tête */}
      {(isAuthenticated || window.location.pathname === '/search' || window.location.pathname === '/simulateur-pret') && (
        <AppBar position="sticky">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              🏠 Immo2000
            </Typography>

            {/* Navigation */}
            <Button color="inherit" href="/search">
              Rechercher
            </Button>

            <Button color="inherit" href="/simulateur-pret">
              Simulateur de prêt
            </Button>

            {isAuthenticated && userRole === 'user' && (
              <Button color="inherit" href="/dashboard">
                Mon tableau de bord
              </Button>
            )}

            {isAuthenticated && (
              <Button color="inherit" href="/matching">
                Trouver un bien
              </Button>
            )}

            {isAuthenticated && (
              <Button color="inherit" href="/alertes">
                🔔 Alertes
              </Button>
            )}

            {isAuthenticated && userRole === 'admin' && (
              <Button color="inherit" href="/admin">
                Admin
              </Button>
            )}

            {/* Menu utilisateur ou boutons login */}
            {isAuthenticated && user ? (
              <UserMenu user={user} onLogout={onLogout} />
            ) : (
              <>
                <Button color="inherit" href="/login">
                  Se connecter
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  href="/register"
                  sx={{ ml: 1 }}
                >
                  S'inscrire
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>
      )}

      {/* Routes */}
      <Routes>
        {/* Page d'accueil pour non-authentifiés */}
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h4" gutterBottom>
                  🏠 Immo2000
                </Typography>
                <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
                  Votre plateforme immobilière
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    href="/search"
                    size="large"
                  >
                    Consulter les annonces
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    href="/login"
                    size="large"
                  >
                    Se connecter
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    href="/register"
                    size="large"
                  >
                    S'inscrire
                  </Button>
                </Box>
              </Box>
            ) : (
              <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />
            )
          }
        />

        {/* Routes publiques */}
        <Route path="/search" element={<RechercheBiens />} />
        <Route path="/annonce/:id" element={<AnnoncePage />} />
        <Route path="/simulateur-pret" element={<SimulateurPret />} />
        <Route path="/cgu" element={<CGUPage />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialitePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-2fa" element={<Verify2FAPage />} />

        {/* Routes protégées - Utilisateurs connectés */}
        {isAuthenticated && (
          <>
            <Route path="/matching" element={<MatchingPage />} />
            <Route path="/alertes" element={<AlertesPage />} />

            {/* Routes pour les utilisateurs (vendeurs/acheteurs) */}
            {userRole === 'user' && (
              <>
                <Route path="/dashboard" element={<VendeurDashboard />} />
                <Route path="/annonces/create" element={<CreateAnnoncePage />} />
              </>
            )}

            {/* Routes pour les admins */}
            {userRole === 'admin' && (
              <Route path="/admin" element={<AdminPage />} />
            )}
          </>
        )}

        {/* Redirection par défaut */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />
            ) : (
              <Navigate to="/" replace />
            )
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
