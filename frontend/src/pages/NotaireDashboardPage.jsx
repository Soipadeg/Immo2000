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
import { notairesApi } from '../services/api/transactions';

const NotaireDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dossiers, setDossiers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'notaire')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Load dossiers from API
  useEffect(() => {
    if (user && user.notaire_id) {
      loadDossiers();
    }
  }, [user]);

  const loadDossiers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notairesApi.getPendingDossiers(user.notaire_id, 0, 20);
      setDossiers(response.data.transactions || []);
    } catch (err) {
      setError('Erreur lors du chargement des dossiers');
      console.error('Error loading dossiers:', err);
      // Fallback to empty list to show UI anyway
      setDossiers([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from dossiers
  const stats = [
    {
      label: 'Dossiers en cours',
      value: dossiers.length,
      icon: <DocumentScannerIcon />,
      color: 'primary',
      trend: `${dossiers.length} dossier(s) en attente`,
      trendUp: dossiers.length > 0
    },
    {
      label: 'En attente de validation',
      value: dossiers.filter(d => d.statut === 'en_attente_validation').length,
      icon: <CalendarTodayIcon />,
      color: 'success',
      trend: 'Action requise',
      trendUp: true
    },
    {
      label: 'Modifications demandées',
      value: dossiers.filter(d => d.statut === 'modifications_demandees').length,
      icon: <VerifiedUserIcon />,
      color: 'warning',
      trend: 'À réviser',
      trendUp: false
    },
  ];

  // Build rendez-vous from dossiers (simplified)
  const rendezVous = dossiers.slice(0, 4).map((dossier, idx) => ({
    id: idx + 1,
    temps: `${9 + idx * 2}:00`,
    client: dossier.vendeur_nom || 'Client',
    dossier: dossier.annonce_titre || 'Dossier',
    lieu: 'Bureau'
  }));

  // Notifications based on dossiers status
  const notifications = [
    ...dossiers.slice(0, 2).map((d, idx) => ({
      id: idx + 1,
      texte: `Dossier #${d.transaction_notaire_id}: ${d.statut}`,
      type: d.statut === 'modifications_demandees' ? 'warning' : 'info'
    })),
    { id: 3, texte: 'Vérifiez les documents en attente', type: 'warning' },
  ].slice(0, 4);

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
