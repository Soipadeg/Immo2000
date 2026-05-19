import React from 'react';
import PropTypes from 'prop-types';
import { buttonTokens, buttonSizes, borderRadius, typography } from '@/design-system/tokens';
import './Button.css';

/**
 * Button Component
 * Reusable button with multiple variants and sizes
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const buttonClass = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth && 'button--fullwidth',
    disabled && 'button--disabled',
    loading && 'button--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const buttonStyle = {
    ...buttonTokens[variant],
    borderRadius: borderRadius.md,
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.semibold,
    ...buttonSizes[size],
    transition: `all 300ms ease`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      style={buttonStyle}
      {...props}
    >
      {loading ? (
        <span className="button__spinner">
          <span className="button__spinner-dot" />
          <span className="button__spinner-dot" />
          <span className="button__spinner-dot" />
        </span>
      ) : (
        children
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
};

export default Button;
