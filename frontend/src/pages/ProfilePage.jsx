/**
 * Page de profil utilisateur
 * Afficher et modifier les informations du profil
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  Tab,
  Tabs,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { authApi } from '../services/api';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // État pour l'édition
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse_contact: '',
  });

  // Charger les infos utilisateur
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authApi.me();
      setUser(response.data);
      setFormData({
        nom: response.data.nom || '',
        prenom: response.data.prenom || '',
        telephone: response.data.telephone || '',
        adresse_contact: response.data.adresse_contact || '',
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setError('');
    try {
      const response = await authApi.updateProfile(formData);

      setUser(response.data);
      setSuccess('Profil mis à jour avec succès');
      setIsEditing(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Impossible de charger le profil</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        👤 Mon Profil
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Card d'information générale */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mr: 2,
                backgroundColor: '#1976d2',
                fontSize: '2rem',
              }}
            >
              {user.prenom?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">
                {user.prenom} {user.nom}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {user.email}
              </Typography>
            </Box>
            {!isEditing && (
              <Button
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                variant="outlined"
              >
                Modifier
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Informations personnelles" />
        <Tab label="Paramètres de sécurité" />
        <Tab label="Préférences" />
      </Tabs>

      {/* Onglet 1: Informations personnelles */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          {isEditing ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user.email}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adresse de contact"
                    name="adresse_contact"
                    value={formData.adresse_contact}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                    >
                      Enregistrer
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setIsEditing(false)}
                    >
                      Annuler
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    PRÉNOM
                  </Typography>
                  <Typography variant="body1">{user.prenom || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    NOM
                  </Typography>
                  <Typography variant="body1">{user.nom || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    EMAIL
                  </Typography>
                  <Typography variant="body1">{user.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    TÉLÉPHONE
                  </Typography>
                  <Typography variant="body1">{user.telephone || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    ADRESSE DE CONTACT
                  </Typography>
                  <Typography variant="body1">{user.adresse_contact || '-'}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      )}

      {/* Onglet 2: Sécurité */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            🔐 Sécurité du Compte
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Email vérifié
            </Typography>
            <Chip
              label={user.email_verified ? 'Vérifié' : 'Non vérifié'}
              color={user.email_verified ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>

          <Button variant="outlined" color="primary" sx={{ mr: 1 }}>
            Changer le mot de passe
          </Button>
          <Button variant="outlined" color="error">
            Activer l'authentification à 2 facteurs
          </Button>
        </Paper>
      )}

      {/* Onglet 3: Préférences */}
      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            ⚙️ Préférences
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Vous pouvez personnaliser votre expérience Immo2000 ici.
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Notifications par email
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fonctionnalité à venir...
            </Typography>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default ProfilePage;
