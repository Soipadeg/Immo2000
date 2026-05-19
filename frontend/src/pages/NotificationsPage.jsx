import '../styles/NotificationsPage.css';
/**
 * Page de Notifications - Gestion des notifications et préférences
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert, Input } from '@/components';
// TODO: Replace MUI icons if used
import { notificationsApi } from '../services/api';

const NotificationsPage = () => {
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
    notification_frequency: 'immediate', // 'immediate', 'daily', 'weekly'
  });

  const [testEmail, setTestEmail] = useState('');

  // Charger les notifications et préférences
  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, []);

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
    // Les préférences peuvent être stockées localement ou récupérées du backend
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
      setError(
        err.response?.data?.detail || 'Erreur lors de l\'envoi de l\'email de test'
      );
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
    }
  };

  return (
    <div maxWidth="lg" sx={{ py: 4 }}>
      <div sx={{ mb: 4 }}>
        <div sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Badge badgeContent={unreadCount} color="error">
            <BellIcon sx={{ fontSize: '2rem', color: '#1976d2' }} />
          </Badge>
          <h1>
            🔔 Notifications
          </p>
        </div>
        <p>
          Gérez vos notifications et vos préférences de communication
        </p>
      </div>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <div className="tabs" value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ mb: 3 }}>
        <div className="tab" icon={<BellIcon />} label="Notifications" />
        <div className="tab" icon={<SettingsIcon />} label="Préférences" />
        <div className="tab" icon={<MailIcon />} label="Test Email" />
      </div>

      {/* Onglet 1: Notifications */}
      {tabValue === 0 && (
        <div>
          {notifications.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleClearAll}
              sx={{ mb: 2 }}
            >
              Effacer toutes les notifications
            </Button>
          )}

          {loading ? (
            <div sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </div>
          ) : notifications.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <BellIcon sx={{ fontSize: '3rem', color: '#ccc', mb: 1 }} />
              <p>
                Aucune notification pour le moment
              </p>
            </Paper>
          ) : (
            <ul>
              {notifications.map((notif) => (
                <React.Fragment key={notif.id}>
                  <ulItem
                    sx={{
                      backgroundColor: notif.read ? 'transparent' : '#f0f7ff',
                      borderLeft: notif.read ? 'none' : '4px solid #1976d2',
                      mb: 1,
                      borderRadius: 1,
                    }}
                  >
                    <ulItemIcon>
                      {notif.read ? (
                        <CheckIcon color="success" />
                      ) : (
                        <Badge
                          color="error"
                          variant="dot"
                          sx={{ mr: 1 }}
                        >
                          <BellIcon color="primary" />
                        </Badge>
                      )}
                    </ListItemIcon>
                    <ulItemText
                      primary={notif.titre}
                      secondary={
                        <div sx={{ mt: 1 }}>
                          <p>
                            {notif.message}
                          </p>
                          <p>
                            {new Date(notif.date).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      }
                    />
                    <div sx={{ display: 'flex', gap: 1 }}>
                      {!notif.read && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleMarkAsRead(notif.id)}
                        >
                          Lire
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteNotification(notif.id)}
                      >
                        <CloseIcon />
                      </IconButton>
                    </div>
                  </li>
                  <Divider />
                </React.Fragment>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Onglet 2: Préférences */}
      {tabValue === 1 && (
        <div>
          <div className="grid-container">
            {/* Notifications par Email */}
            <div className="grid-item">
              <div className="card">
                <div className="card"Content>
                  <h1>
                    📧 Notifications par Email
                  </p>
                  <Divider sx={{ mb: 2 }} />

                  <div sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.email_on_new_visite}
                          onChange={() => handlePreferenceChange('email_on_new_visite')}
                        />
                      }
                      label="Nouvelles visites programmées"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.email_on_new_annonce}
                          onChange={() =>
                            handlePreferenceChange('email_on_new_annonce')
                          }
                        />
                      }
                      label="Nouvelles annonces publiées"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.email_on_feedback}
                          onChange={() => handlePreferenceChange('email_on_feedback')}
                        />
                      }
                      label="Avis et commentaires reçus"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.email_on_message}
                          onChange={() => handlePreferenceChange('email_on_message')}
                        />
                      }
                      label="Messages privés"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.email_newsletter}
                          onChange={() =>
                            handlePreferenceChange('email_newsletter')
                          }
                        />
                      }
                      label="Newsletter hebdomadaire"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fréquence des Notifications */}
            <div className="grid-item">
              <div className="card">
                <div className="card"Content>
                  <h1>
                    ⏰ Fréquence des Notifications
                  </p>
                  <Divider sx={{ mb: 2 }} />

                  <div sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant={
                        preferences.notification_frequency === 'immediate'
                          ? 'contained'
                          : 'outlined'
                      }
                      fullWidth
                      onClick={() => handleFrequencyChange('immediate')}
                    >
                      Immédiate
                    </Button>
                    <Button
                      variant={
                        preferences.notification_frequency === 'daily'
                          ? 'contained'
                          : 'outlined'
                      }
                      fullWidth
                      onClick={() => handleFrequencyChange('daily')}
                    >
                      Quotidienne
                    </Button>
                    <Button
                      variant={
                        preferences.notification_frequency === 'weekly'
                          ? 'contained'
                          : 'outlined'
                      }
                      fullWidth
                      onClick={() => handleFrequencyChange('weekly')}
                    >
                      Hebdomadaire
                    </Button>
                  </div>

                  <p>
                    Les notifications seront envoyées selon la fréquence sélectionnée.
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton d'enregistrement */}
            <div className="grid-item">
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSavePreferences}
              >
                💾 Enregistrer les préférences
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Onglet 3: Test Email */}
      {tabValue === 2 && (
        <div>
          <Paper sx={{ p: 3 }}>
            <h1>
              🧪 Tester l'Envoi d'Emails
            </p>
            <Divider sx={{ mb: 2 }} />

            <p>
              Envoyez un email de test à votre adresse pour vérifier que vous recevez
              bien les notifications.
            </p>

            <div sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Input
                label="Adresse email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="votre@email.com"
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleTestEmail}
                disabled={loading}
                sx={{ mt: 1 }}
              >
                {loading ? <CircularProgress size={24} /> : '📨 Envoyer'}
              </Button>
            </div>

            <Alert severity="info" sx={{ mt: 3 }}>
              💡 Un email de test sera envoyé à l'adresse fournie. Vérifiez votre
              dossier de courrier indésirable si vous ne le recevez pas dans quelques
              secondes.
            </Alert>
          </Paper>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
