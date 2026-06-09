import '../styles/NotificationsPage.css';
/**
 * Page de Notifications - Gestion des notifications et préférences
 * Interface harmonisée pour notifications et settings
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert, Card, Input } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { notificationsApi } from '../services/api';

const NotificationsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // État pour les notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // État pour les préférences
  const [preferences, setPreferences] = useState({
    email_on_new_visite: true,
    email_on_new_annonce: true,
    email_on_feedback: true,
    email_on_message: true,
    email_newsletter: false,
    notification_frequency: 'immediate',
  });

  const [testEmail, setTestEmail] = useState('');

  // Charger les notifications et préférences
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadPreferences();
    }
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.list(0, 50);
      if (response.data && response.data.success) {
        setNotifications(response.data.data || []);
      }

      // Charger le count de non-lues
      try {
        const unreadResponse = await notificationsApi.getUnreadCount();
        if (unreadResponse.data) {
          setUnreadCount(unreadResponse.data.unread_count || 0);
        }
      } catch (err) {
        console.error('Erreur unread count:', err);
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    const savedPreferences = localStorage.getItem('notification_preferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  };

  const handlePreferenceChange = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFrequencyChange = (frequency) => {
    setPreferences((prev) => ({
      ...prev,
      notification_frequency: frequency,
    }));
  };

  const handleSavePreferences = () => {
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
    setSuccess('Préférences sauvegardées avec succès !');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setError('Veuillez entrer une adresse email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await notificationsApi.testEmail(testEmail);
      setSuccess(`Email de test envoyé à ${testEmail}`);
      setTestEmail('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'envoi de l\'email de test');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notification_id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationsApi.delete(notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif.notification_id !== notificationId)
      );
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?')) {
      setNotifications([]);
      setUnreadCount(0);
      setSuccess('Toutes les notifications ont été supprimées');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="notifications-page-container">
        <div className="loading-page">
          <div className="spinner"></div>
          <p>⏳ Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page-container">
      {/* Page Header Banner */}
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">🔔</span>
            <h1>Notifications</h1>
          </div>
          <p>Gérez vos notifications et vos préférences de communication</p>
        </div>
      </div>

      {/* Alertes */}
      {error && <Alert type="error" title="Erreur" message={error} />}
      {success && <Alert type="success" title="Succès" message={success} />}

      {/* Conteneur des onglets */}
      <Card className="tabs-card">
        <div className="tabs-nav">
          <button
            className={`tab-button ${tabValue === 0 ? 'active' : ''}`}
            onClick={() => setTabValue(0)}
          >
            🔔 Notifications {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
          </button>
          <button
            className={`tab-button ${tabValue === 1 ? 'active' : ''}`}
            onClick={() => setTabValue(1)}
          >
            ⚙️ Préférences
          </button>
          <button
            className={`tab-button ${tabValue === 2 ? 'active' : ''}`}
            onClick={() => setTabValue(2)}
          >
            ✉️ Test Email
          </button>
        </div>

        <div className="tabs-content">
          {/* Onglet 0: Notifications */}
          {tabValue === 0 && (
            <>
              {notifications.length > 0 && (
                <div className="notification-actions">
                  <Button
                    variant="danger"
                    size="small"
                    onClick={handleClearAll}
                  >
                    🗑️ Effacer toutes les notifications
                  </Button>
                </div>
              )}

              {notifications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔔</div>
                  <h3>Aucune notification</h3>
                  <p>Vous n'avez aucune notification pour le moment</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {notifications.map((notif) => (
                    <div
                      key={notif.notification_id}
                      className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                    >
                      <div className="notification-icon">
                        {notif.is_read ? '✓' : '🔵'}
                      </div>
                      <div className="notification-content">
                        <h4 className="notification-title">{notif.titre}</h4>
                        <p className="notification-message">{notif.message}</p>
                        <div className="notification-date">
                          {new Date(notif.date).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      <div className="notification-actions">
                        {!notif.is_read && (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleMarkAsRead(notif.notification_id)}
                          >
                            Marquer comme lue
                          </Button>
                        )}
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteNotification(notif.notification_id)}
                          title="Supprimer"
                          aria-label="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Onglet 1: Préférences */}
          {tabValue === 1 && (
            <>
              <div className="preferences-section">
                <h3 className="section-title">📧 Notifications par Email</h3>
                <div className="preferences-list">
                  <label className="preference-item">
                    <input
                      type="checkbox"
                      checked={preferences.email_on_new_visite}
                      onChange={() => handlePreferenceChange('email_on_new_visite')}
                    />
                    <span className="preference-label">
                      <strong>Nouvelles visites</strong>
                      <small>Recevoir une notification pour chaque nouvelle visite</small>
                    </span>
                  </label>

                  <label className="preference-item">
                    <input
                      type="checkbox"
                      checked={preferences.email_on_new_annonce}
                      onChange={() => handlePreferenceChange('email_on_new_annonce')}
                    />
                    <span className="preference-label">
                      <strong>Nouvelles annonces</strong>
                      <small>Recevoir les nouvelles annonces selon vos critères</small>
                    </span>
                  </label>

                  <label className="preference-item">
                    <input
                      type="checkbox"
                      checked={preferences.email_on_message}
                      onChange={() => handlePreferenceChange('email_on_message')}
                    />
                    <span className="preference-label">
                      <strong>Nouveaux messages</strong>
                      <small>Recevoir une notification pour chaque nouveau message</small>
                    </span>
                  </label>

                  <label className="preference-item">
                    <input
                      type="checkbox"
                      checked={preferences.email_on_feedback}
                      onChange={() => handlePreferenceChange('email_on_feedback')}
                    />
                    <span className="preference-label">
                      <strong>Commentaires et évaluations</strong>
                      <small>Recevoir les commentaires sur vos annonces</small>
                    </span>
                  </label>

                  <label className="preference-item">
                    <input
                      type="checkbox"
                      checked={preferences.email_newsletter}
                      onChange={() => handlePreferenceChange('email_newsletter')}
                    />
                    <span className="preference-label">
                      <strong>Newsletter</strong>
                      <small>Recevoir notre newsletter hebdomadaire</small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="preferences-section">
                <h3 className="section-title">⏱️ Fréquence des Notifications</h3>
                <div className="frequency-options">
                  <label className="frequency-item">
                    <input
                      type="radio"
                      name="frequency"
                      value="immediate"
                      checked={preferences.notification_frequency === 'immediate'}
                      onChange={() => handleFrequencyChange('immediate')}
                    />
                    <span>Immédiat</span>
                  </label>
                  <label className="frequency-item">
                    <input
                      type="radio"
                      name="frequency"
                      value="daily"
                      checked={preferences.notification_frequency === 'daily'}
                      onChange={() => handleFrequencyChange('daily')}
                    />
                    <span>Quotidien</span>
                  </label>
                  <label className="frequency-item">
                    <input
                      type="radio"
                      name="frequency"
                      value="weekly"
                      checked={preferences.notification_frequency === 'weekly'}
                      onChange={() => handleFrequencyChange('weekly')}
                    />
                    <span>Hebdomadaire</span>
                  </label>
                </div>
              </div>

              <div className="preferences-actions">
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleSavePreferences}
                >
                  💾 Enregistrer les préférences
                </Button>
              </div>
            </>
          )}

          {/* Onglet 2: Test Email */}
          {tabValue === 2 && (
            <>
              <div className="test-email-section">
                <h3 className="section-title">✉️ Envoyer un Email de Test</h3>
                <p>Testez vos préférences de notifications en envoyant un email de test</p>

                <div className="form-group">
                  <label className="form-label">Adresse Email</label>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>

                <div className="form-actions">
                  <Button
                    variant="primary"
                    size="medium"
                    onClick={handleTestEmail}
                    disabled={!testEmail || loading}
                  >
                    ✉️ Envoyer l'email de test
                  </Button>
                </div>

                <div className="info-box">
                  <p>💡 Les emails de test seront envoyés avec la même mise en forme que vos notifications réelles.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
