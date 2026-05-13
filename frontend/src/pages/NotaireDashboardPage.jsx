/**
 * Dashboard Notaire - Gestion des dossiers et documents
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
  LinearProgress,
  Badge,
  AvatarGroup,
  Avatar,
  Tooltip,
  IconButton,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import ClockIcon from '@mui/icons-material/Schedule';

const NotaireDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'notaire')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const stats = [
    {
      label: 'Dossiers en cours',
      value: 8,
      icon: <DocumentScannerIcon />,
      color: 'primary',
      trend: '+2 cette semaine',
      trendUp: true
    },
    {
      label: 'Rendez-vous cette semaine',
      value: 5,
      icon: <CalendarTodayIcon />,
      color: 'success',
      trend: '2 prévus demain',
      trendUp: true
    },
    {
      label: 'Documents validés',
      value: 34,
      icon: <VerifiedUserIcon />,
      color: 'info',
      trend: '12 ce mois',
      trendUp: true
    },
  ];

  const dossiers = [
    {
      id: 1,
      titre: 'Vente maison Paris 15ème',
      client: 'Jean Dupont',
      statut: 'En attente de documents',
      progression: 45,
      montant: '€450 000',
      date: '2026-05-15',
      docs: 3
    },
    {
      id: 2,
      titre: 'Achat appartement Lyon',
      client: 'Marie Martin',
      statut: 'Documents reçus',
      progression: 75,
      montant: '€380 000',
      date: '2026-05-12',
      docs: 8
    },
    {
      id: 3,
      titre: 'Investissement immobilier',
      client: 'Pierre Bernard',
      statut: 'Signature prévue',
      progression: 95,
      montant: '€620 000',
      date: '2026-05-20',
      docs: 12
    },
    {
      id: 4,
      titre: 'Succession immobilière',
      client: 'Laure Dupuis',
      statut: 'En cours d\'évaluation',
      progression: 30,
      montant: '€280 000',
      date: '2026-06-01',
      docs: 5
    },
  ];

  const rendezVous = [
    { id: 1, temps: '09:00', client: 'Jean Dupont', dossier: 'Vente maison', lieu: 'Bureau Paris' },
    { id: 2, temps: '11:00', client: 'Marie Martin', dossier: 'Achat appartement', lieu: 'Bureau Lyon' },
    { id: 3, temps: '14:30', client: 'Pierre Bernard', dossier: 'Signature', lieu: 'Étude' },
    { id: 4, temps: '16:00', client: 'Laure Dupuis', dossier: 'Succession', lieu: 'Bureau' },
  ];

  const notifications = [
    { id: 1, texte: 'Nouveau dossier créé: Vente maison (Jean Dupont)', type: 'info' },
    { id: 2, texte: 'Documents manquants pour dossier #2', type: 'warning' },
    { id: 3, texte: 'Signature prévue demain à 14h', type: 'success' },
    { id: 4, texte: 'Document validé: acte de vente', type: 'success' },
  ];

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'notaire') {
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            👨‍⚖️ Dashboard Notaire
          </Typography>
          <Typography color="textSecondary">
            Bienvenue, <strong>{user.prenom} {user.nom}</strong> 👋
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<AddIcon />}
          sx={{ fontWeight: 'bold' }}
        >
          + Nouveau dossier
        </Button>
      </Box>

      {/* Statistiques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={4} key={index}>
            <StatCard
              title={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              trendUp={stat.trendUp}
            />
          </Grid>
        ))}
      </Grid>

      {/* Contenu principal */}
      <Grid container spacing={3}>
        {/* Dossiers et rendez-vous */}
        <Grid item xs={12} lg={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtonsDisplay="auto"
              >
                <Tab icon={<DocumentScannerIcon />} label="Dossiers en cours" iconPosition="start" />
                <Tab icon={<ClockIcon />} label="Rendez-vous" iconPosition="start" />
              </Tabs>
            </Box>

            {/* Onglet Dossiers */}
            {tabValue === 0 && (
              <CardContent sx={{ pt: 3 }}>
                {dossiers.length === 0 ? (
                  <Alert severity="info">
                    Aucun dossier. <Button color="primary">Créer un dossier</Button>
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {dossiers.map((dossier) => (
                      <Card
                        key={dossier.id}
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-2px)',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {dossier.titre}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              <Tooltip title="Client">
                                <Typography variant="body2" color="textSecondary">
                                  👤 {dossier.client}
                                </Typography>
                              </Tooltip>
                              <Tooltip title="Montant">
                                <Typography variant="body2" color="textSecondary">
                                  💰 {dossier.montant}
                                </Typography>
                              </Tooltip>
                              <Tooltip title="Documents">
                                <Badge badgeContent={dossier.docs} color="primary">
                                  <Typography variant="body2" color="textSecondary">
                                    📄
                                  </Typography>
                                </Badge>
                              </Tooltip>
                            </Box>
                          </Box>
                          <Chip
                            label={dossier.statut}
                            color={
                              dossier.statut === 'Signature prévue' ? 'success' :
                              dossier.statut === 'Documents reçus' ? 'info' :
                              'warning'
                            }
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Progression du dossier
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              {dossier.progression}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={dossier.progression}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>

                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                          📅 Créé le {new Date(dossier.date).toLocaleDateString('fr-FR')}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="contained">
                            Voir détails
                          </Button>
                          <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />}>
                            Documents
                          </Button>
                          <Button size="small" variant="outlined">
                            Modifier
                          </Button>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            )}

            {/* Onglet Rendez-vous */}
            {tabValue === 1 && (
              <CardContent sx={{ pt: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {rendezVous.map((rdv, index) => (
                    <Card
                      key={rdv.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        backgroundColor: index === 0 ? 'action.hover' : 'background.paper',
                        borderLeft: 4,
                        borderLeftColor: 'primary.main',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Chip
                            label={rdv.temps}
                            size="small"
                            icon={<ClockIcon />}
                            color="primary"
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {rdv.client} - {rdv.dossier}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            📍 {rdv.lieu}
                          </Typography>
                        </Box>
                        <Button size="small" variant="outlined">
                          Détails
                        </Button>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            )}
          </Card>
        </Grid>

        {/* Notifications et Actions rapides */}
        <Grid item xs={12} lg={4}>
          {/* Notifications */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon color="primary" />
                </Badge>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Notifications
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {notifications.map((notif) => (
                  <Alert key={notif.id} severity={notif.type} sx={{ py: 1 }}>
                    <Typography variant="body2">
                      {notif.texte}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                ⚡ Actions rapides
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  color="success"
                >
                  Nouveau dossier
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                >
                  Upload documents
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CalendarTodayIcon />}
                >
                  Calendrier
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PersonIcon />}
                >
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
