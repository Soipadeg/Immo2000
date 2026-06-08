import React, { useState, useEffect } from 'react';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import '../../styles/NotificationPreferencesPanel.css';

/**
 * Panel pour gérer les préférences de notifications
 * Canaux, types, fréquence, heures calmes
 */
const NotificationPreferencesPanel = ({ preferences, loading, updating }) => {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const { updateChannel, updateNotificationType, updatePreferences, sendTestNotification } =
    useNotificationPreferences();

  useEffect(() => {
    setLocalPrefs(preferences);
    setHasChanges(false);
  }, [preferences]);

  const handleChannelChange = async (channel) => {
    const newState = !localPrefs?.channels?.[channel];
    setLocalPrefs({
      ...localPrefs,
      channels: {
        ...localPrefs?.channels,
        [channel]: newState,
      },
    });
    setHasChanges(true);
    await updateChannel(channel, newState);
  };

  const handleTypeChange = async (type) => {
    const newState = !localPrefs?.types?.[type];
    setLocalPrefs({
      ...localPrefs,
      types: {
        ...localPrefs?.types,
        [type]: newState,
      },
    });
    setHasChanges(true);
    await updateNotificationType(type, newState);
  };

  const handleFrequencyChange = async (frequency) => {
    const updated = { ...localPrefs, frequency };
    setLocalPrefs(updated);
    setHasChanges(true);
    await updatePreferences(updated);
  };

  const handleQuietHoursChange = async (field, value) => {
    const updated = {
      ...localPrefs,
      quiet_hours: {
        ...localPrefs?.quiet_hours,
        [field]: value,
      },
    };
    setLocalPrefs(updated);
    setHasChanges(true);
    await updatePreferences(updated);
  };

  const handleTestNotification = async (channel) => {
    await sendTestNotification(channel);
  };

  if (loading) {
    return <div className="preferences-loading">Chargement des préférences...</div>;
  }

  if (!localPrefs) {
    return <div className="preferences-error">Erreur lors du chargement des préférences</div>;
  }

  const notificationTypeLabels = {
    offer_received: 'Nouvelle offre reçue',
    offer_rejected: 'Offre rejetée',
    payment_reminder: 'Rappel de paiement',
    document_signing: 'Document à signer',
    transaction_completed: 'Transaction complétée',
    message_received: 'Nouveau message',
    system_alerts: 'Alertes système',
    promotion: 'Promotions',
    news: 'Actualités',
  };

  const channelLabels = {
    email: '📧 Email',
    push: '🔔 Push',
    inApp: '💬 In-App',
    sms: '📱 SMS',
  };

  return (
    <div className="preferences-panel">
      {/* Section Canaux */}
      <section className="pref-section">
        <h3>📢 Canaux de Communication</h3>
        <p className="section-hint">Choisissez les canaux par lesquels vous souhaitez recevoir des notifications</p>

        <div className="channels-grid">
          {Object.entries(localPrefs.channels || {}).map(([channel, enabled]) => (
            <div key={channel} className="channel-card">
              <div className="channel-header">
                <label className="channel-label">{channelLabels[channel] || channel}</label>
                <div className="channel-actions">
                  <button
                    className={`toggle-switch ${enabled ? 'active' : ''}`}
                    onClick={() => handleChannelChange(channel)}
                    disabled={updating}
                    aria-label={`Toggle ${channel}`}
                  >
                    <span className="toggle-slider" />
                  </button>
                </div>
              </div>

              {enabled && (
                <button
                  className="test-btn"
                  onClick={() => handleTestNotification(channel)}
                  disabled={updating}
                >
                  📤 Envoyer un test
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section Types de Notifications */}
      <section className="pref-section">
        <h3>🎯 Types de Notifications</h3>
        <p className="section-hint">Sélectionnez les types d'événements pour lesquels vous souhaitez être notifié</p>

        <div className="types-grid">
          {Object.entries(localPrefs.types || {}).map(([type, enabled]) => (
            <div key={type} className="type-item">
              <input
                type="checkbox"
                id={`type-${type}`}
                checked={enabled}
                onChange={() => handleTypeChange(type)}
                disabled={updating}
              />
              <label htmlFor={`type-${type}`}>{notificationTypeLabels[type] || type}</label>
            </div>
          ))}
        </div>
      </section>

      {/* Section Fréquence */}
      <section className="pref-section">
        <h3>⏰ Fréquence des Notifications</h3>
        <p className="section-hint">À quelle fréquence souhaitez-vous recevoir des notifications?</p>

        <div className="frequency-options">
          {['immediate', 'daily', 'weekly', 'never'].map((freq) => (
            <label key={freq} className={`frequency-option ${localPrefs.frequency === freq ? 'selected' : ''}`}>
              <input
                type="radio"
                name="frequency"
                value={freq}
                checked={localPrefs.frequency === freq}
                onChange={() => handleFrequencyChange(freq)}
                disabled={updating}
              />
              <span className="frequency-label">
                {freq === 'immediate' && '⚡ Immédiatement'}
                {freq === 'daily' && '📅 Quotidiennement'}
                {freq === 'weekly' && '📆 Hebdomadairement'}
                {freq === 'never' && '🚫 Jamais'}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Section Heures Calmes */}
      <section className="pref-section">
        <h3>🌙 Heures Calmes</h3>
        <p className="section-hint">Évitez les notifications pendant ces heures</p>

        <div className="quiet-hours-container">
          <label className="quiet-toggle">
            <input
              type="checkbox"
              checked={localPrefs.quiet_hours?.enabled || false}
              onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
              disabled={updating}
            />
            <span>Activer les heures calmes</span>
          </label>

          {localPrefs.quiet_hours?.enabled && (
            <div className="quiet-hours-times">
              <div className="time-input-group">
                <label htmlFor="quiet-start">Début:</label>
                <input
                  id="quiet-start"
                  type="time"
                  value={localPrefs.quiet_hours?.start || '22:00'}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  disabled={updating}
                />
              </div>
              <div className="time-input-group">
                <label htmlFor="quiet-end">Fin:</label>
                <input
                  id="quiet-end"
                  type="time"
                  value={localPrefs.quiet_hours?.end || '08:00'}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  disabled={updating}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section Désabonnement Global */}
      <section className="pref-section danger-zone">
        <h3>⚠️ Zone Dangereuse</h3>

        <div className="danger-action">
          <div className="danger-info">
            <p className="danger-label">Désabonner de toutes les notifications</p>
            <p className="danger-hint">Vous ne recevrez plus aucune notification</p>
          </div>
          <button
            className="btn-danger"
            onClick={() => {
              if (window.confirm('Êtes-vous sûr de vouloir vous désabonner de toutes les notifications?')) {
                updatePreferences({ ...localPrefs, unsubscribe_all: true });
              }
            }}
            disabled={updating}
          >
            Se Désabonner
          </button>
        </div>
      </section>

      {/* Indicateur de modification */}
      {hasChanges && <div className="changes-indicator">💾 Les modifications sont sauvegardées automatiquement</div>}
    </div>
  );
};

export default NotificationPreferencesPanel;
