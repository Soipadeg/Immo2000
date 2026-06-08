import React, { useState, useCallback } from 'react';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import '../../styles/NotificationHistory.css';

/**
 * Composant pour afficher l'historique des notifications
 * Filtres, actions (lire, supprimer), pagination
 */
const NotificationHistory = ({ notificationHistory, loading, updating }) => {
  const [filters, setFilters] = useState({
    type: '',
    status: '',
  });
  const { markAsRead, deleteNotification, clearHistory, fetchNotificationHistory } =
    useNotificationPreferences();

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette notification?')) {
      await deleteNotification(notificationId);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir nettoyer tout l\'historique? Cette action est irréversible.')) {
      await clearHistory();
    }
  };

  // Filtrer les notifications
  const filteredNotifications = notificationHistory.filter((notif) => {
    if (filters.type && notif.type !== filters.type) return false;
    if (filters.status && notif.status !== filters.status) return false;
    return true;
  });

  const unreadCount = notificationHistory.filter((n) => !n.read).length;

  const typeLabels = {
    offer_received: 'Nouvelle offre',
    offer_rejected: 'Offre rejetée',
    payment_reminder: 'Rappel paiement',
    document_signing: 'Document',
    transaction_completed: 'Transaction complétée',
    message_received: 'Message',
    system_alerts: 'Alerte système',
  };

  const channelIcons = {
    email: '📧',
    push: '🔔',
    inApp: '💬',
    sms: '📱',
  };

  const statusColors = {
    sent: '#28a745',
    failed: '#dc3545',
    pending: '#ffc107',
  };

  if (loading) {
    return <div className="history-loading">Chargement de l'historique...</div>;
  }

  return (
    <div className="notification-history">
      {/* En-tête avec statistiques */}
      <div className="history-header">
        <div className="history-stats">
          <div className="stat-card">
            <span className="stat-value">{notificationHistory.length}</span>
            <span className="stat-label">Notifications totales</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: '#007bff' }}>
              {unreadCount}
            </span>
            <span className="stat-label">Non lues</span>
          </div>
        </div>

        {notificationHistory.length > 0 && (
          <button
            className="btn-clear-all"
            onClick={handleClearAll}
            disabled={updating}
          >
            🗑️ Nettoyer l'historique
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="history-filters">
        <div className="filter-group">
          <label htmlFor="filter-type">Type:</label>
          <select
            id="filter-type"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="offer_received">Nouvelle offre</option>
            <option value="payment_reminder">Rappel paiement</option>
            <option value="document_signing">Document</option>
            <option value="transaction_completed">Transaction</option>
            <option value="message_received">Message</option>
            <option value="system_alerts">Alerte système</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-status">Statut:</label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="sent">Envoyée</option>
            <option value="pending">En attente</option>
            <option value="failed">Échouée</option>
          </select>
        </div>
      </div>

      {/* Liste des notifications */}
      {filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📭</p>
          <p className="empty-message">
            {notificationHistory.length === 0
              ? 'Aucune notification pour le moment'
              : 'Aucune notification ne correspond à vos filtres'}
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${notif.read ? 'read' : 'unread'}`}
            >
              <div className="notification-content">
                <div className="notification-header">
                  <h4 className="notification-title">{notif.title}</h4>
                  <span
                    className="notification-status"
                    style={{ color: statusColors[notif.status] }}
                  >
                    {notif.status === 'sent' && '✓ Envoyée'}
                    {notif.status === 'failed' && '✗ Échouée'}
                    {notif.status === 'pending' && '⏳ En attente'}
                  </span>
                </div>

                <p className="notification-message">{notif.message}</p>

                <div className="notification-meta">
                  <span className="meta-item">
                    {channelIcons[notif.channel]} {notif.channel}
                  </span>
                  <span className="meta-item">
                    📍 {typeLabels[notif.type] || notif.type}
                  </span>
                  <span className="meta-item">
                    🕐 {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="notification-actions">
                {!notif.read && (
                  <button
                    className="action-btn read-btn"
                    onClick={() => handleMarkAsRead(notif.id)}
                    disabled={updating}
                    title="Marquer comme lue"
                  >
                    ✓
                  </button>
                )}

                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(notif.id)}
                  disabled={updating}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;
