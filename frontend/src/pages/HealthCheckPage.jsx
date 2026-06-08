import React, { useState } from 'react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import '../styles/HealthCheckPage.css';

/**
 * Page de vérification de l'état du système
 */
const HealthCheckPage = () => {
  const { health, services, loading, lastChecked, checkHealth, restartService } = useHealthCheck();
  const [expandedService, setExpandedService] = useState(null);

  const handleRefresh = () => {
    checkHealth();
  };

  const handleRestart = async (serviceName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir redémarrer ${serviceName}?`)) {
      await restartService(serviceName);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'unhealthy':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getHealthColor = (value) => {
    if (value < 50) return '#28a745';
    if (value < 75) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="health-check-page">
      {/* En-tête */}
      <div className="health-header">
        <h1>🚀 État du Système</h1>
        <p className="subtitle">Monitoring en temps réel de l'infrastructure</p>
      </div>

      {/* Actions */}
      <div className="health-actions">
        <button
          className="btn btn-primary"
          onClick={handleRefresh}
          disabled={loading}
        >
          🔄 Rafraîchir
        </button>
        {lastChecked && (
          <span className="last-checked">
            Dernière vérification: {lastChecked.toLocaleTimeString()}
          </span>
        )}
      </div>

      {health && (
        <>
          {/* Status Global */}
          <div className="global-status">
            <div className="status-card">
              <div className="status-icon">{getStatusIcon(health.overall)}</div>
              <h2>Statut Global</h2>
              <p className="status-text">{health.overall === 'healthy' ? '✓ Opérationnel' : '⚠️ Problèmes détectés'}</p>
            </div>

            {/* Uptime */}
            <div className="status-card">
              <div className="status-icon">⏱️</div>
              <h2>Uptime</h2>
              <p className="status-text">{health.uptime} heures</p>
            </div>

            {/* Durée Moyenne */}
            <div className="status-card">
              <div className="status-icon">📊</div>
              <h2>CPU</h2>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${health.cpu_usage}%`, backgroundColor: getHealthColor(health.cpu_usage) }}></div>
              </div>
              <p className="status-text">{health.cpu_usage}%</p>
            </div>

            {/* Mémoire */}
            <div className="status-card">
              <div className="status-icon">💾</div>
              <h2>Mémoire</h2>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${health.memory_usage}%`, backgroundColor: getHealthColor(health.memory_usage) }}></div>
              </div>
              <p className="status-text">{health.memory_usage}%</p>
            </div>

            {/* Disque */}
            <div className="status-card">
              <div className="status-icon">💿</div>
              <h2>Disque</h2>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${health.disk_usage}%`, backgroundColor: getHealthColor(health.disk_usage) }}></div>
              </div>
              <p className="status-text">{health.disk_usage}%</p>
            </div>
          </div>

          {/* Services */}
          {services.length > 0 && (
            <div className="services-section">
              <h2>🔧 Services</h2>
              <div className="services-list">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className={`service-item ${service.status}`}
                    onClick={() => setExpandedService(expandedService === index ? null : index)}
                  >
                    <div className="service-summary">
                      <span className="service-status">{getStatusIcon(service.status)}</span>
                      <span className="service-name">{service.name}</span>
                      <span className="service-response">{service.response_time}ms</span>
                      <span className="service-uptime">{service.uptime}% uptime</span>
                    </div>

                    {expandedService === index && (
                      <div className="service-details">
                        <div className="detail-row">
                          <span>Statut</span>
                          <span>{getStatusIcon(service.status)} {service.status}</span>
                        </div>
                        <div className="detail-row">
                          <span>Temps de réponse</span>
                          <span>{service.response_time}ms</span>
                        </div>
                        <div className="detail-row">
                          <span>Uptime</span>
                          <span>{service.uptime}%</span>
                        </div>
                        <div className="detail-row">
                          <span>Dernière vérification</span>
                          <span>{new Date(service.last_check).toLocaleString()}</span>
                        </div>
                        {service.status !== 'healthy' && (
                          <button
                            className="btn btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestart(service.name);
                            }}
                          >
                            🔄 Redémarrer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alertes */}
          <div className="alerts-section">
            <h2>⚠️ Alertes Système</h2>
            <div className="alert-message success">
              ✓ Tous les services sont opérationnels
            </div>
          </div>
        </>
      )}

      {loading && <div className="loading-spinner">Chargement...</div>}
    </div>
  );
};

export default HealthCheckPage;
