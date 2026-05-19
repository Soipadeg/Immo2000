/**
 * Hook personnalisé pour React Hook Form
 * Simplifie l'utilisation de React Hook Form avec Zod
 *
 * Phase 5.2.5 - Form Validation
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Hook pour créer un formulaire avec validation Zod
 *
 * @param {z.ZodSchema} schema - Schéma de validation Zod
 * @param {Object} defaultValues - Valeurs par défaut
 * @param {Function} onSubmit - Callback soumission
 * @returns {Object} Props pour le formulaire et méthodes
 *
 * @example
 * const { control, handleSubmit, formState: { errors } } = useValidatedForm(
 *   selectNotaireSchema,
 *   { notaire_id: null },
 *   onSubmitHandler
 * );
 */
export function useValidatedForm(schema, defaultValues = {}, onSubmit) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
    setValue,
    register,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange', // Valider au changement
  });

  const onSubmitHandler = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
      throw error;
    }
  };

  return {
    control,
    handleSubmit: handleSubmit(onSubmitHandler),
    errors,
    isSubmitting,
    isDirty,
    reset,
    watch,
    setValue,
    register,
  };
}

/**
 * Hook pour gérer les erreurs de formulaire
 * Affiche les erreurs de manière conviviale
 *
 * @param {Object} errors - Erreurs du formulaire
 * @param {string} fieldName - Nom du champ
 * @returns {Object} { hasError, errorMessage }
 */
export function useFieldError(errors, fieldName) {
  const error = errors?.[fieldName];

  return {
    hasError: !!error,
    errorMessage: error?.message || '',
  };
}

/**
 * Hook pour gérer la soumission du formulaire avec loading
 */
export function useFormSubmit() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleFormSubmit = async (onSubmit) => {
    return async (data) => {
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        await onSubmit(data);
        setSuccess('Formulaire soumis avec succès');
      } catch (err) {
        setError(err.message || 'Erreur lors de la soumission');
      } finally {
        setLoading(false);
      }
    };
  };

  return {
    loading,
    error,
    success,
    handleFormSubmit,
    setError,
    setSuccess,
    clearError: () => setError(''),
    clearSuccess: () => setSuccess(''),
  };
}

export default useValidatedForm;
