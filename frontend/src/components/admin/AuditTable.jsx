import React, { useState } from 'react';
import '../../styles/AuditTable.css';

/**
 * Composant tableau pour afficher les logs d'audit
 * Affiche les événements système avec details expandables
 */
const AuditTable = ({ logs = [], loading = false, pagination = {}, onPageChange = () => {} }) => {
  const [expandedId, setExpandedId] = useState(null);

  /**
   * Obtenir la couleur du badge résultat
   */
  const getResultColor = (result) => {
    switch (result) {
      case 'success':
        return 'badge-success';
      case 'failed':
        return 'badge-danger';
      case 'warning':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  /**
   * Obtenir l'icon résultat
   */
  const getResultIcon = (result) => {
    switch (result) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '❓';
    }
  };

  /**
   * Formater la date
   */
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR');
    } catch (e) {
      return dateString;
    }
  };

  /**
   * Toggle l'expansion d'une ligne
   */
  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="audit-table-loading">
        <div className="spinner"></div>
        <p>Chargement des logs d'audit...</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="audit-table-empty">
        <p>📋 Aucun log d'audit trouvé</p>
      </div>
    );
  }

  return (
    <div className="audit-table-container">
      <table className="audit-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}></th>
            <th style={{ width: '150px' }}>📅 Date/Heure</th>
            <th style={{ width: '150px' }}>👤 Utilisateur</th>
            <th style={{ width: '150px' }}>📋 Action</th>
            <th style={{ width: '150px' }}>📦 Ressource</th>
            <th style={{ width: '100px' }}>✅ Résultat</th>
            <th style={{ width: '100px' }}>🔍 Détails</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <React.Fragment key={log.id}>
              <tr className={`audit-row ${log.result}`}>
                <td>
                  <button
                    className="expand-btn"
                    onClick={() => toggleExpanded(log.id)}
                    title="Voir plus de détails"
                  >
                    {expandedId === log.id ? '▼' : '▶'}
                  </button>
                </td>
                <td className="mono">{formatDate(log.timestamp)}</td>
                <td>
                  <div className="user-cell">
                    <div className="user-name">{log.user?.name || 'Système'}</div>
                    <div className="user-email">{log.user?.email || '-'}</div>
                  </div>
                </td>
                <td>
                  <code className="action-badge">{log.action}</code>
                </td>
                <td>
                  <div className="resource-cell">
                    <div className="resource-type">{log.resource}</div>
                    <div className="resource-id">ID: {log.resourceId}</div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${getResultColor(log.result)}`}>
                    {getResultIcon(log.result)} {log.result}
                  </span>
                </td>
                <td>
                  <button
                    className="details-btn"
                    onClick={() => toggleExpanded(log.id)}
                  >
                    {expandedId === log.id ? 'Masquer' : 'Afficher'}
                  </button>
                </td>
              </tr>

              {/* Row d'expansion */}
              {expandedId === log.id && (
                <tr className="audit-details-row">
                  <td colSpan="7">
                    <div className="audit-details">
                      <div className="details-grid">
                        {/* Colonne 1 */}
                        <div className="details-column">
                          <div className="detail-item">
                            <label>🌐 Adresse IP</label>
                            <code>{log.ipAddress || '-'}</code>
                          </div>
                          <div className="detail-item">
                            <label>📱 User Agent</label>
                            <div className="user-agent">{log.userAgent || '-'}</div>
                          </div>
                        </div>

                        {/* Colonne 2 */}
                        <div className="details-column">
                          <div className="detail-item">
                            <label>📝 Description</label>
                            <p>{log.description || '-'}</p>
                          </div>
                        </div>

                        {/* Colonne 3 - Changements */}
                        {log.details && (
                          <div className="details-column">
                            <div className="detail-item">
                              <label>🔄 Changements</label>
                              {log.details.changes && log.details.changes.length > 0 ? (
                                <div className="changes-list">
                                  {log.details.changes.map((change, idx) => (
                                    <div key={idx} className="change-item">
                                      {change}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p>Aucun changement</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Avant/Après */}
                      {log.details && (log.details.before || log.details.after) && (
                        <div className="before-after">
                          {log.details.before && (
                            <div className="before-section">
                              <h4>📦 Avant</h4>
                              <pre>{JSON.stringify(log.details.before, null, 2)}</pre>
                            </div>
                          )}
                          {log.details.after && (
                            <div className="after-section">
                              <h4>✨ Après</h4>
                              <pre>{JSON.stringify(log.details.after, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <div className="audit-pagination">
          <div className="pagination-info">
            Affichage {pagination.skip + 1} à {Math.min(pagination.skip + pagination.limit, pagination.total)} sur {pagination.total} résultats
          </div>
          <div className="pagination-buttons">
            <button
              className="btn btn-sm"
              disabled={pagination.skip === 0}
              onClick={() => onPageChange({ skip: Math.max(0, pagination.skip - pagination.limit) })}
            >
              ← Précédent
            </button>
            <button
              className="btn btn-sm"
              disabled={pagination.skip + pagination.limit >= pagination.total}
              onClick={() => onPageChange({ skip: pagination.skip + pagination.limit })}
            >
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTable;
