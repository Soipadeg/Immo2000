/**
 * Composant racine de l'application
 */

import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { fr } from 'date-fns/locale';

// Hooks personnalisés
import { useAuth } from './hooks/useAuth';

// Composants
import ProtectedRoute from './components/ProtectedRoute';
import DynamicNavbar from './components/DynamicNavbar';
import Chatbot from './components/Chatbot';
import DevRoleWrapper from './components/DevRoleWrapper';
import DevRoleInitializer from './components/DevRoleInitializer';
import LoadingSpinner from './components/LoadingSpinner';

// Components
import VendeurDashboard from './components/VendeurDashboard';
import AdminLayout from './components/AdminLayout';

// Lazy load pages
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const Verify2FAPage = React.lazy(() => import('./pages/Verify2FAPage'));
const MatchingPage = React.lazy(() => import('./pages/MatchingPage'));
const SimulateurPret = React.lazy(() => import('./pages/SimulateurPret'));
const CreateAnnoncePage = React.lazy(() => import('./pages/CreateAnnoncePage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const AlertesPage = React.lazy(() => import('./pages/AlertesPage'));
const AnnoncePage = React.lazy(() => import('./pages/AnnoncePage'));
const CGUPage = React.lazy(() => import('./pages/CGUPage'));
const PolitiqueConfidentialitePage = React.lazy(() => import('./pages/PolitiqueConfidentialitePage'));
const GuidesPage = React.lazy(() => import('./pages/GuidesPage'));
const ModelesPage = React.lazy(() => import('./pages/ModelesPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const FavoritesPage = React.lazy(() => import('./pages/FavoritesPage'));
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'));
const AdminUsersPage = React.lazy(() => import('./pages/AdminUsersPage'));
const ModerationPage = React.lazy(() => import('./pages/ModerationPage'));
const NotaireDashboardPage = React.lazy(() => import('./pages/NotaireDashboardPage'));
const UserDashboardPage = React.lazy(() => import('./pages/UserDashboardPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));

// Admin Panel Pages (Lazy)
const AdminHomePage = React.lazy(() => import('./pages/AdminHomePage'));
const AdminUsersPageNew = React.lazy(() => import('./pages/AdminUsersPageNew'));
const AdminListingsPage = React.lazy(() => import('./pages/AdminListingsPage'));
const AdminTransactionsPage = React.lazy(() => import('./pages/AdminTransactionsPage'));
const AdminSettingsPage = React.lazy(() => import('./pages/AdminSettingsPage'));
const AdminAnalyticsPage = React.lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminAuditPage = React.lazy(() => import('./pages/AdminAuditPage'));
const AdminSecurityPage = React.lazy(() => import('./pages/AdminSecurityPage'));
const AdminNotificationsPage = React.lazy(() => import('./pages/AdminNotificationsPage'));
const DevAccessPage = React.lazy(() => import('./pages/DevAccessPage'));
const DevTransitionPage = React.lazy(() => import('./pages/DevTransitionPage'));
const DashboardRedirectPage = React.lazy(() => import('./pages/DashboardRedirectPage'));
const HomePageV2 = React.lazy(() => import('./pages/HomePageV2'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const BuyerProfilePage = React.lazy(() => import('./pages/BuyerProfilePage'));
const PublicAnnonceListPage = React.lazy(() => import('./pages/PublicAnnonceListPage'));
const CreerAnnonceEtape1 = React.lazy(() => import('./pages/CreerAnnonceEtape1'));
const CreerAnnonceEtape2 = React.lazy(() => import('./pages/CreerAnnonceEtape2'));
const CreerAnnonceEtape3 = React.lazy(() => import('./pages/CreerAnnonceEtape3'));
const CreerAnnonceEtape4 = React.lazy(() => import('./pages/CreerAnnonceEtape4'));
const VendreBienPage = React.lazy(() => import('./pages/VendreBienPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ApiStatusPage = React.lazy(() => import('./pages/ApiStatusPage'));
const MonCalendrier = React.lazy(() => import('./pages/MonCalendrier'));
const MesRendezVous = React.lazy(() => import('./pages/MesRendezVous'));
const Conversations = React.lazy(() => import('./pages/Conversations'));
const ContacterVendeur = React.lazy(() => import('./pages/ContacterVendeur'));
const OffresPage = React.lazy(() => import('./pages/OffresPage'));
const CreerOffrePage = React.lazy(() => import('./pages/CreerOffrePage'));
const RepondreOffrePage = React.lazy(() => import('./pages/RepondreOffrePage'));
const TransactionsPage = React.lazy(() => import('./pages/TransactionsPage'));
const SelectNotairePage = React.lazy(() => import('./pages/SelectNotairePage'));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));
const ValidateFeesPage = React.lazy(() => import('./pages/ValidateFeesPage'));
const SignCompromisPage = React.lazy(() => import('./pages/SignCompromisPage'));
const SignActePage = React.lazy(() => import('./pages/SignActePage'));
const TransactionDetailsPage = React.lazy(() => import('./pages/TransactionDetailsPage'));
const DocuSignCallbackPage = React.lazy(() => import('./pages/DocuSignCallbackPage'));
const EstimationPage = React.lazy(() => import('./pages/EstimationPage'));
const SlotManagementPage = React.lazy(() => import('./pages/SlotManagementPage'));
const AdminListingsApprovalPage = React.lazy(() => import('./pages/AdminListingsApprovalPage'));
const VisitFeedbackPage = React.lazy(() => import('./pages/VisitFeedbackPage'));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage'));
const TransactionActionsPage = React.lazy(() => import('./pages/TransactionActionsPage'));
const NotificationSettingsPage = React.lazy(() => import('./pages/NotificationSettingsPage'));
const AppointmentHistoryPage = React.lazy(() => import('./pages/AppointmentHistoryPage'));
const CalendarExportPage = React.lazy(() => import('./pages/CalendarExportPage'));
const PropertyStatisticsPage = React.lazy(() => import('./pages/PropertyStatisticsPage'));
const HealthCheckPage = React.lazy(() => import('./pages/HealthCheckPage'));


/**
 * Redirection pour le login (vers la page d'accueil)
 */
const LoginRedirect = () => {
  React.useEffect(() => {
    window.location.href = '/';
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
    <Router>
      {/* Navbar dynamique */}
      <DynamicNavbar
        isAuthenticated={isAuthenticated}
        userRole={user?.role}
        user={user}
        onLogout={logout}
      />

      {/* Contenu principal */}
      <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
          <Suspense fallback={<LoadingSpinner />}>
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
            <Route path="/dev/api-status" element={<ApiStatusPage />} />
            <Route path="/utilisateur/*" element={<DevRoleWrapper roleId="user" targetPath="/dashboard" />} />
            <Route path="/admin-dev/*" element={<DevRoleWrapper roleId="admin" targetPath="/admin" />} />
            <Route path="/notaire-dev/*" element={<DevRoleWrapper roleId="notaire" targetPath="/notaire" />} />

            <Route path="/" element={!isAuthenticated ? <HomePageV2 /> : <Navigate to="/dashboard" replace />} />
            <Route path="/design-system" element={<HomePage />} />
            <Route path="/login" element={<LoginRedirect />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/inscription" element={<RegisterPage />} />
            <Route path="/inscription/etape2" element={<BuyerProfilePage />} />

            {/* === TUNNEL DE CRÉATION D'ANNONCE === */}
            <Route path="/vendre" element={<VendreBienPage />} />
            <Route path="/creer-annonce/etape1" element={<CreerAnnonceEtape1 />} />
            <Route path="/creer-annonce/etape2" element={<CreerAnnonceEtape2 />} />
            <Route path="/creer-annonce/etape3" element={<ProtectedRoute element={<CreerAnnonceEtape3 />} />} />
            <Route path="/creer-annonce/etape4" element={<ProtectedRoute element={<CreerAnnonceEtape4 />} />} />

            {/* === DASHBOARD === */}
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />

            {/* === PLANIFICATION DE VISITE === */}
            <Route path="/slots" element={<ProtectedRoute element={<SlotManagementPage />} />} />
            <Route path="/feedback" element={<ProtectedRoute element={<VisitFeedbackPage />} />} />
            <Route path="/messages" element={<ProtectedRoute element={<MessagesPage />} />} />
            <Route path="/notification-settings" element={<ProtectedRoute element={<NotificationSettingsPage />} />} />
            <Route path="/appointment-history" element={<ProtectedRoute element={<AppointmentHistoryPage />} />} />
            <Route path="/calendar-export" element={<ProtectedRoute element={<CalendarExportPage />} />} />
            <Route path="/property-statistics" element={<ProtectedRoute element={<PropertyStatisticsPage />} />} />
            <Route path="/health-check" element={<ProtectedRoute element={<HealthCheckPage />} />} />
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
            <Route path="/transaction-actions" element={<ProtectedRoute element={<TransactionActionsPage />} />} />

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
            <Route path="/estimations" element={<EstimationPage />} />

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
              <Route path="moderation" element={<ModerationPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="listings" element={<AdminListingsPage />} />
              <Route path="listings/approval" element={<AdminListingsApprovalPage />} />
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
          </Suspense>
        </div>

        {/* Bouton du chatbot - widget flottant */}
        {!chatbotOpen && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 9998,
              cursor: 'pointer',
            }}
            onClick={() => setChatbotOpen(true)}
          >
            <button
              style={{
                borderRadius: '50%',
                width: 60,
                height: 60,
                minWidth: 60,
                fontSize: 24,
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              💬
            </button>
          </div>
        )}

        {/* Composant Chatbot */}
        <Chatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
      </Router>
    );
  }

  export default App;
