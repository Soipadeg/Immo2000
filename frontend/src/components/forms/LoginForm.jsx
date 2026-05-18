/**
 * LoginForm - Formulaire de connexion avec validation React Hook Form
 * Phase 4.3 - React Hook Form
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Link } from '@mui/material';

import { loginSchema, loginDefaultValues } from './schemas';
import { FormField, FormCheckbox, FormContainer } from './FormField';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

/**
 * LoginForm component
 */
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { showError, showSuccess } = useNotificationStore();

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaultValues,
    mode: 'onBlur', // Valider au blur
  });

  /**
   * Soumettre le formulaire
   */
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const success = await login(data.email, data.password);

      if (success) {
        showSuccess('Connecté avec succès!');
        // Rediriger après 1s
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        showError('Identifiants invalides');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, margin: '0 auto', padding: 3 }}>
      <h2>Connexion</h2>

      <FormContainer
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Se connecter"
      >
        {/* Email field */}
        <FormField
          control={control}
          name="email"
          label="Email"
          type="email"
          placeholder="user@example.com"
          error={errors.email}
          required
        />

        {/* Password field */}
        <FormField
          control={control}
          name="password"
          label="Mot de passe"
          type="password"
          error={errors.password}
          required
        />

        {/* Remember me checkbox */}
        <FormCheckbox
          control={control}
          name="rememberMe"
          label="Se souvenir de moi"
          error={errors.rememberMe}
        />

        {/* Links */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Link href="/forgot-password" variant="body2">
            Mot de passe oublié?
          </Link>
          <Link href="/register" variant="body2">
            Créer un compte
          </Link>
        </Box>
      </FormContainer>
    </Box>
  );
}

export default LoginForm;
