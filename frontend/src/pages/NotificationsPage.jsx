/**
 * Page de Notifications - Gestion des notifications et préférences
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Tab,
  Tabs,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Bell as BellIcon,
  Check as CheckIcon,
  Cancel as CloseIcon,
  Mail as MailIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Badge badgeContent={unreadCount} color="error">
            <BellIcon sx={{ fontSize: '2rem', color: '#1976d2' }} />
          </Badge>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            🔔 Notifications
          </Typography>
        </Box>
        <Typography color="text.secondary">
          Gérez vos notifications et vos préférences de communication
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ mb: 3 }}>
        <Tab icon={<BellIcon />} label="Notifications" />
        <Tab icon={<SettingsIcon />} label="Préférences" />
        <Tab icon={<MailIcon />} label="Test Email" />
      </Tabs>

      {/* Onglet 1: Notifications */}
      {tabValue === 0 && (
        <Box>
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
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <BellIcon sx={{ fontSize: '3rem', color: '#ccc', mb: 1 }} />
              <Typography color="text.secondary">
                Aucune notification pour le moment
              </Typography>
            </Paper>
          ) : (
            <List>
              {notifications.map((notif) => (
                <React.Fragment key={notif.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notif.read ? 'transparent' : '#f0f7ff',
                      borderLeft: notif.read ? 'none' : '4px solid #1976d2',
                      mb: 1,
                      borderRadius: 1,
                    }}
                  >
                    <ListItemIcon>
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
                    <ListItemText
                      primary={notif.titre}
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {notif.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {new Date(notif.date).toLocaleString('fr-FR')}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
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
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Onglet 2: Préférences */}
      {tabValue === 1 && (
        <Box>
          <Grid container spacing={3}>
            {/* Notifications par Email */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    📧 Notifications par Email
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Fréquence des Notifications */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    ⏰ Fréquence des Notifications
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Les notifications seront envoyées selon la fréquence sélectionnée.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Bouton d'enregistrement */}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSavePreferences}
              >
                💾 Enregistrer les préférences
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Onglet 3: Test Email */}
      {tabValue === 2 && (
        <Box>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              🧪 Tester l'Envoi d'Emails
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography color="text.secondary" paragraph>
              Envoyez un email de test à votre adresse pour vérifier que vous recevez
              bien les notifications.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
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
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              💡 Un email de test sera envoyé à l'adresse fournie. Vérifiez votre
              dossier de courrier indésirable si vous ne le recevez pas dans quelques
              secondes.
            </Alert>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default NotificationsPage;
