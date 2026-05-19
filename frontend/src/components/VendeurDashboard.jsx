/**
 * Composant du tableau de bord vendeur
 * Affiche les annonces de l'utilisateur avec filtres et actions
 */

import React, { useEffect, useState } from 'react';
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
    <Card>
      <CardContent>
        {/* Titre */}
        <p>
          {annonce.titre}
        </p>

        {/* Prix et surface */}
        <p>
          {annonce.prix.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'EUR',
          })}{' '}
          • {annonce.surface}m²
        </p>

        {/* Localisation */}
        <p>
          {annonce.adresse}, {annonce.code_postal} {annonce.ville}
        </p>

        {/* Type et pièces */}
        <div>
          <Chip
            label={annonce.type_bien}
            size="small"
          />
          <Chip
            label={`${annonce.nombre_pieces} pièces`}
            size="small"
          />
        </div>

        {/* Description courte */}
        <p>
          {annonce.description.substring(0, 100)}...
        </p>

        {/* Statut */}
        <div>
          <StatutChip statut={annonce.statut} />
        </div>

        {/* Dates */}
        <p>
          Créée le {format(new Date(annonce.date_creation), 'dd MMMM yyyy', { locale: fr })}
        </p>
        {annonce.date_vente && (
          <p>
            Vendue le {format(new Date(annonce.date_vente), 'dd MMMM yyyy', { locale: fr })}
          </p>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions>
        {canPublish && (
          <button size="small"
            color="success"
            startIcon={<PublishIcon />}
            onClick={() => onPublish(annonce.annonce_id)}
          >
            Publier
          </button>
        )}

        {canArchive && (
          <button size="small"
            color="warning"
            startIcon={<ArchiveIcon />}
            onClick={() => onArchive(annonce.annonce_id)}
          >
            Archiver
          </button>
        )}

        {canSell && (
          <button size="small"
            color="error"
            startIcon={<SellIcon />}
            onClick={handleSellClick}
          >
            Vendue
          </button>
        )}

        <button size="small"
          startIcon={<EditIcon />}
          onClick={() => onEdit(annonce.annonce_id)}
        >
          Éditer
        </button>

        {canDelete && (
          <button size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${annonce.titre}"?`)) {
                onDelete(annonce.annonce_id);
              }
            }}
          >
            Supprimer
          </button>
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
    <Container maxWidth="lg">
      {/* En-tête */}
      <div>
        <Box>
          <p>
            📊 Tableau de bord vendeur
          </p>
          <p>
            Gérez vos annonces immobilières
          </p>
        </div>
        <button variant="contained"
          color="success"
          size="large"
          href="/annonces/create"
        >
          ➕ Créer une annonce
        </button>
      </div>

      {/* Messages */}
      {error && (
        <Alert
          severity="error"
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success">
          {successMessage}
        </Alert>
      )}

      {/* Filtres */}
      <div className="card">
        <p>
          Filtres
        </p>
        <Grid container spacing={2}>
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
            <div>
              <button fullWidth
                variant="contained"
                onClick={handleApplyFilters}
              >
                Filtrer
              </button>
              <button fullWidth
                variant="outlined"
                onClick={handleResetFilters}
              >
                Réinitialiser
              </button>
            </div>
          </Grid>
        </Grid>
      </div>

      {/* Chargement */}
      {loading && (
        <div>
          <div class="spinner"></div>
        </div>
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
          <div>
            <p>
              {total} annonce{total > 1 ? 's' : ''} au total • Affichage {skip + 1} à {Math.min(skip + limit, total)}
            </p>
          </div>

          {/* Grille */}
          <Grid container spacing={3}>
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
            <div>
              <Pagination
                count={maxPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default VendeurDashboard;
