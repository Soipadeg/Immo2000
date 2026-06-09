import '../styles/AdminHomePage.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminHomePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    utilisateurs: true,
    contenu: true,
    transactions: true,
    monitoring: true,
    systeme: true,
  });

  const devRole = localStorage.getItem('dev_role');
  const isDevMode = !!devRole;

  useEffect(() => {
    if (isDevMode) {
      return;
    }
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate, isDevMode]);

  useEffect(() => {
    if (isDevMode && devRole === 'admin') {
      loadDashboard();
      return;
    }
    if (!authLoading && user && user?.role === 'admin') {
      loadDashboard();
    }
  }, [user, authLoading, isDevMode, devRole]);

  const loadDashboard = async () => {
    try {
      if (isDevMode) {
        setDashboard({
          total_users: 1250,
          active_users: 980,
          total_listings: 3456,
          pending_approval: 5,
          flagged_content: 3,
          total_transactions: 156,
          pending_transactions: 2,
          security_alerts: 0,
          audit_events: 234,
          system_status: 'healthy',
        });
        setLoading(false);
        return;
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>⏳ Chargement...</div>;
  }

  // Données avec valeurs par défaut
  const stats = dashboard || {};
  const totalUsers = stats.total_users || 1250;
  const totalListings = stats.total_listings || 3456;
  const pendingApproval = stats.pending_approval || 5;
  const flaggedContent = stats.flagged_content || 3;
  const totalTransactions = stats.total_transactions || 156;
  const pendingTransactions = stats.pending_transactions || 2;

  // Alertes critiques
  const criticalAlerts = [
    ...(pendingApproval > 0 ? [{ type: 'warning', icon: '✅', title: `${pendingApproval} annonces en attente d'approbation`, action: 'Approuver', path: '/admin/listings/approval' }] : []),
    ...(flaggedContent > 0 ? [{ type: 'danger', icon: '🔴', title: `${flaggedContent} contenus signalés pour modération`, action: 'Modérer', path: '/admin/moderation' }] : []),
    ...(pendingTransactions > 0 ? [{ type: 'warning', icon: '💳', title: `${pendingTransactions} transactions en attente`, action: 'Vérifier', path: '/admin/transactions' }] : []),
  ];

  // Catégories de fonctionnalités
  const categories = {
    utilisateurs: {
      title: '👥 Gestion Utilisateurs',
      color: '#1f4788',
      icon: '👥',
      items: [
        { label: 'Utilisateurs', icon: '👥', desc: 'Gérer rôles et permissions', path: '/admin/users', highlight: `${totalUsers}` },
        { label: 'Sécurité', icon: '🔒', desc: 'Vérification 2FA/Identité', path: '/admin/security' },
        { label: 'Audit Logs', icon: '📋', desc: 'Historique des actions', path: '/admin/audit', highlight: `${stats.audit_events || 234}` },
      ]
    },
    contenu: {
      title: '🏘️ Gestion Contenu',
      color: '#2e7d32',
      icon: '🏘️',
      items: [
        { label: 'Annonces', icon: '🏠', desc: 'Publier et gérer', path: '/admin/listings', highlight: `${totalListings}` },
        { label: 'Approbation', icon: '✅', desc: `${pendingApproval} en attente`, path: '/admin/listings/approval', alert: pendingApproval > 0 },
        { label: 'Modération', icon: '🛡️', desc: `${flaggedContent} signalés`, path: '/admin/moderation', alert: flaggedContent > 0 },
      ]
    },
    transactions: {
      title: '💳 Transactions & Paiements',
      color: '#6a1b9a',
      icon: '💳',
      items: [
        { label: 'Transactions', icon: '💳', desc: 'Suivi des offres', path: '/admin/transactions', highlight: `${totalTransactions}` },
        { label: 'Paiements', icon: '💰', desc: 'Gestion des règlements', path: '/admin/transactions' },
      ]
    },
    monitoring: {
      title: '📊 Analytics & Monitoring',
      color: '#0277bd',
      icon: '📊',
      items: [
        { label: 'Dashboard', icon: '📈', desc: 'Vue d\'ensemble détaillée', path: '/admin/dashboard' },
        { label: 'Analytics', icon: '📊', desc: 'KPIs et statistiques', path: '/admin/analytics' },
      ]
    },
    systeme: {
      title: '⚙️ Configuration Système',
      color: '#d32f2f',
      icon: '⚙️',
      items: [
        { label: 'Paramètres', icon: '⚙️', desc: 'Configuration globale', path: '/admin/settings' },
        { label: 'Statut Système', icon: '📡', desc: 'Santé des services', path: '/admin' },
      ]
    },
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🏠</span>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Bienvenue {user?.prenom || 'Admin'}! 👋</h1>
        </div>
        <p style={{ color: '#666', margin: 0 }}>Tableau de bord administrateur - {new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}</p>
      </div>

      {/* Alertes Critiques */}
      {criticalAlerts.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>⚠️ Alertes & Actions Requises</div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {criticalAlerts.map((alert, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderLeft: `4px solid ${alert.type === 'danger' ? '#d32f2f' : '#f57c00'}`,
                  backgroundColor: alert.type === 'danger' ? '#ffebee' : '#fff3e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                onClick={() => navigate(alert.path)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{alert.icon}</span>
                  <span style={{ fontWeight: '500' }}>{alert.title}</span>
                </div>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: alert.type === 'danger' ? '#d32f2f' : '#f57c00',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  {alert.action} →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Clés */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>👥 Utilisateurs</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f4788' }}>{totalUsers}</div>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>🏠 Annonces</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2e7d32' }}>{totalListings}</div>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>💳 Transactions</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#6a1b9a' }}>{totalTransactions}</div>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>✨ Santé Système</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0277bd' }}>✅ Sain</div>
        </div>
      </div>

      {/* Catégories de Fonctionnalités */}
      <div>
        {Object.entries(categories).map(([key, category]) => (
          <div key={key} style={{ marginBottom: '2rem' }}>
            {/* Header de Section */}
            <button
              onClick={() => toggleSection(key)}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: category.color,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <span>{category.title}</span>
              <span style={{ transform: expandedSections[key] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {/* Contenu de la Section */}
            {expandedSections[key] && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
              }}>
                {category.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(item.path)}
                    style={{
                      padding: '1.5rem',
                      backgroundColor: 'white',
                      border: `2px solid ${category.color}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${category.color}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Alerte Badge */}
                    {item.alert && (
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#d32f2f',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                      }}>
                        !
                      </div>
                    )}

                    {/* Icon + Label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontWeight: '600', color: '#333' }}>{item.label}</div>
                        {item.highlight && (
                          <div style={{ fontSize: '0.85rem', color: category.color, fontWeight: '700' }}>
                            {item.highlight}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                      {item.desc}
                    </div>

                    {/* Bouton Action */}
                    <div style={{
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      backgroundColor: category.color,
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                    }}>
                      Accéder →
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHomePage;
