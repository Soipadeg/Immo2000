import '../styles/AdminSecurityPage.css';
import React, { useState, useEffect } from 'react';
import { Button, Alert, FormContainer } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminSecurityPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [twoFaStats, setTwoFaStats] = useState(null);
  const [identityStats, setIdentityStats] = useState(null);
  const [rgpdRequests, setRgpdRequests] = useState(null);
  const [auditLogs, setAuditLogs] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      loadAllData();
      const interval = setInterval(loadAllData, 30000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading]);

  const loadAllData = async () => {
    try {
      // Utiliser des données mockées pour la démonstration
      // (Les endpoints d'admin n'existent pas encore dans le backend FastAPI)

      setStatus({
        global_status: 'secure',
        failed_actions_24h: 3,
        suspicious_ips: ['192.168.1.50'],
        active_admins: 1,
        total_users: 250
      });

      setTwoFaStats({
        enabled_count: 45,
        total_count: 250
      });

      setIdentityStats({
        verified_count: 180,
        pending_count: 15,
        total_count: 250
      });

      setRgpdRequests({
        export: 8,
        deletion: 3,
        pending: 5
      });

      // Données mockées pour les logs d'audit
      setAuditLogs([
        {
          id: 1,
          utilisateur: 'Admin Dev',
          action: 'Connexion admin',
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          status: 'success'
        },
        {
          id: 2,
          utilisateur: 'Admin Dev',
          action: 'Modification utilisateur',
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          status: 'success'
        },
        {
          id: 3,
          utilisateur: 'Admin Dev',
          action: 'Activation 2FA utilisateur',
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 10800000).toISOString(),
          status: 'success'
        }
      ]);

      setSessions({
        active: 3,
        average_duration: 45
      });

      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
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

  const twoFaEnabled = twoFaStats?.enabled_count || 0;
  const twoFaTotal = twoFaStats?.total_count || 0;
  const twoFaPercentage = twoFaTotal > 0 ? Math.round((twoFaEnabled / twoFaTotal) * 100) : 0;

  const identityVerified = identityStats?.verified_count || 0;
  const identityPending = identityStats?.pending_count || 0;
  const identityTotal = identityStats?.total_count || 0;

  const renderDashboardTab = () => (
    <>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="secondary" size="small" onClick={loadAllData} disabled={loading}>🔄 Rafraîchir</Button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="status-icon">✅</div>
          <div className="kpi-content">
            <div className="kpi-label">Statut Mondial</div>
            <div className="kpi-value">{status?.global_status || 'N/A'}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="status-icon">⚠️</div>
          <div className="kpi-content">
            <div className="kpi-label">Erreurs (24h)</div>
            <div className="kpi-value">{status?.failed_actions_24h || 0}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="status-icon">🚨</div>
          <div className="kpi-content">
            <div className="kpi-label">IPs Suspectes</div>
            <div className="kpi-value">{status?.suspicious_ips?.length || 0}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="status-icon">👨</div>
          <div className="kpi-content">
            <div className="kpi-label">Admins Actifs</div>
            <div className="kpi-value">{status?.active_admins || 0}</div>
          </div>
        </div>
      </div>

      <div className="security-card" style={{ marginTop: '1.5rem' }}>
        <div>Activités Suspectes</div>
        <div className="card-subtitle">IPs détectées comme suspectes</div>
        <table className="simple-table" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Tentatives</th>
              <th>Dernière Activité</th>
            </tr>
          </thead>
          <tbody>
            {status?.suspicious_ips?.map((ip) => (
              <tr key={ip}>
                <td><code>{ip}</code></td>
                <td>5</td>
                <td>À l'instant</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderTwoFaTab = () => (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="status-icon">🔐</div>
          <div className="kpi-content">
            <div className="kpi-label">Utilisateurs avec 2FA</div>
            <div className="kpi-value">{twoFaEnabled}/{twoFaTotal}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="status-icon">📊</div>
          <div className="kpi-content">
            <div className="kpi-label">Taux d'Adoption</div>
            <div className="kpi-value">{twoFaPercentage}%</div>
          </div>
        </div>
      </div>

      <div className="security-card">
        <div>🔐 Gestion Double Authentification TOTP</div>
        <div className="card-subtitle">Configuration et révocation de clés TOTP</div>
        <p><strong>À faire:</strong> Implémenter l'interface de gestion des clés TOTP</p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>📱 Générer de nouvelles clés TOTP</li>
          <li>🗑️ Révoquer les clés existantes</li>
          <li>🔄 Générer codes de secours</li>
          <li>📋 Exporter la liste des utilisateurs 2FA</li>
          <li>🔒 Forcer 2FA pour administrateurs</li>
        </ul>
      </div>
    </>
  );

  const renderIdentityTab = () => (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="status-icon">✅</div>
          <div className="kpi-content">
            <div className="kpi-label">Vérifiés</div>
            <div className="kpi-value">{identityVerified}/{identityTotal}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="status-icon">⏳</div>
          <div className="kpi-content">
            <div className="kpi-label">En Attente</div>
            <div className="kpi-value">{identityPending}</div>
          </div>
        </div>
      </div>

      <div className="security-card">
        <div>👤 Vérification d'Identité eIDAS/KYC</div>
        <div className="card-subtitle">Intégration Yousign/Veriff pour vérification</div>
        <p><strong>À faire:</strong> Implémenter l'interface de gestion des vérifications d'identité</p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>📋 Voir les demandes en attente</li>
          <li>✅ Approuver les vérifications</li>
          <li>❌ Rejeter avec raison</li>
          <li>🔗 Liens Yousign/Veriff</li>
          <li>📝 Historique des vérifications</li>
        </ul>
      </div>
    </>
  );

  const renderRgpdTab = () => (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="status-icon">📤</div>
          <div className="kpi-content">
            <div className="kpi-label">Demandes d'Export</div>
            <div className="kpi-value">{rgpdRequests?.export || 0}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="status-icon">🗑️</div>
          <div className="kpi-content">
            <div className="kpi-label">Demandes de Suppression</div>
            <div className="kpi-value">{rgpdRequests?.deletion || 0}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="status-icon">⏳</div>
          <div className="kpi-content">
            <div className="kpi-label">En Traitement</div>
            <div className="kpi-value">{rgpdRequests?.pending || 0}</div>
          </div>
        </div>
      </div>

      <div className="security-card">
        <div>📋 Conformité RGPD</div>
        <div className="card-subtitle">Gestion des droits et demandes RGPD</div>
        <p><strong>À faire:</strong> Implémenter l'interface de gestion RGPD</p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>📤 Droit d'accès: Export des données personnelles</li>
          <li>🗑️ Droit à l'oubli: Suppression de compte complète</li>
          <li>📋 Droit à la portabilité: Transfert de données</li>
          <li>✅ Traitement des demandes</li>
          <li>📊 Audit trail des suppressions</li>
          <li>🔐 Anonymisation des données</li>
        </ul>
      </div>
    </>
  );

  const renderAuditTab = () => (
    <>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <Button variant="secondary" size="small" onClick={loadAllData} disabled={loading}>🔄 Rafraîchir</Button>
        <Button variant="secondary" size="small">📥 Exporter</Button>
      </div>

      <div className="security-card">
        <div>Historique Audit Trail</div>
        <div className="card-subtitle">20+ événements de sécurité tracés</div>

        {auditLogs && auditLogs.length > 0 ? (
          <table className="simple-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Date/Heure</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>IP</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 50).map((log) => (
                <tr key={log.id || `${log.utilisateur}-${log.created_at}`}>
                  <td>{new Date(log.created_at || log.timestamp).toLocaleString('fr-FR')}</td>
                  <td><code>{log.utilisateur || log.user_email || log.user_id}</code></td>
                  <td><strong>{log.action}</strong></td>
                  <td><code>{log.ip_address}</code></td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: (log.status === 'success' || log.success) ? '#e6ffe6' : '#ffe6e6',
                      color: (log.status === 'success' || log.success) ? '#004d00' : '#c00',
                      fontSize: '12px'
                    }}>
                      {(log.status === 'success' || log.success) ? '✅ Succès' : '❌ Erreur'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Alert type="info" title="Info" message="Aucun log d'audit disponible" />
        )}
      </div>
    </>
  );

  const renderSessionsTab = () => (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="status-icon">👥</div>
          <div className="kpi-content">
            <div className="kpi-label">Sessions Actives</div>
            <div className="kpi-value">{sessions?.active || 0}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="status-icon">⏱️</div>
          <div className="kpi-content">
            <div className="kpi-label">Durée Moyenne</div>
            <div className="kpi-value">{sessions?.average_duration || 0} min</div>
          </div>
        </div>
      </div>

      <div className="security-card">
        <div>👥 Gestion des Sessions</div>
        <div className="card-subtitle">Contrôle et configuration des sessions utilisateur</div>
        <p><strong>À faire:</strong> Implémenter l'interface de gestion des sessions</p>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>📋 Liste des sessions actives par utilisateur</li>
          <li>🚪 Forcer la déconnexion sélective</li>
          <li>⏱️ Configurer le timeout de session</li>
          <li>🔐 Gestion des IP autorisées</li>
          <li>📊 Statistiques de session</li>
        </ul>
      </div>
    </>
  );

  return (
    <>
      <FormContainer maxWidth="full-width">
        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          color: 'white',
          marginBottom: '1.5rem'
        }}>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>🔒 Sécurité & Conformité</h1>
          <p style={{ margin: 0 }}>Dashboard complet pour la gestion de la sécurité et de la conformité RGPD</p>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #ddd',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'twofa', label: '🔐 2FA' },
            { id: 'identity', label: '👤 Identité' },
            { id: 'rgpd', label: '📋 RGPD' },
            { id: 'audit', label: '📝 Audit Trail' },
            { id: 'sessions', label: '👥 Sessions' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#667eea' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#333',
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0',
                borderBottom: activeTab === tab.id ? '3px solid #764ba2' : 'none',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '1rem' }}>
          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'twofa' && renderTwoFaTab()}
          {activeTab === 'identity' && renderIdentityTab()}
          {activeTab === 'rgpd' && renderRgpdTab()}
          {activeTab === 'audit' && renderAuditTab()}
          {activeTab === 'sessions' && renderSessionsTab()}
        </div>
      </FormContainer>
    </>
  );
};

export default AdminSecurityPage;
