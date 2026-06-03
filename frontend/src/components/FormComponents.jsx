/**
 * Composants réutilisables pour formulaires avec validation
 * Intègrent React Hook Form et Material-UI
 *
 * Phase 5.2.5 - Form Validation Components
 */

import React from 'react';
import { Controller } from 'react-hook-form';

/**
 * Champ texte avec validation
 * Utilisé avec Controller de React Hook Form
 *
 * @example
 * <FormTextField
 *   control={control}
 *   name="email"
 *   label="Email"
 *   type="email"
 *   error={errors.email}
 *   required
 * />
 */
export function FormTextField({
  control,
  name,
  label,
  type = 'text',
  required = false,
  error,
  multiline = false,
  rows = 4,
  placeholder,
  helperText,
  ...props
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          {...field}
          {...props}
          label={label}
          type={type}
          required={required}
          error={!!error}
          helperText={error?.message || helperText}
          fullWidth
          multiline={multiline}
          rows={multiline ? rows : undefined}
          placeholder={placeholder}
          variant="outlined"
          margin="normal"
        />
      )}
    />
  );
}

/**
 * Champ checkbox avec validation
 *
 * @example
 * <FormCheckbox
 *   control={control}
 *   name="agree_terms"
 *   label="J'accepte les conditions"
 *   error={errors.agree_terms}
 *   required
 * />
 */
export function FormCheckbox({
  control,
  name,
  label,
  error,
  required = false,
  helperText,
  ...props
}) {
  return (
    <Box>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <FormControlLabel
            {...field}
            {...props}
            control={<Checkbox />}
            label={label}
            checked={field.value || false}
            required={required}
          />
        )}
      />
      {error && (
        <FormHelperText error={!!error}>
          {error?.message || helperText}
        </FormHelperText>
      )}
    </div>
  );
}

/**
 * Champ nombre avec validation
 */
export function FormNumberField({
  control,
  name,
  label,
  required = false,
  error,
  helperText,
  min,
  max,
  step = 1,
  ...props
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          {...field}
          {...props}
          label={label}
          type="number"
          required={required}
          error={!!error}
          helperText={error?.message || helperText}
          fullWidth
          inputProps={{ min, max, step }}
          variant="outlined"
          margin="normal"
        />
      )}
    />
  );
}

/**
 * Groupe de champs dans une section
 * Facilite l'organisation des formulaires
 *
 * @example
 * <FormSection title="Informations Personnelles">
 *   <FormTextField control={control} name="name" label="Nom" />
 *   <FormTextField control={control} name="email" label="Email" />
 * </FormSection>
 */
export function FormSection({ title, children, sx = {} }) {
  return (
    <div>
      {title && (
        <div>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export default {
  FormTextField,
  FormCheckbox,
  FormNumberField,
  FormSection,
};
