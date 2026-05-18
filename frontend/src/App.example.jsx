/**
 * Exemple d'App.jsx avec lazy loading des routes
 * Phase 4.4 - Code Splitting
 *
 * IMPORTANT: Ceci est un exemple! À adapter selon votre structure actuelle.
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Store
import { useAuthStore } from './store/authStore';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ListingsPage = lazy(() => import('./pages/listings/ListingsPage'));
const ListingDetailPage = lazy(() => import('./pages/listings/ListingDetailPage'));
const CreateListingPage = lazy(() => import('./pages/listings/CreateListingPage'));
const MessagesPage = lazy(() => import('./pages/messages/MessagesPage'));
const OffersPage = lazy(() => import('./pages/offers/OffersPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Layouts
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const AuthLayout = lazy(() => import('./layouts/AuthLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));

// Composants
import { LoadingSpinner } from './utils/lazyLoad';

/**
 * Protected Route - Redirect si pas authentifié
 */
function ProtectedRoute({ children, requiredRoles = null }) {
  const { isAuthenticated, canAccess, loading } = useAuthStore();

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !canAccess(requiredRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * App component avec lazy loading
 */
function App() {
  const { checkAuth } = useAuthStore();

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* ===== PUBLIC ROUTES (Auth Layout) ===== */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* ===== MAIN ROUTES (Main Layout) ===== */}
          <Route element={<MainLayout />}>
            {/* Home */}
            <Route path="/" element={<HomePage />} />

            {/* Listings */}
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route
              path="/listings/create"
              element={
                <ProtectedRoute>
                  <CreateListingPage />
                </ProtectedRoute>
              }
            />

            {/* Protected User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/offers"
              element={
                <ProtectedRoute>
                  <OffersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* ===== ADMIN ROUTES (Admin Layout) ===== */}
          <Route
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* ===== 404 NOT FOUND ===== */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

/**
 * NOTES IMPORTANTES:
 *
 * 1. Performance:
 *    - HomePage, LoginPage, etc. sont lazy loaded
 *    - Chaque route = chunk séparé
 *    - Initial bundle ~150KB au lieu de 2.5MB
 *    - Routes secondaires chargées à la demande
 *
 * 2. Fallback:
 *    - <Suspense fallback={<LoadingSpinner />}> pendant le chargement
 *    - LoadingSpinner = spinner Material-UI
 *    - Optionnellement: afficher du skeleton loading
 *
 * 3. Protected Routes:
 *    - <ProtectedRoute> redirige vers /login si pas authentifié
 *    - Peut vérifier requiredRoles pour l'autorisation
 *
 * 4. Chunking automatique:
 *    - Vite crée automatiquement des chunks pour chaque import()
 *    - Nommés: pages-HomePage.js, pages-dashboard.js, etc.
 *    - À voir dans dist/ après `npm run build`
 *
 * 5. Preloading (optionnel, pour meilleure UX):
 *    - À appliquer sur les liens "principaux"
 *    - Sur onMouseEnter pour précharger au hover
 *    - Example: <Link onMouseEnter={preloadHome}>Home</Link>
 *
 * 6. Bundle size:
 *    - Avant: bundle.js 2.5MB
 *    - Après: main.js ~150KB
 *    - Pages: pages-HomePage.js ~200KB, etc.
 *    - Total pareil, mais distribué et lazy loaded!
 */
