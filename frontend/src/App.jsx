/**
 * Composant racine de l'application
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Button,
  Typography,
} from '@mui/material';
import { fr } from 'date-fns/locale';

// Hooks personnalisés
import { useAuth } from './hooks/useAuth';

// Composants
import DynamicNavbar from './components/DynamicNavbar';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';
import DevRoleWrapper from './components/DevRoleWrapper';

// Pages
import VendeurDashboard from './components/VendeurDashboard';
import RechercheBiens from './components/RechercheBiens';
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
import GuidesPage from './pages/GuidesPage';
import ModelesPage from './pages/ModelesPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import AdminUsersPage from './pages/AdminUsersPage';
import ModerationPage from './pages/ModerationPage';
import NotaireDashboardPage from './pages/NotaireDashboardPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotificationsPage from './pages/NotificationsPage';

// Admin Panel Components
import AdminLayout from './components/AdminLayout';
import AdminHomePage from './pages/AdminHomePage';
import AdminUsersPageNew from './pages/AdminUsersPageNew';
import AdminListingsPage from './pages/AdminListingsPage';
import AdminTransactionsPage from './pages/AdminTransactionsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminAuditPage from './pages/AdminAuditPage';
import AdminSecurityPage from './pages/AdminSecurityPage';
import DevAccessPage from './pages/DevAccessPage';
import DevTransitionPage from './pages/DevTransitionPage';
import DashboardRedirectPage from './pages/DashboardRedirectPage';


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
 * Page d'accueil pour visiteurs
 */
const HomePage = () => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <Typography variant="h4" gutterBottom>
      🏠 Immo2000
    </Typography>
    <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
      Votre plateforme immobilière
    </Typography>
    <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
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
        href="http://localhost:5000/login.html"
        size="large"
      >
        Se connecter
      </Button>
      <Button
        variant="outlined"
        color="primary"
        href="http://localhost:5000/register.html"
        size="large"
      >
        S'inscrire
      </Button>
    </Box>
  </Box>
);

/**
 * Redirection pour le login (vers port 5000)
 */
const LoginRedirect = () => {
  React.useEffect(() => {
    window.location.href = 'http://localhost:5000/login.html';
  }, []);
  return null;
};

/**
 * Redirection pour le register (vers port 5000)
 */
const RegisterRedirect = () => {
  React.useEffect(() => {
    window.location.href = 'http://localhost:5000/register.html';
  }, []);
  return null;
};

/**
 * Composant principal de l'application
 */
function App() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const [chatbotOpen, setChatbotOpen] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* Navbar dynamique */}
        <DynamicNavbar
          isAuthenticated={isAuthenticated}
          userRole={user?.role}
          user={user}
          onLogout={logout}
        />

        {/* Contenu principal */}
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Routes>
            {/* Routes publiques - Pas de protection */}
            {/* Route de développement - Mode sans login */}
            <Route path="/dev" element={<DevAccessPage />} />
            <Route path="/dev-transition" element={<DevTransitionPage />} />
            <Route path="/utilisateur/*" element={<DevRoleWrapper roleId="user" targetPath="/dashboard" />} />
            <Route path="/admin-dev/*" element={<DevRoleWrapper roleId="admin" targetPath="/admin" />} />
            <Route path="/notaire-dev/*" element={<DevRoleWrapper roleId="notaire" targetPath="/notaire" />} />

            <Route path="/" element={!isAuthenticated ? <HomePage /> : <Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginRedirect />} />
            <Route path="/register" element={<RegisterRedirect />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/verify-2fa" element={<Verify2FAPage />} />
            <Route path="/cgu" element={<CGUPage />} />
            <Route path="/politique-confidentialite" element={<PolitiqueConfidentialitePage />} />

            {/* Routes accessibles à tous (connecté ou pas) */}
            <Route path="/search" element={<RechercheBiens />} />
            <Route path="/annonce/:id" element={<AnnoncePage />} />
            <Route path="/simulateur-pret" element={<SimulateurPret />} />

            {/* Routes protégées - Utilisateur connecté uniquement */}
            <Route
              path="/matching"
              element={
                <ProtectedRoute
                  element={<MatchingPage />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['user', 'admin', 'notaire']}
                  loading={loading}
                />
              }
            />

            <Route
              path="/alertes"
              element={
                <ProtectedRoute
                  element={<AlertesPage />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['user', 'admin']}
                  loading={loading}
                />
              }
            />

            {/* Dashboard - Redirection intelligente selon le rôle */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  element={<DashboardRedirectPage />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['user', 'admin', 'notaire']}
                  loading={loading}
                />
              }
            />

            {/* Routes pour Utilisateur (user) - Dashboard utilisateur */}
            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute
                  element={<UserDashboardPage />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['user', 'admin']}
                  loading={loading}
                />
              }
            />

            <Route
              path="/annonces/create"
              element={
                <ProtectedRoute
                  element={<CreateAnnoncePage />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['user', 'admin']}
                  loading={loading}
                />
              }
            />

            {/* Routes pour Admin uniquement */}
            {/* Admin Panel avec Layout */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute
                  element={<AdminLayout />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['admin']}
                  loading={loading}
                />
              }
            >
              <Route path="" element={<AdminHomePage />} />
              <Route path="home" element={<AdminHomePage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPageNew />} />
              <Route path="listings" element={<AdminListingsPage />} />
              <Route path="transactions" element={<AdminTransactionsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="audit" element={<AdminAuditPage />} />
              <Route path="security" element={<AdminSecurityPage />} />
            </Route>

            {/* Routes pour Utilisateurs connectés - Pages publiques du contenu */}
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/modeles" element={<ModelesPage />} />

            {/* Routes pour Utilisateurs authentifiés */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute
                  element={<ProfilePage />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['user', 'admin', 'notaire']}
                  loading={loading}
                />
              }
            />

            <Route
              path="/favoris"
              element={
                <ProtectedRoute
                  element={<FavoritesPage />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['user', 'admin']}
                  loading={loading}
                />
              }
            />

            <Route
              path="/historique"
              element={
                <ProtectedRoute
                  element={<HistoryPage />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['user', 'admin']}
                  loading={loading}
                />
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute
                  element={<NotificationsPage />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['user', 'admin', 'notaire']}
                  loading={loading}
                />
              }
            />

            {/* Routes pour Notaires uniquement */}
            <Route
              path="/notaire"
              element={
                <ProtectedRoute
                  element={<NotaireDashboardPage />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['notaire']}
                  loading={loading}
                />
              }
            />

            <Route
              path="/notaire/dashboard"
              element={
                <ProtectedRoute
                  element={<NotaireDashboardPage />}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  requiredRoles={['notaire']}
                  loading={loading}
                />
              }
            />

            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>

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
      </Router>
    </ThemeProvider>
  );
}

export default App;
