import '../styles/AdminAnalyticsPage.css';
import React, { useState, useEffect } from 'react';
import { Alert, Button } from '@/components';
import { analyticsApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminAnalyticsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState(null);
  const [listings, setListings] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && user?.role === 'admin') {
      loadAllData();
    }
  }, [user, authLoading]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, usersRes, listingsRes, transRes] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getUsers(),
        analyticsApi.getListings(),
        analyticsApi.getTransactions(),
      ]);
      setSummary(sumRes.data?.data);
      setUsers(usersRes.data?.data);
      setListings(listingsRes.data?.data);
      setTransactions(transRes.data?.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#d084d0'];

  return (
    <div className="admin-analytics-page">
      <div className="page-header">
        <h1>📊 Analytics - Statistiques Avancées</h1>
      </div>

      {error && <Alert type="error" title="Erreur" message={error} />}

      {loading ? (
        <div className="admin-container">
          <div className="loading-spinner">⏳ Chargement...</div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">👥 Utilisateurs</div>
              <div className="kpi-value">{summary?.utilisateurs?.total || 0}</div>
              <div className="kpi-meta">Actifs (30j): {summary?.utilisateurs?.actifs_derniers_30_jours || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">🏠 Annonces</div>
              <div className="kpi-value">{summary?.annonces?.total || 0}</div>
              <div className="kpi-meta">Publiées: {summary?.annonces?.publiees || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">💰 Offres</div>
              <div className="kpi-value">{summary?.offres?.total || 0}</div>
              <div className="kpi-meta">Taux conv: {summary?.offres?.taux_conversion_pct || 0}%</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">💵 Revenus</div>
              <div className="kpi-value">€{(summary?.revenus?.valeur_totale_offres || 0).toLocaleString()}</div>
              <div className="kpi-meta">Moy: €{(summary?.revenus?.valeur_moyenne_offre || 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="analytics-card">
            <div className="tabs-nav">
              {['Utilisateurs', 'Annonces', 'Transactions'].map((label, i) => (
                <button
                  key={i}
                  className={`tab-btn ${tabValue === i ? 'active' : ''}`}
                  onClick={() => setTabValue(i)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="tab-content">
              {/* Tab 0: Utilisateurs */}
              {tabValue === 0 && users && (
                <>
                  <div className="charts-grid">
                    <div className="chart-box">
                      <h3>Répartition des rôles</h3>
                      <div className="chart-placeholder">[Graphique - Répartition des rôles]</div>
                    </div>
                    <div className="chart-box">
                      <h3>Croissance</h3>
                      <div className="chart-placeholder">[Graphique - Croissance]</div>
                    </div>
                  </div>

                  {users.top_vendeurs && users.top_vendeurs.length > 0 && (
                    <div className="table-section">
                      <h3>Top vendeurs</h3>
                      <div className="table-wrapper">
                        <div className="table-header">
                          <div>Nom</div>
                          <div>Email</div>
                          <div>Annonces</div>
                          <div>Vendues</div>
                        </div>
                        {users.top_vendeurs.map((seller) => (
                          <div key={seller.user_id} className="table-row">
                            <div>{seller.nom}</div>
                            <div>{seller.email}</div>
                            <div>{seller.nombre_annonces}</div>
                            <div>{seller.annonces_vendues}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tab 1: Annonces */}
              {tabValue === 1 && listings && (
                <>
                  <div className="charts-grid">
                    <div className="chart-box">
                      <h3>Par statut</h3>
                      <div className="chart-placeholder">[Graphique - Statuts]</div>
                    </div>
                    <div className="chart-box">
                      <h3>Par type</h3>
                      <div className="chart-placeholder">[Graphique - Types]</div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 2: Transactions */}
              {tabValue === 2 && transactions && (
                <>
                  <div className="charts-grid">
                    <div className="chart-box">
                      <h3>Évolution des transactions</h3>
                      <div className="chart-placeholder">[Graphique - Transactions]</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminAnalyticsPage;
