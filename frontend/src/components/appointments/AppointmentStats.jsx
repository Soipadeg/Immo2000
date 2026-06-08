import React from 'react';
import '../../styles/AppointmentStats.css';

/**
 * Composant pour afficher les statistiques des rendez-vous
 */
const AppointmentStats = ({ statistics }) => {
  if (!statistics) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      case 'rescheduled':
        return '#ffc107';
      default:
        return '#007bff';
    }
  };

  return (
    <div className="appointment-stats">
      <div className="stats-grid">
        {/* Total */}
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <p className="stat-label">Total Rendez-vous</p>
            <p className="stat-value">{statistics.total}</p>
          </div>
        </div>

        {/* Complétés */}
        <div className="stat-card completed" style={{ borderLeftColor: getStatusColor('completed') }}>
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <p className="stat-label">Complétés</p>
            <p className="stat-value">{statistics.completed}</p>
            <p className="stat-percentage">
              {((statistics.completed / statistics.total) * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Annulés */}
        <div className="stat-card cancelled" style={{ borderLeftColor: getStatusColor('cancelled') }}>
          <div className="stat-icon">✗</div>
          <div className="stat-content">
            <p className="stat-label">Annulés</p>
            <p className="stat-value">{statistics.cancelled}</p>
            <p className="stat-percentage">
              {((statistics.cancelled / statistics.total) * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Re-calendrisés */}
        <div className="stat-card rescheduled" style={{ borderLeftColor: getStatusColor('rescheduled') }}>
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <p className="stat-label">Re-calendrisés</p>
            <p className="stat-value">{statistics.rescheduled}</p>
            <p className="stat-percentage">
              {((statistics.rescheduled / statistics.total) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      <div className="stats-secondary">
        {/* Durée moyenne */}
        <div className="secondary-stat">
          <h4>⏱️ Durée Moyenne</h4>
          <p className="secondary-value">{statistics.average_duration} min</p>
        </div>

        {/* Rating moyen */}
        <div className="secondary-stat">
          <h4>⭐ Évaluation Moyenne</h4>
          <p className="secondary-value">{statistics.average_rating}/5</p>
        </div>
      </div>

      {/* Par type */}
      {statistics.by_type && (
        <div className="stats-breakdown">
          <h4>📍 Par Type de Rendez-vous</h4>
          <div className="breakdown-grid">
            {Object.entries(statistics.by_type).map(([type, count]) => (
              <div key={type} className="breakdown-item">
                <span className="breakdown-label">
                  {type === 'visite' && '🏠'}
                  {type === 'consultation' && '💬'}
                  {type === 'estimation' && '💰'}
                  {type === 'signature' && '✍️'}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
                <span className="breakdown-value">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentStats;
