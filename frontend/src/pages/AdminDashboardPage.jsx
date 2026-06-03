import '../styles/AdminDashboardPage.css';
/**
 * TÂCHE 1: Dashboard Admin - Tableau de bord administrateur
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, analyticsApi } from '../services/adminApi';

const AdminDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suspiciousAccounts, setSuspiciousAccounts] = useState([]);


  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Ne charger les données que si l'utilisateur est authentifié et admin
    if (!authLoading && user && user.role === 'admin') {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Skip API calls in dev mode
      const devMode = localStorage.getItem('dev_mode') === 'true';
      if (devMode) {
        // Use mock data in dev mode
        setData({
          utilisateurs: { total: 250 },
          annonces: { total: 1200 },
          offres: { total: 45 },
          revenus: { valeur_totale_offres: 2750000 },
        });
        setAnalytics({
          utilisateurs_nouveaux: 15,
          annonces_creees: 23,
          offres_creees: 8,
        });
        setLoading(false);
        return;
      }

      const [dashRes, anaRes] = await Promise.all([
        dashboardApi.getSummary(),
        analyticsApi.getSummary(),
      ]);
      setData(dashRes.data?.data);
      setAnalytics(anaRes.data?.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="admin-container">
        <div className="loading-spinner">⏳ Chargement...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Données hardcodées
  const recentUsers = [
    { id: 1, prenom: 'Jean', nom: 'Dupont', email: 'jean.dupont@email.com', date: new Date().toISOString() },
    { id: 2, prenom: 'Marie', nom: 'Martin', email: 'marie.martin@email.com', date: new Date().toISOString() },
    { id: 3, prenom: 'Pierre', nom: 'Bernard', email: 'pierre.bernard@email.com', date: new Date().toISOString() },
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const stats = [
    { label: '👥 Utilisateurs', value: data?.utilisateurs?.total || 0 },
    { label: '🏠 Annonces', value: data?.annonces?.total || 0 },
    { label: '💰 Offres', value: data?.offres?.total || 0 },
    { label: '💵 Revenus', value: `€${(data?.revenus?.valeur_totale_offres || 0).toLocaleString()}` },
  ];

  return (
    <div className="admin-dashboard-page">
      <div className="page-header">
        <div>🔐 Dashboard Admin</div>
        <div>Bienvenue, Admin {user.nom}</div>
      </div>

      {/* Statistiques principales */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Alertes de sécurité */}
      {suspiciousAccounts.length > 0 && (
        <Alert type="warning" title="Alerte sécurité" message={`🚨 ${suspiciousAccounts.length} compte${suspiciousAccounts.length > 1 ? 's' : ''} suspect${suspiciousAccounts.length > 1 ? 's' : ''} détecté${suspiciousAccounts.length > 1 ? 's' : ''}. Veuillez vérifier l'onglet Sécurité.`} />
      )}

      {/* Onglets */}
      <div className="dashboard-card">
        <div className="tabs-nav">
          {['Aperçu', 'Utilisateurs récents', 'Sécurité', 'Gestion'].map((label, index) => (
            <button
              key={index}
              className={`tab-btn ${tabValue === index ? 'active' : ''}`}
              onClick={() => setTabValue(index)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {/* Onglet Aperçu */}
          {tabValue === 0 && (
            <div className="overview-grid">
              <div className="chart-box">
                <div>📈 Activité utilisateurs</div>
                <div className="chart-placeholder">[Graphique d'activité]</div>
              </div>

              <div className="chart-box">
                <div>📊 Distribution des rôles</div>
                <div className="chart-placeholder">[Graphique circulaire]</div>
              </div>

              <div className="metrics-box">
                <div>🎯 Métriques clés</div>
                <div className="metrics-grid">
                  <div className="metric-item metric-primary">
                    <div className="metric-label">Taux de croissance</div>
                    <div className="metric-value">+12.5%</div>
                  </div>
                  <div className="metric-item metric-success">
                    <div className="metric-label">Utilisateurs actifs</div>
                    <div className="metric-value">856</div>
                  </div>
                  <div className="metric-item metric-warning">
                    <div className="metric-label">Annonces en attente</div>
                    <div className="metric-value">23</div>
                  </div>
                  <div className="metric-item metric-error">
                    <div className="metric-label">Incidents signalés</div>
                    <div className="metric-value">5</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Utilisateurs récents */}
          {tabValue === 1 && (
            <div className="users-section">
              <div>👥 Nouveaux utilisateurs</div>
              <div className="divider"></div>
              <div className="users-list">
                {recentUsers.map((u) => (
                  <div key={u.id} className="user-item">
                    <div>
                      <div className="user-name">{u.prenom} {u.nom}</div>
                      <div className="user-meta">{u.email} • {new Date(u.date).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="view-all-btn">
                Voir tous les utilisateurs
              </Button>
            </div>
          )}

          {/* Onglet Sécurité */}
          {tabValue === 2 && (
            <div className="security-section">
              <div>🛡️ Comptes suspects</div>
              <div className="divider"></div>
              {suspiciousAccounts.length === 0 ? (
                <Alert type="success" title="Aucun problème" message="✅ Aucun compte suspect détecté" />
              ) : (
                <div className="suspicious-list">
                  {suspiciousAccounts.map((account) => (
                    <div key={account.id} className="suspicious-item">
                      <div className="suspicious-header">
                        <div className="suspicious-email">{account.email}</div>
                        <div className={`severity-badge severity-${account.severity}`}>
                          {account.severity === 'high' ? 'Critique' : 'Moyen'}
                        </div>
                      </div>
                      <div className="suspicious-reason">{account.raison}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Gestion */}
          {tabValue === 3 && (
            <div className="management-grid">
              <Button variant="primary" className="mgmt-btn" onClick={() => navigate('/admin/users')}>
                👥 Gérer les utilisateurs
              </Button>
              <Button variant="primary" className="mgmt-btn" onClick={() => navigate('/admin/moderation')}>
                🛡️ Modérer les annonces
              </Button>
              <Button variant="secondary" className="mgmt-btn">
                📊 Rapport mensuel
              </Button>
              <Button variant="secondary" className="mgmt-btn">
                ⚙️ Paramètres système
              </Button>
              <Button variant="secondary" className="mgmt-btn">
                📧 Gestion des emails
              </Button>
              <Button variant="secondary" className="mgmt-btn">
                🔑 Clés API
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
