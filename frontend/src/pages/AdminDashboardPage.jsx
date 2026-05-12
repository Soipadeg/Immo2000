/**
 * TÂCHE 1: Dashboard Admin - Tableau de bord administrateur
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { dashboardApi, analyticsApi } from '../services/adminApi';

const AdminDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suspiciousAccounts, setSuspiciousAccounts] = useState([]);


  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Ne charger les données que si l'utilisateur est authentifié et admin
    if (!authLoading && user && user.role === 'admin') {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Skip API calls in dev mode
      const devMode = localStorage.getItem('dev_mode') === 'true';
      if (devMode) {
        // Use mock data in dev mode
        setData({
          utilisateurs: { total: 250 },
          annonces: { total: 1200 },
          offres: { total: 45 },
          revenus: { valeur_totale_offres: 2750000 },
        });
        setAnalytics({
          utilisateurs_nouveaux: 15,
          annonces_creees: 23,
          offres_creees: 8,
        });
        setLoading(false);
        return;
      }

      const [dashRes, anaRes] = await Promise.all([
        dashboardApi.getSummary(),
        analyticsApi.getSummary(),
      ]);
      setData(dashRes.data?.data);
      setAnalytics(anaRes.data?.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const stats = [
    { label: '👥 Utilisateurs', value: data?.utilisateurs?.total || 0 },
    { label: '🏠 Annonces', value: data?.annonces?.total || 0 },
    { label: '💰 Offres', value: data?.offres?.total || 0 },
    { label: '💵 Revenus', value: `€${(data?.revenus?.valeur_totale_offres || 0).toLocaleString()}` },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          🔐 Dashboard Admin
        </Typography>
        <Typography color="textSecondary">
          Bienvenue, Admin {user.nom}
        </Typography>
      </Box>

      {/* Statistiques principales */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card sx={{ py: 2, textAlign: 'center' }}>
              <Box sx={{ color: 'primary.main', mb: 1 }}>{stat.icon}</Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {stat.label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Alertes de sécurité */}
      {suspiciousAccounts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          🚨 {suspiciousAccounts.length} compte{suspiciousAccounts.length > 1 ? 's' : ''} suspect{suspiciousAccounts.length > 1 ? 's' : ''} détecté{suspiciousAccounts.length > 1 ? 's' : ''}. Veuillez vérifier l'onglet Sécurité.
        </Alert>
      )}

      {/* Onglets */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Aperçu" />
            <Tab label="Utilisateurs récents" />
            <Tab label="Sécurité" />
            <Tab label="Gestion" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Onglet Aperçu */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  📈 Activité utilisateurs
                </Typography>
                <Box sx={{ height: 300, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="textSecondary">[Graphique d'activité]</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} lg={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  📊 Distribution des rôles
                </Typography>
                <Box sx={{ height: 300, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="textSecondary">[Graphique circulaire]</Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  🎯 Métriques clés
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                  <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="caption">Taux de croissance</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      +12.5%
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="caption">Utilisateurs actifs</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      856
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="caption">Annonces en attente</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      23
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="caption">Incidents signalés</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      5
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Onglet Utilisateurs récents */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                👥 Nouveaux utilisateurs
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List>
                {recentUsers.map((u) => (
                  <Box key={u.id}>
                    <ListItem>
                      <ListItemText
                        primary={`${u.prenom} ${u.nom}`}
                        secondary={`${u.email} • ${new Date(u.date).toLocaleDateString('fr-FR')}`}
                      />
                    </ListItem>
                    <Divider />
                  </Box>
                ))}
              </List>
              <Button fullWidth sx={{ mt: 2 }} variant="outlined">
                Voir tous les utilisateurs
              </Button>
            </Box>
          )}

          {/* Onglet Sécurité */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                🛡️ Comptes suspects
              </Typography>
              <Divider sx={{ my: 2 }} />
              {suspiciousAccounts.length === 0 ? (
                <Alert severity="success">✅ Aucun compte suspect détecté</Alert>
              ) : (
                <List>
                  {suspiciousAccounts.map((account) => (
                    <Box key={account.id}>
                      <ListItem>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {account.email}
                            </Typography>
                            <Chip
                              label={account.severity === 'high' ? 'Critique' : 'Moyen'}
                              color={account.severity === 'high' ? 'error' : 'warning'}
                              size="small"
                            />
                          </Box>
                          <Typography variant="caption" color="textSecondary">
                            {account.raison}
                          </Typography>
                        </Box>
                      </ListItem>
                      <Divider />
                    </Box>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Onglet Gestion */}
          {tabValue === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/admin/users')}
                >
                  👥 Gérer les utilisateurs
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/admin/moderation')}
                >
                  🛡️ Modérer les annonces
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button fullWidth variant="outlined" color="primary">
                  📊 Rapport mensuel
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button fullWidth variant="outlined" color="primary">
                  ⚙️ Paramètres système
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button fullWidth variant="outlined" color="primary">
                  📧 Gestion des emails
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button fullWidth variant="outlined" color="primary">
                  🔑 Clés API
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminDashboardPage;
