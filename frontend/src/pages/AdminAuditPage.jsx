import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useAuditLogs } from '../hooks/useAuditLogs';
import AuditFilters from '../components/admin/AuditFilters';
import AuditTable from '../components/admin/AuditTable';
import { Button, FormContainer, Alert } from '@/components';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart,
  Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import '../styles/AdminAuditPage.css';

const AdminAuditPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    logs,
    stats,
    loading,
    error,
    pagination,
    fetchAuditLogs,
    fetchAuditStats,
    exportLogs,
    setPagination,
  } = useAuditLogs();

  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({});

  // Vérifier l'authentification
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Charger les logs et stats au montage
  useEffect(() => {
    if (!authLoading && user && user.role === 'admin') {
      fetchAuditLogs(filters);
      fetchAuditStats();
    }
  }, [user, authLoading, fetchAuditLogs, fetchAuditStats]);

  /**
   * Appliquer les filtres
   */
  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setPagination({ skip: 0, limit: 20, total: 0 });
    fetchAuditLogs({ ...newFilters, skip: 0 });
  };

  /**
   * Réinitialiser les filtres
   */
  const handleReset = () => {
    setFilters({});
    setPagination({ skip: 0, limit: 20, total: 0 });
    fetchAuditLogs({ skip: 0 });
  };

  /**
   * Exporter les logs
   */
  const handleExport = (format, exportFilters) => {
    exportLogs(format, exportFilters);
  };

  /**
   * Changer de page
   */
  const handlePageChange = (newPagination) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
    fetchAuditLogs({ ...filters, ...newPagination });
  };

  // Préparer les données pour les graphiques
  const actionChartData = stats.byAction
    ? Object.entries(stats.byAction).map(([key, value]) => ({
        name: key,
        value: value,
      }))
    : [];

  const resultChartData = stats.byResult
    ? Object.entries(stats.byResult).map(([key, value]) => ({
        name: key === 'success' ? 'Succès' : key === 'failed' ? 'Erreur' : 'Attention',
        value: value,
        fill: key === 'success' ? '#28a745' : key === 'failed' ? '#dc3545' : '#ffc107',
      }))
    : [];

  return (
    <>
      <FormContainer>
        {/* Header */}
        <div className="audit-header">
          <div className="audit-header__title">
            <h1>📊 Audit Logs - Suivi des Événements Système</h1>
            <p>Consultez et analysez tous les événements du système en temps réel</p>
          </div>
          <div className="audit-header__actions">
            <Button
              variant="secondary"
              className="btn-sm"
              onClick={() => {
                fetchAuditLogs(filters);
                fetchAuditStats();
              }}
            >
              🔄 Rafraîchir
            </Button>
            <Button
              variant="outline"
              className="btn-sm"
              onClick={() => navigate('/admin')}
            >
              ← Retour
            </Button>
          </div>
        </div>

        {/* Alertes */}
        {error && (
          <Alert type="warning" title="⚠️ Attention" message={error} />
        )}

        {/* Stats Cards */}
        <div className="audit-stats">
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{stats.totalEvents || 0}</h3>
              <p>Total d'événements</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.byResult?.success || 0}</h3>
              <p>Opérations réussies</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{stats.byResult?.failed || 0}</h3>
              <p>Erreurs</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>{stats.byResult?.warning || 0}</h3>
              <p>Avertissements</p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="audit-tabs">
          <div className="tabs-nav">
            {['Événements', 'Statistiques'].map((label, index) => (
              <button
                key={index}
                className={`tab-btn ${activeTab === index ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {/* Onglet Événements */}
            {activeTab === 0 && (
              <div className="events-section">
                <AuditFilters
                  onFilter={handleFilter}
                  onReset={handleReset}
                  onExport={handleExport}
                />
                <AuditTable
                  logs={logs}
                  loading={loading}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

            {/* Onglet Statistiques */}
            {activeTab === 1 && (
              <div className="stats-section">
                <div className="stats-grid">
                  {/* Chart Résultats */}
                  <div className="chart-card">
                    <h3>📊 Répartition des Résultats</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={resultChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, fill }) => (
                            <span style={{ color: fill, fontSize: '12px' }}>
                              {name}: {value}
                            </span>
                          )}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {resultChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} événements`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart Actions */}
                  <div className="chart-card">
                    <h3>📋 Top Actions</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={actionChartData.slice(0, 5)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={190} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#007bff" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tableau Détaillé */}
                <div className="stats-detailed">
                  <h3>📈 Statistiques Détaillées</h3>
                  <div className="stats-table">
                    <div className="stats-row">
                      <div className="stats-cell header">Métrique</div>
                      <div className="stats-cell header">Valeur</div>
                      <div className="stats-cell header">Pourcentage</div>
                    </div>

                    {/* Par résultat */}
                    {stats.byResult && Object.entries(stats.byResult).map(([key, value]) => (
                      <div key={`result-${key}`} className="stats-row">
                        <div className="stats-cell">
                          {key === 'success' ? '✅ Succès' : key === 'failed' ? '❌ Erreur' : '⚠️ Attention'}
                        </div>
                        <div className="stats-cell">{value}</div>
                        <div className="stats-cell">
                          {stats.totalEvents > 0 ? ((value / stats.totalEvents) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="stats-row total">
                      <div className="stats-cell"><strong>Total</strong></div>
                      <div className="stats-cell"><strong>{stats.totalEvents || 0}</strong></div>
                      <div className="stats-cell"><strong>100%</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="audit-help">
          <h3>❓ Comment utiliser?</h3>
          <ul>
            <li><strong>Filtres:</strong> Utilisez les filtres pour chercher des événements spécifiques</li>
            <li><strong>Expansion:</strong> Cliquez sur une ligne pour voir les détails complets de l'événement</li>
            <li><strong>Export:</strong> Exportez les logs en CSV ou JSON pour l'archivage</li>
            <li><strong>Statistiques:</strong> Consultez les graphiques pour une vue d'ensemble</li>
            <li><strong>Pagination:</strong> Les résultats sont paginés pour une meilleure performance</li>
          </ul>
        </div>
      </FormContainer>
    </>
  );
};

export default AdminAuditPage;
