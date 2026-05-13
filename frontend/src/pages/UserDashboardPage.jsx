/**
 * Dashboard Utilisateur (Vendeur/Acheteur)
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
  Avatar,
  AvatarGroup,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EyeIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import AlertIcon from '@mui/icons-material/Notifications';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import BookIcon from '@mui/icons-material/Book';
import FolderIcon from '@mui/icons-material/Folder';

const UserDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !['user', 'admin'].includes(user.role))) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const stats = [
    {
      label: 'Annonces actives',
      value: 12,
      icon: <EditIcon />,
      color: 'primary',
      trend: '+2 ce mois',
      trendUp: true
    },
    {
      label: 'Vues totales',
      value: 1245,
      icon: <EyeIcon />,
      color: 'info',
      trend: '+340 cette semaine',
      trendUp: true
    },
    {
      label: 'Messages reçus',
      value: 47,
      icon: <AlertIcon />,
      color: 'warning',
      trend: '8 non lus',
      trendUp: false
    },
    {
      label: 'Alertes',
      value: 5,
      icon: <TrendingUpIcon />,
      color: 'success',
      trend: '2 nouvelles',
      trendUp: false
    },
  ];

  const annonces = [
    {
      id: 1,
      titre: 'Appartement 3 pièces Paris 15ème',
      prix: 450000,
      ville: 'Paris',
      statut: 'Actif',
      vues: 145,
      messages: 8,
      dateCreation: '2026-03-15',
      progression: 85,
    },
    {
      id: 2,
      titre: 'Maison 4 pièces Lyon Fourvière',
      prix: 380000,
      ville: 'Lyon',
      statut: 'Actif',
      vues: 289,
      messages: 15,
      dateCreation: '2026-02-01',
      progression: 92,
    },
    {
      id: 3,
      titre: 'Studio Marseille Vieux-Port',
      prix: 320000,
      ville: 'Marseille',
      statut: 'Brouillon',
      vues: 0,
      messages: 0,
      dateCreation: '2026-04-20',
      progression: 40,
    },
  ];

  const alertes = [
    {
      id: 1,
      titre: 'Alerte prix',
      description: 'Propriétés similaires trouvées 15% moins chères',
      type: 'warning'
    },
    {
      id: 2,
      titre: 'Alerte localité',
      description: 'Nouvelles annonces dans Paris 15ème',
      type: 'info'
    },
    {
      id: 3,
      titre: 'Offre reçue',
      description: 'Une nouvelle offre pour votre appartement',
      type: 'success'
    },
  ];

  const operations = [
    { label: 'Consulter les guides', icon: <BookIcon />, color: 'primary' },
    { label: 'Télécharger les modèles', icon: <FolderIcon />, color: 'secondary' },
    { label: 'Utiliser le simulateur', icon: <TrendingUpIcon />, color: 'success' },
  ];

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !['user', 'admin'].includes(user.role)) {
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
            📊 Dashboard
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
          onClick={() => navigate('/annonces/create')}
          sx={{ fontWeight: 'bold' }}
        >
          + Créer une annonce
        </Button>
      </Box>

      {/* Statistiques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
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

      {/* Contenu principal - Onglets */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"

          >
            <Tab icon={<SearchIcon />} label="Mes annonces" iconPosition="start" />
            <Tab icon={<AlertIcon />} label="Mes alertes" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Onglet Annonces */}
        {tabValue === 0 && (
          <CardContent sx={{ pt: 3 }}>
            {annonces.length === 0 ? (
              <Alert severity="info">
                Aucune annonce. <Button color="primary">Créer votre première annonce</Button>
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {annonces.map((annonce) => (
                  <Grid item xs={12} key={annonce.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-4px)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {annonce.titre}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            📍 {annonce.ville} • Créée le {new Date(annonce.dateCreation).toLocaleDateString('fr-FR')}
                          </Typography>
                        </Box>
                        <Chip
                          label={annonce.statut}
                          color={annonce.statut === 'Actif' ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>

                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1.5 }}>
                        {annonce.prix.toLocaleString()} €
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Progression du profil
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            {annonce.progression}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={annonce.progression}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 3, mb: 2, fontSize: '0.875rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          👁️ <Typography variant="body2">{annonce.vues} vues</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          💬 <Typography variant="body2">{annonce.messages} messages</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Voir l'annonce">
                          <Button size="small" variant="contained" startIcon={<EyeIcon />}>
                            Voir
                          </Button>
                        </Tooltip>
                        <Tooltip title="Éditer l'annonce">
                          <Button size="small" variant="outlined" startIcon={<EditIcon />}>
                            Éditer
                          </Button>
                        </Tooltip>
                        <Tooltip title="Supprimer l'annonce">
                          <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />}>
                            Supprimer
                          </Button>
                        </Tooltip>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        )}

        {/* Onglet Alertes */}
        {tabValue === 1 && (
          <CardContent sx={{ pt: 3 }}>
            {alertes.length === 0 ? (
              <Alert severity="info">Aucune alerte pour le moment</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {alertes.map((alerte) => (
                  <Alert
                    key={alerte.id}
                    severity={alerte.type}
                    sx={{ py: 1.5 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {alerte.titre}
                    </Typography>
                    <Typography variant="body2">
                      {alerte.description}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            )}
          </CardContent>
        )}
      </Card>

      {/* Sections rapides */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                📚 Ressources utiles
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                {operations.map((op, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Button
                      variant="outlined"
                      fullWidth
                      color={op.color}
                      startIcon={op.icon}
                      sx={{ py: 1.5 }}
                    >
                      {op.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                ⚙️ Paramètres
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/profile')}
                >
                  Profil
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<DownloadIcon />}
                >
                  Télécharger données
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboardPage;
