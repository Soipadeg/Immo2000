import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import NotificationPreferencesPanel from '../components/notifications/NotificationPreferencesPanel';
import NotificationHistory from '../components/notifications/NotificationHistory';
import NotificationTemplates from '../components/notifications/NotificationTemplates';
import '../styles/NotificationSettingsPage.css';

/**
 * Page de gestion des notifications
 * Tabs: Préférences, Historique, Templates
 */
const NotificationSettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('preferences');
  const {
    preferences,
    notificationHistory,
    templates,
    loading,
    updating,
    error,
    fetchPreferences,
    fetchNotificationHistory,
    fetchTemplates,
  } = useNotificationPreferences();

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchNotificationHistory();
    }
  }, [activeTab, fetchNotificationHistory]);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab, fetchTemplates]);

  return (
    <div className="notification-settings-page">
      {/* En-tête */}
      <div className="notification-header">
        <h1>🔔 Paramètres de Notifications</h1>
        <p className="subtitle">Gérez vos préférences de notifications et votre historique</p>
      </div>

      {/* Erreurs globales */}
      {error && <div className="error-banner">{error}</div>}

      {/* Navigation tabs */}
      <div className="notification-tabs">
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <span>⚙️ Préférences</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span>📋 Historique</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <span>📧 Templates</span>
        </button>
      </div>

      {/* Contenu des tabs */}
      <div className="notification-content">
        {/* Tab Préférences */}
        {activeTab === 'preferences' && (
          <NotificationPreferencesPanel
            preferences={preferences}
            loading={loading}
            updating={updating}
          />
        )}

        {/* Tab Historique */}
        {activeTab === 'history' && (
          <NotificationHistory
            notificationHistory={notificationHistory}
            loading={loading}
            updating={updating}
          />
        )}

        {/* Tab Templates */}
        {activeTab === 'templates' && (
          <NotificationTemplates
            templates={templates}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
