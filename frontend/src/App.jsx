/**
 * Composant racine de l'application
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Button,
  Typography,
} from '@mui/material';
import { fr } from 'date-fns/locale';

// Theme professionnel
import theme from './theme';

// Hooks personnalisés
import { useAuth } from './hooks/useAuth';

// Composants
import ProtectedRoute from './components/ProtectedRoute';
import DynamicNavbar from './components/DynamicNavbar';
import Chatbot from './components/Chatbot';
import DevRoleWrapper from './components/DevRoleWrapper';
import DevRoleInitializer from './components/DevRoleInitializer';

// Pages
import VendeurDashboard from './components/VendeurDashboard';
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
import SearchPage from './pages/SearchPage';
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
import HomePageV2 from './pages/HomePageV2';
import RegisterPage from './pages/RegisterPage';
import BuyerProfilePage from './pages/BuyerProfilePage';
import PublicAnnonceListPage from './pages/PublicAnnonceListPage';
import CreerAnnonceEtape1 from './pages/CreerAnnonceEtape1';
import CreerAnnonceEtape2 from './pages/CreerAnnonceEtape2';
import CreerAnnonceEtape3 from './pages/CreerAnnonceEtape3';
import CreerAnnonceEtape4 from './pages/CreerAnnonceEtape4';
import Dashboard from './pages/Dashboard';
import MonCalendrier from './pages/MonCalendrier';
import MesRendezVous from './pages/MesRendezVous';
import Conversations from './pages/Conversations';
import ContacterVendeur from './pages/ContacterVendeur';
import OffresPage from './pages/OffresPage';
import CreerOffrePage from './pages/CreerOffrePage';
import RepondreOffrePage from './pages/RepondreOffrePage';
import TransactionsPage from './pages/TransactionsPage';
import SelectNotairePage from './pages/SelectNotairePage';
import PaymentPage from './pages/PaymentPage';
import ValidateFeesPage from './pages/ValidateFeesPage';
import SignCompromisPage from './pages/SignCompromisPage';
import SignActePage from './pages/SignActePage';
import TransactionDetailsPage from './pages/TransactionDetailsPage';
import DocuSignCallbackPage from './pages/DocuSignCallbackPage';


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
            {/* ✨ Routes de développement - Simuler les 4 rôles sans authentification */}
            <Route path="/dev/visiteur" element={<DevRoleInitializer role="visiteur" />} />
            <Route path="/dev/user" element={<DevRoleInitializer role="user" />} />
            <Route path="/dev/admin" element={<DevRoleInitializer role="admin" />} />
            <Route path="/dev/notaire" element={<DevRoleInitializer role="notaire" />} />

            {/* Routes publiques - Pas de protection */}
            {/* Route de développement - Mode sans login */}
            <Route path="/dev" element={<DevAccessPage />} />
            <Route path="/dev-transition" element={<DevTransitionPage />} />
            <Route path="/utilisateur/*" element={<DevRoleWrapper roleId="user" targetPath="/dashboard" />} />
            <Route path="/admin-dev/*" element={<DevRoleWrapper roleId="admin" targetPath="/admin" />} />
            <Route path="/notaire-dev/*" element={<DevRoleWrapper roleId="notaire" targetPath="/notaire" />} />

            <Route path="/" element={!isAuthenticated ? <HomePageV2 /> : <Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginRedirect />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/inscription" element={<RegisterPage />} />
            <Route path="/inscription/etape2" element={<BuyerProfilePage />} />

            {/* === TUNNEL DE CRÉATION D'ANNONCE === */}
            <Route path="/creer-annonce/etape1" element={<CreerAnnonceEtape1 />} />
            <Route path="/creer-annonce/etape2" element={<CreerAnnonceEtape2 />} />
            <Route path="/creer-annonce/etape3" element={<ProtectedRoute element={<CreerAnnonceEtape3 />} />} />
            <Route path="/creer-annonce/etape4" element={<ProtectedRoute element={<CreerAnnonceEtape4 />} />} />

            {/* === DASHBOARD === */}
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />

            {/* === PLANIFICATION DE VISITE === */}
            <Route path="/mon-calendrier" element={<ProtectedRoute element={<MonCalendrier />} />} />
            <Route path="/mes-rendez-vous" element={<ProtectedRoute element={<MesRendezVous />} />} />
            <Route path="/conversations/:conversationId" element={<ProtectedRoute element={<Conversations />} />} />
            <Route path="/contacter-vendeur/:annonceId" element={<ProtectedRoute element={<ContacterVendeur />} />} />

            {/* === OFFRES D'ACHAT === */}
            <Route path="/offres" element={<ProtectedRoute element={<OffresPage />} />} />
            <Route path="/creer-offre" element={<ProtectedRoute element={<CreerOffrePage />} />} />
            <Route path="/offres/:offerId/repondre" element={<ProtectedRoute element={<RepondreOffrePage />} />} />

            {/* === TRANSACTIONS NOTARIALES === */}
            <Route path="/transactions" element={<ProtectedRoute element={<TransactionsPage />} />} />
            <Route path="/transactions/:transactionId" element={<ProtectedRoute element={<TransactionDetailsPage />} />} />
            <Route path="/transactions/:transactionId/select-notaire" element={<ProtectedRoute element={<SelectNotairePage />} />} />
            <Route path="/transactions/:transactionId/validate-fees" element={<ProtectedRoute element={<ValidateFeesPage />} />} />
            <Route path="/transactions/:transactionId/sign-compromis" element={<ProtectedRoute element={<SignCompromisPage />} />} />
            <Route path="/transactions/:transactionId/payment" element={<ProtectedRoute element={<PaymentPage />} />} />
            <Route path="/transactions/:transactionId/sign-acte" element={<ProtectedRoute element={<SignActePage />} />} />

            {/* === DOCUSIGN OAUTH CALLBACK === */}
            <Route path="/docusign/callback" element={<ProtectedRoute element={<DocuSignCallbackPage />} />} />

            <Route path="/annonces" element={<PublicAnnonceListPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/verify-2fa" element={<Verify2FAPage />} />
            <Route path="/cgu" element={<CGUPage />} />
            <Route path="/politique-confidentialite" element={<PolitiqueConfidentialitePage />} />

            {/* Routes accessibles à tous (connecté ou pas) */}
            <Route path="/search" element={<SearchPage />} />
            <Route path="/annonce/:id" element={<AnnoncePage />} />
            <Route path="/simulateur-pret" element={<SimulateurPret />} />

            {/* Routes protégées - Utilisateur connecté uniquement */}
            <Route
              path="/matching"
              element={<ProtectedRoute element={<MatchingPage />} />}
            />

            <Route
              path="/alertes"
              element={<ProtectedRoute element={<AlertesPage />} />}
            />

            {/* Dashboard - Redirection intelligente selon le rôle */}
            <Route
              path="/dashboard"
              element={<ProtectedRoute element={<DashboardRedirectPage />} />}
            />

            {/* Routes pour Utilisateur (user) - Dashboard utilisateur */}
            <Route
              path="/user/dashboard"
              element={<ProtectedRoute element={<UserDashboardPage />} requiredRoles={['user']} />}
            />

            <Route
              path="/annonces/create"
              element={<ProtectedRoute element={<CreateAnnoncePage />} requiredRoles={['user']} />}
            />

            {/* Routes pour Admin uniquement */}
            {/* Admin Panel avec Layout */}
            <Route
              path="/admin/*"
              element={<ProtectedRoute element={<AdminLayout />} requiredRoles={['admin']} />}
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
              element={<ProtectedRoute element={<ProfilePage />} />}
            />

            <Route
              path="/favoris"
              element={<ProtectedRoute element={<FavoritesPage />} />}
            />

            <Route
              path="/historique"
              element={<ProtectedRoute element={<HistoryPage />} />}
            />

            <Route
              path="/notifications"
              element={<ProtectedRoute element={<NotificationsPage />} />}
            />

            {/* Routes pour Notaires uniquement */}
            <Route
              path="/notaire"
              element={<ProtectedRoute element={<NotaireDashboardPage />} requiredRoles={['notaire']} />}
            />

            <Route
              path="/notaire/dashboard"
              element={<ProtectedRoute element={<NotaireDashboardPage />} requiredRoles={['notaire']} />}
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
