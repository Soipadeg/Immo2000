/**
 * Composant du tableau de bord vendeur
 * Affiche les annonces de l'utilisateur avec filtres et actions
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from '@mui/material';
import {
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Publish as PublishIcon,
  Delete as DeleteIcon,
  LocalDining as SellIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import useAnnoncesStore from '../hooks/useAnnoncesStore';

/**
 * Composant Badge de statut
 */
const StatutChip = ({ statut }) => {
  const colorMap = {
    brouillon: 'default',
    publiée: 'success',
    archivée: 'warning',
    vendue: 'error',
  };

  const labelMap = {
    brouillon: 'Brouillon',
    publiée: 'Publiée',
    archivée: 'Archivée',
    vendue: 'Vendue',
  };

  return (
    <Chip
      label={labelMap[statut] || statut}
      color={colorMap[statut]}
      size="small"
      variant="outlined"
    />
  );
};

/**
 * Composant Carte d'annonce
 */
const AnnoncesCard = ({ annonce, onEdit, onPublish, onArchive, onSell, onDelete }) => {
  const canPublish = annonce.statut === 'brouillon';
  const canArchive = annonce.statut === 'publiée';
  const canSell = annonce.statut === 'publiée';
  const canDelete = annonce.statut === 'brouillon';

  const handleSellClick = () => {
    if (window.confirm(`Êtes-vous sûr de marquer "${annonce.titre}" comme vendue?`)) {
      onSell(annonce.annonce_id);
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Titre */}
        <Typography gutterBottom variant="h6" component="div">
          {annonce.titre}
        </Typography>

        {/* Prix et surface */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {annonce.prix.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'EUR',
          })}{' '}
          • {annonce.surface}m²
        </Typography>

        {/* Localisation */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {annonce.adresse}, {annonce.code_postal} {annonce.ville}
        </Typography>

        {/* Type et pièces */}
        <Box sx={{ my: 1 }}>
          <Chip
            label={annonce.type_bien}
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip
            label={`${annonce.nombre_pieces} pièces`}
            size="small"
          />
        </Box>

        {/* Description courte */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {annonce.description.substring(0, 100)}...
        </Typography>

        {/* Statut */}
        <Box sx={{ mt: 2 }}>
          <StatutChip statut={annonce.statut} />
        </Box>

        {/* Dates */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Créée le {format(new Date(annonce.date_creation), 'dd MMMM yyyy', { locale: fr })}
        </Typography>
        {annonce.date_vente && (
          <Typography variant="caption" color="text.secondary" display="block">
            Vendue le {format(new Date(annonce.date_vente), 'dd MMMM yyyy', { locale: fr })}
          </Typography>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        {canPublish && (
          <Button
            size="small"
            color="success"
            startIcon={<PublishIcon />}
            onClick={() => onPublish(annonce.annonce_id)}
          >
            Publier
          </Button>
        )}

        {canArchive && (
          <Button
            size="small"
            color="warning"
            startIcon={<ArchiveIcon />}
            onClick={() => onArchive(annonce.annonce_id)}
          >
            Archiver
          </Button>
        )}

        {canSell && (
          <Button
            size="small"
            color="error"
            startIcon={<SellIcon />}
            onClick={handleSellClick}
          >
            Vendue
          </Button>
        )}

        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={() => onEdit(annonce.annonce_id)}
        >
          Éditer
        </Button>

        {canDelete && (
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${annonce.titre}"?`)) {
                onDelete(annonce.annonce_id);
              }
            }}
          >
            Supprimer
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

/**
 * Composant principal du tableau de bord vendeur
 */
export const VendeurDashboard = () => {
  const {
    annonces,
    total,
    skip,
    limit,
    loading,
    error,
    filters,
    loadAnnonces,
    publishAnnonce,
    archiveAnnonce,
    sellAnnonce,
    deleteAnnonce,
    setFilters,
    clearError,
  } = useAnnoncesStore();

  const [page, setPage] = useState(1);
  const [localFilters, setLocalFilters] = useState(filters);
  const [successMessage, setSuccessMessage] = useState('');

  // Charger les annonces au montage et lors des changements de page/filtres
  useEffect(() => {
    loadAnnonces((page - 1) * limit, limit);
  }, [page, filters, loadAnnonces, limit]);

  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setLocalFilters((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setLocalFilters({ statut: null, ville: null, type_bien: null });
    setFilters({ statut: null, ville: null, type_bien: null });
    setPage(1);
  };

  const handlePublish = async (annonceId) => {
    try {
      await publishAnnonce(annonceId);
      setSuccessMessage('Annonce publiée avec succès!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erreur publication:', error);
    }
  };

  const handleArchive = async (annonceId) => {
    try {
      await archiveAnnonce(annonceId);
      setSuccessMessage('Annonce archivée avec succès!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erreur archivage:', error);
    }
  };

  const handleSell = async (annonceId) => {
    try {
      await sellAnnonce(annonceId);
      setSuccessMessage('Annonce marquée comme vendue!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erreur vente:', error);
    }
  };

  const handleDelete = async (annonceId) => {
    try {
      await deleteAnnonce(annonceId);
      setSuccessMessage('Annonce supprimée avec succès!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const handleEdit = (annonceId) => {
    // À implémenter: redirection vers page d'édition
    console.log('Éditer annonce:', annonceId);
  };

  const maxPages = Math.ceil(total / limit) || 1;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            📊 Tableau de bord vendeur
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez vos annonces immobilières
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="success"
          size="large"
          href="/annonces/create"
          sx={{ whiteSpace: 'nowrap' }}
        >
          ➕ Créer une annonce
        </Button>
      </Box>

      {/* Messages */}
      {error && (
        <Alert
          severity="error"
          onClose={clearError}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Filtres */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filtres
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Statut"
              value={localFilters.statut || ''}
              onChange={handleFilterChange('statut')}
              size="small"
            >
              <MenuItem value="">Tous les statuts</MenuItem>
              <MenuItem value="brouillon">Brouillon</MenuItem>
              <MenuItem value="publiée">Publiée</MenuItem>
              <MenuItem value="archivée">Archivée</MenuItem>
              <MenuItem value="vendue">Vendue</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Ville"
              placeholder="Ex: Paris"
              value={localFilters.ville || ''}
              onChange={handleFilterChange('ville')}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Type de bien"
              value={localFilters.type_bien || ''}
              onChange={handleFilterChange('type_bien')}
              size="small"
            >
              <MenuItem value="">Tous les types</MenuItem>
              <MenuItem value="maison">Maison</MenuItem>
              <MenuItem value="appartement">Appartement</MenuItem>
              <MenuItem value="terrain">Terrain</MenuItem>
              <MenuItem value="local commercial">Local commercial</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleApplyFilters}
              >
                Filtrer
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleResetFilters}
              >
                Réinitialiser
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Chargement */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Aucune annonce */}
      {!loading && annonces.length === 0 && (
        <Alert severity="info">
          Aucune annonce trouvée. Créez votre première annonce pour commencer!
        </Alert>
      )}

      {/* Liste des annonces */}
      {!loading && annonces.length > 0 && (
        <>
          {/* Statistiques */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {total} annonce{total > 1 ? 's' : ''} au total • Affichage {skip + 1} à {Math.min(skip + limit, total)}
            </Typography>
          </Box>

          {/* Grille */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {annonces.map((annonce) => (
              <Grid item xs={12} sm={6} md={4} key={annonce.annonce_id}>
                <AnnoncesCard
                  annonce={annonce}
                  onEdit={handleEdit}
                  onPublish={handlePublish}
                  onArchive={handleArchive}
                  onSell={handleSell}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {maxPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={maxPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default VendeurDashboard;
