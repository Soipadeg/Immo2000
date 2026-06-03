import '../styles/AdminSecurityPage.css';
import React, { useState, useEffect } from 'react';
import { Button, Alert } from '@/components';
import { auditApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminSecurityPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && user?.role === 'admin') {
      loadSecurityStatus();
      // Recharger toutes les 30 secondes
      const interval = setInterval(loadSecurityStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading]);

  const loadSecurityStatus = async () => {
    try {
      const response = await auditApi.getSecurityStatus();
      setStatus(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement du statut de sécurité');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-security-page">
        <div className="loading-state">⏳ Chargement du statut de sécurité...</div>
      </div>
    );
  }

  const getStatusIcon = (isOk) => isOk ? '✓' : '⚠';

  const failedActions = status?.failed_actions_24h || 0;
  const suspiciousCount = status?.suspicious_ips?.length || 0;
  const isHealthy = failedActions <= 5 && suspiciousCount === 0;

  return (
    <div className="admin-security-page">
      <div className="page-header">
        <div>🔒 Statut de Sécurité</div>
        <Button variant="secondary" size="small" onClick={loadSecurityStatus} disabled={loading}>🔄 Rafraîchir</Button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className={`status-icon ${isHealthy ? 'healthy' : 'warning'}`}>{getStatusIcon(isHealthy)}</div>
          <div className="kpi-content">
            <div className="kpi-label">Statut Global</div>
            <div className="kpi-value">{isHealthy ? 'Sûr' : 'Attention'}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className={`status-icon ${failedActions <= 5 ? 'healthy' : 'warning'}`}>{getStatusIcon(failedActions <= 5)}</div>
          <div className="kpi-content">
            <div className="kpi-label">Erreurs 24h</div>
            <div className="kpi-value">{failedActions}</div>
          </div>
          {failedActions > 0 && (
            <div className="progress-bar" style={{ width: `${Math.min((failedActions / 10) * 100, 100)}%` }}></div>
          )}
        </div>

        <div className="kpi-card">
          <div className={`status-icon ${suspiciousCount === 0 ? 'healthy' : 'warning'}`}>{getStatusIcon(suspiciousCount === 0)}</div>
          <div className="kpi-content">
            <div className="kpi-label">IPs Suspectes</div>
            <div className="kpi-value">{suspiciousCount}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="status-icon">👤</div>
          <div className="kpi-content">
            <div className="kpi-label">Admins Actifs</div>
            <div className="kpi-value">{status?.top_active_admins?.length || 0}</div>
          </div>
        </div>
      </div>

      {error && <Alert type="error" title="Erreur" message={error} />}

      <div className="security-sections">
        <div className="security-card">
          <div>Adresses IP Suspectes</div>
          <div className="card-subtitle">IPs avec &gt;5 erreurs en 24h</div>

          {status?.suspicious_ips && status.suspicious_ips.length > 0 ? (
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Adresse IP</th>
                  <th>Erreurs</th>
                </tr>
              </thead>
              <tbody>
                {status.suspicious_ips.map((ip) => (
                  <tr key={ip.ip}>
                    <td><code>{ip.ip}</code></td>
                    <td><div className="error-badge">{ip.failed_count}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Alert type="success" title="Succès" message="✅ Aucune adresse IP suspecte détectée" />
          )}
        </div>

        <div className="security-card">
          <div>Admins les Plus Actifs</div>
          <div className="card-subtitle">Derniers 7 jours</div>

          {status?.top_active_admins && status.top_active_admins.length > 0 ? (
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {status.top_active_admins.map((admin) => (
                  <tr key={admin.admin_id}>
                    <td>
                      <div className="admin-info">
                        <div className="admin-email">{admin.email}</div>
                        <div className="admin-id">ID: {admin.admin_id}</div>
                      </div>
                    </td>
                    <td><div className="action-count">{admin.actions}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Alert type="info" title="Info" message="Aucun admin actif" />
          )}
        </div>
      </div>

      {!isHealthy && (
        <div className="recommendations-panel">
          <div>⚠️ Recommandations de Sécurité</div>
          <ul>
            {failedActions > 5 && (
              <li>Nombre élevé d'erreurs détecté. Vérifiez les logs d'audit pour identifier les problèmes.</li>
            )}
            {suspiciousCount > 0 && (
              <li>Adresses IP suspectes détectées. Envisagez de bloquer ou monitorer ces IPs.</li>
            )}
            <li>Consultez la page Audit Trail pour des détails complets des actions.</li>
          </ul>
        </div>
      )}

      <div className="info-panel">
        <div>ℹ️ Informations</div>
        <ul>
          <li>Les données de sécurité sont rafraîchies automatiquement toutes les 30 secondes</li>
          <li>Les IPs suspectes sont celles avec plus de 5 erreurs dans les dernières 24h</li>
          <li>Consultez l'onglet "Audit Trail" pour voir l'historique complet des actions</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSecurityPage;
