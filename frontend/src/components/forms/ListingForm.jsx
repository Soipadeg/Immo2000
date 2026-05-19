/**
 * ListingForm - Formulaire pour créer/modifier une annonce
 * Phase 4.3 - React Hook Form
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, Paper } from '@mui/material';

import { listingSchema, listingDefaultValues } from './schemas';
import { FormField, FormSelect, FormContainer } from './FormField';
import { listingsApi } from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';

/**
 * Options pour les enums
 */
const TYPE_BIEN_OPTIONS = [
  { label: 'Maison', value: 'maison' },
  { label: 'Appartement', value: 'appartement' },
  { label: 'Terrain', value: 'terrain' },
  { label: 'Local commercial', value: 'local' },
];

const STATUT_OPTIONS = [
  { label: 'Brouillon', value: 'brouillon' },
  { label: 'Publié', value: 'publié' },
  { label: 'Vendu', value: 'vendu' },
];

/**
 * ListingForm component
 */
export function ListingForm({ existingListing = null, onSuccess = null }) {
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showSuccess } = useNotificationStore();

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: existingListing || listingDefaultValues,
    mode: 'onBlur',
  });

  /**
   * Soumettre le formulaire
   */
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      let response;

      if (existingListing) {
        // Mise à jour
        response = await listingsApi.update(existingListing.id, data);
        showSuccess('Annonce mise à jour avec succès!');
      } else {
        // Création
        response = await listingsApi.create(data);
        showSuccess('Annonce créée avec succès!');
      }

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors de la sauvegarde';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper sx={{ padding: 3, maxWidth: 800, margin: '0 auto' }}>
      <h2>{existingListing ? 'Modifier l\'annonce' : 'Créer une annonce'}</h2>

      <FormContainer
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel={existingListing ? 'Mettre à jour' : 'Créer'}
      >
        <Grid container spacing={2}>
          {/* Titre */}
          <Grid item xs={12}>
            <FormField
              control={control}
              name="titre"
              label="Titre"
              placeholder="Ex: Bel appartement 3 pièces Paris"
              error={errors.titre}
              required
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <FormField
              control={control}
              name="description"
              label="Description"
              placeholder="Décrivez le bien..."
              error={errors.description}
              multiline
              rows={5}
              required
            />
          </Grid>

          {/* Type de bien */}
          <Grid item xs={12} sm={6}>
            <FormSelect
              control={control}
              name="type_bien"
              label="Type de bien"
              options={TYPE_BIEN_OPTIONS}
              error={errors.type_bien}
              required
            />
          </Grid>

          {/* Statut */}
          <Grid item xs={12} sm={6}>
            <FormSelect
              control={control}
              name="statut"
              label="Statut"
              options={STATUT_OPTIONS}
              error={errors.statut}
            />
          </Grid>

          {/* Prix */}
          <Grid item xs={12} sm={6}>
            <FormField
              control={control}
              name="prix"
              label="Prix (€)"
              type="number"
              error={errors.prix}
              required
            />
          </Grid>

          {/* Surface */}
          <Grid item xs={12} sm={6}>
            <FormField
              control={control}
              name="surface"
              label="Surface (m²)"
              type="number"
              error={errors.surface}
              required
            />
          </Grid>

          {/* Chambres */}
          <Grid item xs={12} sm={6}>
            <FormField
              control={control}
              name="nbr_chambres"
              label="Nombre de chambres"
              type="number"
              error={errors.nbr_chambres}
            />
          </Grid>

          {/* Salles de bain */}
          <Grid item xs={12} sm={6}>
            <FormField
              control={control}
              name="nbr_salles_bain"
              label="Nombre de salles de bain"
              type="number"
              error={errors.nbr_salles_bain}
            />
          </Grid>

          {/* Adresse */}
          <Grid item xs={12}>
            <FormField
              control={control}
              name="adresse"
              label="Adresse"
              placeholder="123 Rue de la Paix"
              error={errors.adresse}
              required
            />
          </Grid>

          {/* Ville */}
          <Grid item xs={12} sm={6}>
            <FormField
              control={control}
              name="ville"
              label="Ville"
              placeholder="Paris"
              error={errors.ville}
              required
            />
          </Grid>

          {/* Code postal */}
          <Grid item xs={12} sm={6}>
            <FormField
              control={control}
              name="code_postal"
              label="Code postal"
              placeholder="75000"
              error={errors.code_postal}
              required
            />
          </Grid>
        </Grid>
      </FormContainer>
    </Paper>
  );
}

export default ListingForm;
