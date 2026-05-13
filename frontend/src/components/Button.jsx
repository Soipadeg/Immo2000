import React from 'react';
import { Button as MuiButton, CircularProgress, Box } from '@mui/material';

/**
 * Composant Button professionnel
 * Wrapper autour MUI Button avec styles cohérents
 */
const Button = React.forwardRef(
  (
    {
      variant = 'contained',
      size = 'medium',
      color = 'primary',
      loading = false,
      fullWidth = false,
      startIcon,
      endIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <MuiButton
        ref={ref}
        variant={variant}
        size={size}
        color={color}
        fullWidth={fullWidth}
        disabled={disabled || loading}
        startIcon={
          loading && !startIcon ? (
            <CircularProgress size={20} />
          ) : (
            startIcon
          )
        }
        endIcon={endIcon}
        {...props}
      >
        {children}
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;
