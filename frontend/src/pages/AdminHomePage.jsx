import '../styles/AdminHomePage.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Alert, FormContainer } from '@/components';
import { dashboardApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';

const AdminHomePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier si on est en mode dev
  const devRole = localStorage.getItem('dev_role');
  const isDevMode = !!devRole;

  // Log pour débugger le timing
  console.log('[AdminHomePage] Rendered with:', {
    devRole,
    isDevMode,
    user: user?.email,
    userRole: user?.role,
    authLoading,
  });

  useEffect(() => {
    // En mode dev, ne pas rediriger immédiatement - attendre que useAuth se mette à jour
    if (isDevMode) {
      return; // Skip la vérification d'authentification en mode dev
    }

    // En mode production, vérifier l'authentification
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate, isDevMode]);

  useEffect(() => {
    // En mode dev, charger le dashboard si dev_role='admin'
    if (isDevMode && devRole === 'admin') {
      loadDashboard();
      return;
    }

    // En mode production, attendre que useAuth se mette à jour
    if (!authLoading && user && user?.role === 'admin') {
      loadDashboard();
    }
  }, [user, authLoading, isDevMode, devRole]);

  const loadDashboard = async () => {
    try {
      // En mode dev, afficher des données statiques
      if (isDevMode) {
        console.log('[AdminHomePage] Dev mode detected, loading mock dashboard data');
        setDashboard({
          total_users: 1250,
          active_users: 980,
          users_by_role: {
            'admin': 5,
            'notaire': 45,
            'user': 900,
            'acheteur': 300,
          },
          total_listings: 3456,
          active_listings: 2876,
          new_listings_7d: 234,
          new_listings_30d: 845,
          new_users_7d: 56,
          new_users_30d: 234,
          active_users_7d: 678,
          never_logged_in: 120,
        });
        setError(null);
        setLoading(false);
        return;
      }

      console.log('[AdminHomePage] loadDashboard called');
      console.log('[AdminHomePage] Current localStorage:', {
        dev_role: localStorage.getItem('dev_role'),
        dev_mode: localStorage.getItem('dev_mode'),
        auth_token: localStorage.getItem('auth_token') ? 'exists' : 'not exists',
      });
      const response = await dashboardApi.getSummary();
      console.log('[AdminHomePage] Dashboard loaded successfully');
      setDashboard(response.data);
      setError(null);
    } catch (err) {
      console.error('[AdminHomePage] Error loading dashboard:', err);
      setError('Erreur lors du chargement du dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { title: 'Dashboard', description: 'Vue d\'ensemble des statistiques principales', path: '/admin/dashboard', badge: 'Vue', stats: null },
    { title: 'Utilisateurs', description: 'Gestion des utilisateurs et rôles', path: '/admin/users', badge: 'Gestion', stats: dashboard?.utilisateurs_count },
    { title: 'Annonces', description: 'Modération et gestion des annonces', path: '/admin/listings', badge: 'Modération', stats: dashboard?.annonces_count },
    { title: 'Transactions', description: 'Suivi des offres et transactions', path: '/admin/transactions', badge: 'Suivi', stats: dashboard?.offres_count },
    { title: 'Analytics', description: 'Statistiques détaillées et KPIs', path: '/admin/analytics', badge: 'Data', stats: null },
    { title: 'Audit Trail', description: 'Historique des actions administratives', path: '/admin/audit', badge: 'Logs', stats: null },
    { title: 'Sécurité', description: 'Monitoring et statut de sécurité', path: '/admin/security', badge: 'Protection', stats: null },
    { title: 'Paramètres', description: 'Configuration du système', path: '/admin/settings', badge: 'Config', stats: null },
  ];

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-spinner">⏳ Chargement...</div>
      </div>
    );
  }

  const totalUsers = dashboard?.utilisateurs_count || 0;
  const totalListings = dashboard?.annonces_count || 0;
  const totalOffers = dashboard?.offres_count || 0;
  const activeUsers = dashboard?.utilisateurs_actifs || 0;

  return (
    <>
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">🏠</span>
            <h1>Bienvenue, {user?.nom || 'Admin'}!</h1>
          </div>
          <p>Tableau de bord administrateur - {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</p>
        </div>
      </div>

      <FormContainer maxWidth="full-width">
        {error && (
          <Alert type="error" title="Erreur" message={error} />
        )}

        {/* KPI Summary Cards */}
        <div className="kpi-grid">
          <div className="stat-card stat-primary">
            <div className="stat-label">👥 Utilisateurs Total</div>
            <div className="stat-value">{totalUsers}</div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-label">🏠 Annonces Publiées</div>
            <div className="stat-value">{totalListings}</div>
        </div>

        <div className="stat-card stat-secondary">
          <div className="stat-label">🛒 Offres/Transactions</div>
          <div className="stat-value">{totalOffers}</div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-label">📈 Utilisateurs Actifs</div>
          <div className="stat-value">{activeUsers}</div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="features-section">
        <div>📋 Fonctionnalités Disponibles</div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-header">
                <div className="feature-icon">{feature.title.charAt(0)}</div>
                <div className="feature-badge">{feature.badge}</div>
              </div>
              <div>{feature.title}</div>
              <div className="feature-description">{feature.description}</div>

              {feature.stats && (
                <div className="feature-stats">
                  ✓ {feature.stats} actifs
                </div>
              )}
              <Button
                variant="secondary"
                className="feature-link"
                onClick={() => navigate(feature.path)}
              >
                Accéder →
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Features */}
      <div className="upcoming-card">
        <div className="upcoming-header">
          <div className="warning-icon">⚠️</div>
          <div>🚀 Prochaines Fonctionnalités</div>
        </div>
        <div className="upcoming-list">
          <div className="upcoming-item">✨ <strong>Système Notaire</strong> - Gestion des profils notaires et documents</div>
          <div className="upcoming-item">💬 <strong>Chatbot IA</strong> - Assistant automatisé pour le support client</div>
          <div className="upcoming-item">⚡ <strong>Optimisations Performance</strong> - Réduction du bundle et E2E tests</div>
          <div className="upcoming-item">🚀 <strong>Déploiement Production</strong> - Configuration docker et CI/CD</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div>⚡ Actions Rapides</div>
        <div className="actions-grid">
          <Button
            variant="primary"
            onClick={() => navigate('/admin/users')}
            className="action-btn"
          >
            Ajouter un Utilisateur
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/analytics')}
            className="action-btn"
          >
            Voir les Statistiques
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/audit')}
            className="action-btn"
          >
            Historique des Actions
          </Button>
        </div>
      </div>
      </FormContainer>
    </>
  );
};

export default AdminHomePage;
