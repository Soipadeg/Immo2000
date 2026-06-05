import '../styles/ApiStatus.css';
import React, { useState, useEffect } from 'react';
import { FormContainer, Card, Button } from '@/components';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ApiStatusPage() {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, working, broken

  // Endpoints à tester
  const ENDPOINTS_TO_TEST = [
    // Health
    { method: 'GET', url: '/health', category: 'Health', critical: true },
    { method: 'GET', url: '/api/v1/health', category: 'Health', critical: true },

    // Annonces
    { method: 'GET', url: '/api/annonces', category: 'Annonces', critical: true },
    { method: 'GET', url: '/api/v1/annonces', category: 'Annonces', critical: true },

    // Utilisateurs
    { method: 'GET', url: '/api/utilisateurs/me', category: 'Utilisateurs', critical: true },

    // Favoris
    { method: 'GET', url: '/api/favoris', category: 'Favoris', critical: false },

    // Alertes
    { method: 'GET', url: '/api/alertes', category: 'Alertes', critical: false },

    // Matching
    { method: 'POST', url: '/api/matching', category: 'Matching', critical: false },

    // Estimations
    { method: 'POST', url: '/api/estimations', category: 'Estimations', critical: false },

    // FastAPI v1
    { method: 'GET', url: '/api/v1/offres', category: 'Offres (v1)', critical: false },
    { method: 'GET', url: '/api/v1/transactions', category: 'Transactions (v1)', critical: false },
    { method: 'GET', url: '/api/v1/notaires', category: 'Notaires (v1)', critical: false },
    { method: 'GET', url: '/api/v1/paiements', category: 'Paiements (v1)', critical: false },
    { method: 'GET', url: '/api/v1/documents', category: 'Documents (v1)', critical: false },

    // Messages
    { method: 'GET', url: '/api/messages', category: 'Messagerie', critical: false },

    // Rendez-vous
    { method: 'GET', url: '/api/rendez-vous', category: 'Rendez-vous', critical: false },
  ];

  useEffect(() => {
    testAllEndpoints();
  }, []);

  const testAllEndpoints = async () => {
    setLoading(true);
    const results = [];

    for (const endpoint of ENDPOINTS_TO_TEST) {
      const result = await testEndpoint(endpoint);
      results.push(result);
    }

    setEndpoints(results);
    setLoading(false);
  };

  const testEndpoint = async (endpoint) => {
    // Use relative URLs and add /api prefix if not present
    // This allows Vite proxy to work correctly
    let fullUrl = endpoint.url;
    if (!fullUrl.startsWith('/api')) {
      fullUrl = `/api${fullUrl}`;
    }
    const startTime = Date.now();

    try {
      const response = await fetch(fullUrl, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      const duration = Date.now() - startTime;
      let status = 'working';
      let message = response.statusText;

      if (response.status === 404) {
        status = 'broken';
        message = 'Endpoint not found';
      } else if (response.status === 401 || response.status === 403) {
        status = 'working'; // On considère que c'est OK si on reçoit une erreur d'auth (endpoint existe)
        message = 'Authentication required';
      } else if (response.status >= 500) {
        status = 'error';
        message = 'Server error';
      } else if (response.status >= 400) {
        status = 'error';
        message = response.statusText;
      }

      return {
        ...endpoint,
        status,
        statusCode: response.status,
        message,
        duration,
        timestamp: new Date().toLocaleTimeString(),
      };
    } catch (error) {
      return {
        ...endpoint,
        status: 'broken',
        statusCode: 0,
        message: error.message || 'Connection failed',
        duration: Date.now() - startTime,
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'working':
        return '✅';
      case 'error':
        return '⚠️';
      case 'broken':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'working':
        return '#28a745';
      case 'error':
        return '#ffc107';
      case 'broken':
        return '#dc3545';
      default:
        return '#666';
    }
  };

  const filteredEndpoints = endpoints.filter((ep) => {
    if (filter === 'all') return true;
    if (filter === 'working') return ep.status === 'working';
    if (filter === 'broken') return ep.status !== 'working';
    return true;
  });

  const stats = {
    total: endpoints.length,
    working: endpoints.filter((ep) => ep.status === 'working').length,
    error: endpoints.filter((ep) => ep.status === 'error').length,
    broken: endpoints.filter((ep) => ep.status === 'broken').length,
  };

  // Grouper par catégorie
  const grouped = {};
  filteredEndpoints.forEach((ep) => {
    if (!grouped[ep.category]) {
      grouped[ep.category] = [];
    }
    grouped[ep.category].push(ep);
  });

  return (
    <>
      <div className="api-status-header">
        <div className="api-status-header__content">
          <div className="api-status-header__title-row">
            <span className="api-status-header__icon">🔌</span>
            <h1>API Status Checker</h1>
          </div>
          <p>Test all API endpoints and check their status</p>
        </div>
      </div>

      <FormContainer maxWidth="full-width">
        {/* Stats */}
        <div className="api-stats">
          <Card className="stat-card stat-card--total">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Endpoints</div>
          </Card>
          <Card className="stat-card stat-card--working">
            <div className="stat-number">{stats.working}</div>
            <div className="stat-label">Working ✅</div>
          </Card>
          <Card className="stat-card stat-card--error">
            <div className="stat-number">{stats.error}</div>
            <div className="stat-label">Errors ⚠️</div>
          </Card>
          <Card className="stat-card stat-card--broken">
            <div className="stat-number">{stats.broken}</div>
            <div className="stat-label">Broken ❌</div>
          </Card>
        </div>

        {/* Filter */}
        <div className="api-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({endpoints.length})
          </button>
          <button
            className={`filter-btn filter-btn--working ${filter === 'working' ? 'active' : ''}`}
            onClick={() => setFilter('working')}
          >
            Working ({stats.working})
          </button>
          <button
            className={`filter-btn filter-btn--error ${filter === 'broken' ? 'active' : ''}`}
            onClick={() => setFilter('broken')}
          >
            Broken/Error ({stats.error + stats.broken})
          </button>
          <Button variant="secondary" onClick={testAllEndpoints}>
            🔄 Refresh
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="api-loading">
            <div className="spinner"></div>
            <p>Testing all endpoints...</p>
          </div>
        )}

        {/* Results by Category */}
        {!loading && (
          <div className="api-results">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="api-category">
                <h3 className="api-category__title">{category}</h3>
                <div className="api-endpoints">
                  {items.map((endpoint, idx) => (
                    <Card key={idx} className="api-endpoint">
                      <div className="endpoint-status">
                        <span className="status-emoji">{getStatusEmoji(endpoint.status)}</span>
                        <span className="status-text">{endpoint.status.toUpperCase()}</span>
                        {endpoint.critical && <span className="critical-badge">CRITICAL</span>}
                      </div>

                      <div className="endpoint-details">
                        <div className="endpoint-header">
                          <span className="method" style={{ background: endpoint.method === 'GET' ? '#0066ff' : '#ff6600' }}>
                            {endpoint.method}
                          </span>
                          <span className="url">{endpoint.url}</span>
                        </div>

                        <div className="endpoint-info">
                          <span className="code" style={{ color: getStatusColor(endpoint.status) }}>
                            {endpoint.statusCode || 'N/A'}
                          </span>
                          <span className="message">{endpoint.message}</span>
                          <span className="duration">{endpoint.duration}ms</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && filteredEndpoints.length === 0 && (
          <Card className="empty-card">
            <div className="empty-text">No endpoints match this filter</div>
          </Card>
        )}
      </FormContainer>
    </>
  );
}
