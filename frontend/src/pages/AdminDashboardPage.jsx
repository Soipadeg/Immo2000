/**
 * Dashboard Administrateur
 */

import React, { useState } from 'react';
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

const AdminDashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const stats = [
    { label: 'Utilisateurs totaux', value: 1245, icon: <PeopleIcon sx={{ fontSize: 40 }} /> },
    { label: 'Annonces actives', value: 3420, icon: <HomeIcon sx={{ fontSize: 40 }} /> },
    { label: 'Revenus ce mois', value: '€42,500', icon: <TrendingUpIcon sx={{ fontSize: 40 }} /> },
    { label: 'Signalements en attente', value: 12, icon: <WarningIcon sx={{ fontSize: 40 }} /> },
  ];

  const recentUsers = [
    { id: 1, email: 'new@example.com', nom: 'Nouveau', prenom: 'Utilisateur', date: '2026-05-20' },
    { id: 2, email: 'test2@example.com', nom: 'Test', prenom: 'User', date: '2026-05-19' },
    { id: 3, email: 'recent@example.com', nom: 'Recent', prenom: 'Client', date: '2026-05-18' },
  ];

  const suspiciousAccounts = [
    { id: 1, email: 'spam@example.com', raison: 'Trop de connexions échouées', severity: 'high' },
    { id: 2, email: 'bot@example.com', raison: 'Comportement anormal détecté', severity: 'medium' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
