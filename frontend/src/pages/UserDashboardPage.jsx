/**
 * Dashboard Utilisateur (Vendeur)
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EyeIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import AlertIcon from '@mui/icons-material/Notifications';

const UserDashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const stats = [
    { label: 'Annonces actives', value: 3, icon: '📋' },
    { label: 'Vues totales', value: 145, icon: '👁️' },
    { label: 'Messages reçus', value: 8, icon: '💬' },
    { label: 'Alertes', value: 2, icon: '🔔' },
  ];

  const annonces = [
    {
      id: 1,
      titre: 'Appartement 3 pièces Paris',
      prix: 450000,
      ville: 'Paris',
      statut: 'Actif',
      vues: 45,
      messages: 3,
      dateCreation: '2026-01-15',
    },
    {
      id: 2,
      titre: 'Maison 4 pièces Lyon',
      prix: 380000,
      ville: 'Lyon',
      statut: 'Actif',
      vues: 78,
      messages: 5,
      dateCreation: '2026-02-01',
    },
    {
      id: 3,
      titre: 'Studio Paris 20ème',
      prix: 320000,
      ville: 'Paris',
      statut: 'Brouillon',
      vues: 0,
      messages: 0,
      dateCreation: '2026-02-20',
    },
  ];

  const alertes = [
    { id: 1, titre: 'Alerte prix', description: 'Propriétés similaires trouvées à prix inférieur' },
    { id: 2, titre: 'Alerte localité', description: 'Nouvelles annonces dans votre région préférée' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !['user', 'admin'].includes(user.role)) {
    navigate('/');
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            📊 Dashboard
          </Typography>
          <Typography color="textSecondary">
            Bienvenue, {user.prenom} {user.nom}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/annonces/create')}>
          Créer une annonce
        </Button>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ fontSize: 32, mb: 1 }}>{stat.icon}</Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {stat.label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Onglets Annonces et Alertes */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<SearchIcon />} label="Mes annonces" />
            <Tab icon={<AlertIcon />} label="Mes alertes" />
          </Tabs>
        </Box>

        {/* Onglet Annonces */}
        {tabValue === 0 && (
          <CardContent>
            <Grid container spacing={2}>
              {annonces.map((annonce) => (
                <Grid item xs={12} md={6} key={annonce.id}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {annonce.titre}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          📍 {annonce.ville}
                        </Typography>
                      </Box>
                      <Chip
                        label={annonce.statut}
                        color={annonce.statut === 'Actif' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                      {annonce.prix.toLocaleString()}€
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, fontSize: '0.875rem', color: 'textSecondary' }}>
                      <Box>👁️ {annonce.vues} vues</Box>
                      <Box>💬 {annonce.messages} messages</Box>
                      <Box>📅 {new Date(annonce.dateCreation).toLocaleDateString('fr-FR')}</Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" startIcon={<EyeIcon />}>
                        Voir
                      </Button>
                      <Button size="small" variant="outlined" startIcon={<EditIcon />}>
                        Éditer
                      </Button>
                      <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />}>
                        Supprimer
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}

        {/* Onglet Alertes */}
        {tabValue === 1 && (
          <CardContent>
            <List>
              {alertes.length === 0 ? (
                <Alert severity="info">Aucune alerte pour le moment</Alert>
              ) : (
                alertes.map((alerte) => (
                  <Box key={alerte.id}>
                    <ListItem>
                      <ListItemText primary={alerte.titre} secondary={alerte.description} />
                    </ListItem>
                    <Divider />
                  </Box>
                ))
              )}
            </List>
          </CardContent>
        )}
      </Card>

      {/* Sections rapides */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📚 Ressources
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" color="primary" fullWidth>
                  Consulter les guides
                </Button>
                <Button variant="outlined" color="primary" fullWidth>
                  Télécharger les modèles
                </Button>
                <Button variant="outlined" color="primary" fullWidth>
                  Utiliser le simulateur
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚙️ Compte
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" color="primary" fullWidth>
                  Modifier le profil
                </Button>
                <Button variant="outlined" color="primary" fullWidth>
                  Paramètres de notifications
                </Button>
                <Button variant="outlined" color="primary" fullWidth>
                  Changer le mot de passe
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
