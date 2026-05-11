/**
 * Dashboard Notaire
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
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import NotificationsIcon from '@mui/icons-material/Notifications';

const NotaireDashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const stats = [
    { label: 'Dossiers en cours', value: 5, icon: <DocumentScannerIcon />, color: 'primary' },
    { label: 'Rendez-vous cette semaine', value: 3, icon: <CalendarTodayIcon />, color: 'success' },
    { label: 'Documents validés', value: 12, icon: <VerifiedUserIcon />, color: 'info' },
  ];

  const dossiers = [
    { id: 1, titre: 'Vente maison Paris 15ème', client: 'Jean Dupont', statut: 'En attente de documents', date: '2026-05-15' },
    { id: 2, titre: 'Achat appartement Lyon', client: 'Marie Martin', statut: 'Documents reçus', date: '2026-05-12' },
    { id: 3, titre: 'Investissement immobilier', client: 'Pierre Bernard', statut: 'Signature prévue', date: '2026-05-20' },
  ];

  const notifications = [
    'Nouveau dossier créé: Vente maison (Jean Dupont)',
    'Documents manquants pour dossier #2',
    'Signature prévue demain à 14h',
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'notaire') {
    navigate('/');
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
        👨‍⚖️ Dashboard Notaire
      </Typography>
      <Typography color="textSecondary" sx={{ mb: 4 }}>
        Bienvenue, {user?.prenom} {user?.nom}
      </Typography>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={4} key={index}>
            <Card sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ fontSize: 40, mb: 1, color: `${stat.color}.main` }}>
                {stat.icon}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {stat.value}
              </Typography>
              <Typography color="textSecondary">{stat.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Contenu principal */}
      <Grid container spacing={3}>
        {/* Dossiers */}
        <Grid item xs={12} lg={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Dossiers en cours" />
                <Tab label="Calendrier" />
              </Tabs>
            </Box>

            {tabValue === 0 && (
              <CardContent>
                {dossiers.map((dossier, index) => (
                  <Box key={dossier.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {dossier.titre}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Client: {dossier.client}
                        </Typography>
                      </Box>
                      <Chip
                        label={dossier.statut}
                        color={dossier.statut === 'Signature prévue' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                      📅 {new Date(dossier.date).toLocaleDateString('fr-FR')}
                    </Typography>
                    <Button size="small" color="primary">
                      Voir détails
                    </Button>
                    {index < dossiers.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))}
              </CardContent>
            )}

            {tabValue === 1 && (
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="textSecondary">
                  📅 Calendrier des rendez-vous à venir
                </Typography>
              </CardContent>
            )}
          </Card>
        </Grid>

        {/* Notifications et Documents */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon /> Notifications
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List sx={{ p: 0 }}>
                {notifications.map((notif, index) => (
                  <ListItem key={index} sx={{ py: 1 }}>
                    <ListItemText
                      primary={notif}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Actions rapides
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button fullWidth variant="contained" color="primary">
                  Créer un dossier
                </Button>
                <Button fullWidth variant="outlined" color="primary">
                  Uploads de documents
                </Button>
                <Button fullWidth variant="outlined" color="primary">
                  Calendrier
                </Button>
                <Button fullWidth variant="outlined" color="primary">
                  Clients
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NotaireDashboardPage;
