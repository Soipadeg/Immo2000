/**
 * RegisterForm - Formulaire d'inscription avec validation React Hook Form
 * Phase 4.3 - React Hook Form
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Box, Link, Alert } from '@mui/material';

import { registerSchema, registerDefaultValues } from './schemas';
import { FormField, FormCheckbox, FormContainer } from './FormField';
import { authApi } from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';

/**
 * RegisterForm component
 */
export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotificationStore();

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaultValues,
    mode: 'onBlur',
  });

  /**
   * Soumettre le formulaire
   */
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Appeler l'API d'inscription
      const response = await authApi.register({
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        password: data.password,
      });

      showSuccess('Compte créé avec succès! Redirection vers connexion...');

      // Rediriger après 2s
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, margin: '0 auto', padding: 3 }}>
      <h2>Créer un compte</h2>

      <Alert severity="info" sx={{ mb: 2 }}>
        Le mot de passe doit contenir: min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
      </Alert>

      <FormContainer
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Créer un compte"
      >
        {/* Prenom */}
        <FormField
          control={control}
          name="prenom"
          label="Prénom"
          placeholder="Jean"
          error={errors.prenom}
          required
        />

        {/* Nom */}
        <FormField
          control={control}
          name="nom"
          label="Nom"
          placeholder="Dupont"
          error={errors.nom}
          required
        />

        {/* Email */}
        <FormField
          control={control}
          name="email"
          label="Email"
          type="email"
          placeholder="user@example.com"
          error={errors.email}
          required
        />

        {/* Password */}
        <FormField
          control={control}
          name="password"
          label="Mot de passe"
          type="password"
          error={errors.password}
          required
        />

        {/* Confirm Password */}
        <FormField
          control={control}
          name="confirmPassword"
          label="Confirmer le mot de passe"
          type="password"
          error={errors.confirmPassword}
          required
        />

        {/* Terms checkbox */}
        <FormCheckbox
          control={control}
          name="acceptTerms"
          label="J'accepte les conditions d'utilisation"
          error={errors.acceptTerms}
        />

        {/* Link to login */}
        <Box sx={{ textAlign: 'center' }}>
          <span>Déjà un compte? </span>
          <Link href="/login" variant="body2">
            Se connecter
          </Link>
        </Box>
      </FormContainer>
    </Box>
  );
}

export default RegisterForm;
