/**
 * Composant réutilisable FormField pour React Hook Form
 * Encapsule les logiques communes: label, input, error message
 *
 * Phase 4.3 - React Hook Form
 */

import React from 'react';
import { Controller } from 'react-hook-form';

/**
 * FormField component - encapsule un champ form réutilisable
 *
 * Usage:
 * <FormField
 *   control={control}
 *   name="email"
 *   label="Email"
 *   type="email"
 *   error={errors.email}
 *   placeholder="user@example.com"
 * />
 */
export function FormField({
  control,
  name,
  label,
  type = 'text',
  placeholder = '',
  error = null,
  required = false,
  disabled = false,
  defaultValue = '',
  multiline = false,
  rows = 4,
  ...props
}) {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue}
      render={({ field }) => (
        <TextField
          {...field}
          {...props}
          fullWidth
          type={type}
          label={label}
          placeholder={placeholder}
          error={!!error}
          helperText={error?.message || ''}
          required={required}
          disabled={disabled}
          multiline={multiline}
          rows={multiline ? rows : 1}
          variant="outlined"
          margin="normal"
          size="medium"
        />
      )}
    />
  );
}

/**
 * FormSelect - Champ select réutilisable
 */
export function FormSelect({
  control,
  name,
  label,
  options = [],
  error = null,
  required = false,
  disabled = false,
  defaultValue = '',
  ...props
}) {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormControl
          fullWidth
          margin="normal"
          error={!!error}
          disabled={disabled}
        >
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            label={label}
            {...props}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error?.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}

/**
 * FormCheckbox - Champ checkbox réutilisable
 */
export function FormCheckbox({
  control,
  name,
  label,
  error = null,
  defaultValue = false,
  ...props
}) {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue}
      render={({ field }) => (
        <div style={{ my: 2 }}>
          <FormControlLabel
            control={<Checkbox {...field} checked={field.value} {...props} />}
            label={label}
          />
          {error && (
            <FormHelperText error>{error?.message}</FormHelperText>
          )}
        </div>
      )}
    />
  );
}

/**
 * FormContainer - Conteneur pour un formulaire
 */
export function FormContainer({
  children,
  onSubmit,
  handleSubmit,
  isLoading = false,
  submitLabel = 'Envoyer',
  sx = {},
  ...props
}) {
  return (
    <div
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...sx,
      }}
      {...props}
    >
      {children}
      <button
        type="submit"
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          marginTop: '16px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? 'Traitement...' : submitLabel}
      </button>
    </div>
  );
}
