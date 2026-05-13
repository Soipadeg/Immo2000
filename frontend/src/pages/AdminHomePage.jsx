import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Icon,
} from '@mui/material';
import {
  Dashboard,
  People,
  Home,
  ShoppingCart,
  Settings,
  Analytics,
  History,
  Security,
  ArrowForward,
  TrendingUp,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { dashboardApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';

const AdminHomePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier si on est en mode dev
  const devRole = localStorage.getItem('dev_role');
  const isDevMode = !!devRole;

  // Log pour débugger le timing
  console.log('[AdminHomePage] Rendered with:', {
    devRole,
    isDevMode,
    user: user?.email,
    userRole: user?.role,
    authLoading,
  });

  useEffect(() => {
    // En mode dev, ne pas rediriger immédiatement - attendre que useAuth se mette à jour
    if (isDevMode) {
      return; // Skip la vérification d'authentification en mode dev
    }

    // En mode production, vérifier l'authentification
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate, isDevMode]);

  useEffect(() => {
    // En mode dev, charger le dashboard si dev_role='admin'
    if (isDevMode && devRole === 'admin') {
      loadDashboard();
      return;
    }

    // En mode production, attendre que useAuth se mette à jour
    if (!authLoading && user && user?.role === 'admin') {
      loadDashboard();
    }
  }, [user, authLoading, isDevMode, devRole]);

  const loadDashboard = async () => {
    try {
      // En mode dev, afficher des données statiques
      if (isDevMode) {
        console.log('[AdminHomePage] Dev mode detected, loading mock dashboard data');
        setDashboard({
          total_users: 1250,
          active_users: 980,
          users_by_role: {
            'admin': 5,
            'notaire': 45,
            'user': 900,
            'acheteur': 300,
          },
          total_listings: 3456,
          active_listings: 2876,
          new_listings_7d: 234,
          new_listings_30d: 845,
          new_users_7d: 56,
          new_users_30d: 234,
          active_users_7d: 678,
          never_logged_in: 120,
        });
        setError(null);
        setLoading(false);
        return;
      }

      console.log('[AdminHomePage] loadDashboard called');
      console.log('[AdminHomePage] Current localStorage:', {
        dev_role: localStorage.getItem('dev_role'),
        dev_mode: localStorage.getItem('dev_mode'),
        auth_token: localStorage.getItem('auth_token') ? 'exists' : 'not exists',
      });
      const response = await dashboardApi.getSummary();
      console.log('[AdminHomePage] Dashboard loaded successfully');
      setDashboard(response.data);
      setError(null);
    } catch (err) {
      console.error('[AdminHomePage] Error loading dashboard:', err);
      setError('Erreur lors du chargement du dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: 'Dashboard',
      description: 'Vue d\'ensemble des statistiques principales',
      icon: <Dashboard sx={{ fontSize: 40 }} />,
      path: '/admin/dashboard',
      color: '#1976d2',
      badge: 'Vue',
      badgeColor: 'info',
    },
    {
      title: 'Utilisateurs',
      description: 'Gestion des utilisateurs et rôles',
      icon: <People sx={{ fontSize: 40 }} />,
      path: '/admin/users',
      color: '#f57c00',
      badge: 'Gestion',
      badgeColor: 'warning',
      stats: dashboard?.utilisateurs_count,
    },
    {
      title: 'Annonces',
      description: 'Modération et gestion des annonces',
      icon: <Home sx={{ fontSize: 40 }} />,
      path: '/admin/listings',
      color: '#388e3c',
      badge: 'Modération',
      badgeColor: 'success',
      stats: dashboard?.annonces_count,
    },
    {
      title: 'Transactions',
      description: 'Suivi des offres et transactions',
      icon: <ShoppingCart sx={{ fontSize: 40 }} />,
      path: '/admin/transactions',
      color: '#7b1fa2',
      badge: 'Suivi',
      badgeColor: 'primary',
      stats: dashboard?.offres_count,
    },
    {
      title: 'Analytics',
      description: 'Statistiques détaillées et KPIs',
      icon: <Analytics sx={{ fontSize: 40 }} />,
      path: '/admin/analytics',
      color: '#c62828',
      badge: 'Data',
      badgeColor: 'error',
    },
    {
      title: 'Audit Trail',
      description: 'Historique des actions administratives',
      icon: <History sx={{ fontSize: 40 }} />,
      path: '/admin/audit',
      color: '#6a1b9a',
      badge: 'Logs',
      badgeColor: 'secondary',
    },
    {
      title: 'Sécurité',
      description: 'Monitoring et statut de sécurité',
      icon: <Security sx={{ fontSize: 40 }} />,
      path: '/admin/security',
      color: '#d32f2f',
      badge: 'Protection',
      badgeColor: 'error',
    },
    {
      title: 'Paramètres',
      description: 'Configuration du système',
      icon: <Settings sx={{ fontSize: 40 }} />,
      path: '/admin/settings',
      color: '#455a64',
      badge: 'Config',
      badgeColor: 'default',
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const totalUsers = dashboard?.utilisateurs_count || 0;
  const totalListings = dashboard?.annonces_count || 0;
  const totalOffers = dashboard?.offres_count || 0;
  const activeUsers = dashboard?.utilisateurs_actifs || 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          👋 Bienvenue, {user?.nom || 'Admin'}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Tableau de bord administrateur - {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* KPI Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, backgroundColor: 'rgba(25, 118, 210, 0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Utilisateurs Total
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                  {totalUsers}
                </Typography>
              </Box>
              <People sx={{ fontSize: 40, color: '#1976d2', opacity: 0.3 }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, backgroundColor: 'rgba(56, 142, 60, 0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Annonces Publiées
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                  {totalListings}
                </Typography>
              </Box>
              <Home sx={{ fontSize: 40, color: '#388e3c', opacity: 0.3 }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, backgroundColor: 'rgba(123, 31, 162, 0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Offres/Transactions
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                  {totalOffers}
                </Typography>
              </Box>
              <ShoppingCart sx={{ fontSize: 40, color: '#7b1fa2', opacity: 0.3 }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 150, 136, 0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Utilisateurs Actifs
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                  {activeUsers}
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, color: '#00796b', opacity: 0.3 }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Features Grid */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          📋 Fonctionnalités Disponibles
        </Typography>
        <Grid container spacing={2}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid ${feature.color}`,
                  backgroundColor: `${feature.color}08`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${feature.color}30`,
                    borderColor: feature.color,
                  },
                }}
                onClick={() => navigate(feature.path)}
              >
                <CardHeader
                  avatar={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: '12px',
                        backgroundColor: `${feature.color}20`,
                        color: feature.color,
                      }}
                    >
                      {feature.icon}
                    </Box>
                  }
                  action={
                    <Chip
                      label={feature.badge}
                      size="small"
                      color={feature.badgeColor}
                      variant="outlined"
                    />
                  }
                  title={feature.title}
                  titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
                />
                <CardContent sx={{ flex: 1, pt: 0 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {feature.description}
                  </Typography>
                  {feature.stats && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        borderRadius: 1,
                        mt: 'auto',
                      }}
                    >
                      <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {feature.stats} actifs
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                    fullWidth
                    size="small"
                    sx={{
                      color: feature.color,
                      borderColor: feature.color,
                      '&:hover': {
                        backgroundColor: `${feature.color}10`,
                        borderColor: feature.color,
                      },
                    }}
                    variant="outlined"
                  >
                    Accéder
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Upcoming Features */}
      <Paper sx={{ p: 3, backgroundColor: '#fff3e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Warning sx={{ mt: 0.5, color: '#f57c00' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              🚀 Prochaines Fonctionnalités
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                ✨ <strong>Système Notaire</strong> - Gestion des profils notaires et documents
              </Typography>
              <Typography variant="body2">
                💬 <strong>Chatbot IA</strong> - Assistant automatisé pour le support client
              </Typography>
              <Typography variant="body2">
                ⚡ <strong>Optimisations Performance</strong> - Réduction du bundle et E2E tests
              </Typography>
              <Typography variant="body2">
                🚀 <strong>Déploiement Production</strong> - Configuration docker et CI/CD
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          ⚡ Actions Rapides
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/admin/users')}
            sx={{ flex: 1 }}
          >
            Ajouter un Utilisateur
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/admin/analytics')}
            sx={{ flex: 1 }}
          >
            Voir les Statistiques
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/admin/audit')}
            sx={{ flex: 1 }}
          >
            Historique des Actions
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default AdminHomePage;
