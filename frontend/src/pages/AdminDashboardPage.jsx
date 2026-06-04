import '../styles/AdminDashboardPage.css';
/**
 * TÂCHE 1: Dashboard Admin - Tableau de bord administrateur
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert, FormContainer } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, analyticsApi } from '../services/adminApi';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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
    <div className="admin-loading">
      <div className="spinner">⏳ Chargement...</div>
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

  // Données graphiques
  const activityData = [
    { date: 'Lun', utilisateurs: 45, annonces: 23, offres: 8 },
    { date: 'Mar', utilisateurs: 52, annonces: 28, offres: 12 },
    { date: 'Mer', utilisateurs: 48, annonces: 35, offres: 15 },
    { date: 'Jeu', utilisateurs: 61, annonces: 42, offres: 18 },
    { date: 'Ven', utilisateurs: 55, annonces: 38, offres: 14 },
    { date: 'Sam', utilisateurs: 67, annonces: 45, offres: 22 },
    { date: 'Dim', utilisateurs: 43, annonces: 30, offres: 10 },
  ];

  const roleDistribution = [
    { name: 'Admin', value: 5, color: '#667eea' },
    { name: 'Vendeurs', value: 120, color: '#764ba2' },
    { name: 'Acheteurs', value: 125, color: '#f093fb' },
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
    <>
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">🔐</span>
            <h1>Dashboard Admin</h1>
          </div>
          <p>Bienvenue, {user?.nom}! Gérez la plateforme en un seul endroit</p>
        </div>
      </div>

      <FormContainer maxWidth="full-width">
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
                <div>📈 Activité utilisateurs (7 derniers jours)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="utilisateurs" stroke="#667eea" strokeWidth={2} />
                    <Line type="monotone" dataKey="annonces" stroke="#764ba2" strokeWidth={2} />
                    <Line type="monotone" dataKey="offres" stroke="#f093fb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-box">
                <div>📊 Distribution des rôles</div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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
      </FormContainer>
    </>
  );
};

export default AdminDashboardPage;
