import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { inputTokens, borderRadius, typography } from '@/design-system/tokens';
import './Input.css';

/**
 * Input Component
 * Text input with label, error state, and icon support
 */
const Input = React.forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  errorMessage,
  hint,
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  required = false,
  className = '',
  id,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputId = id || `input-${Math.random()}`;

  const inputClass = [
    'input-wrapper',
    isFocused && 'input-wrapper--focused',
    error && 'input-wrapper--error',
    disabled && 'input-wrapper--disabled',
    Icon && `input-wrapper--has-icon input-wrapper--icon-${iconPosition}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputStyle = {
    height: inputTokens.height,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.body,
    fontFamily: typography.fontFamily.primary,
    padding: Icon ? `${inputTokens.padding} ${inputTokens.padding} ${inputTokens.padding} 40px` : inputTokens.padding,
  };

  return (
    <div className="input-field">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-label__required">*</span>}
        </label>
      )}

      <div className={inputClass}>
        {Icon && (
          <div className="input-icon" aria-hidden="true">
            {typeof Icon === 'string' ? Icon : <Icon />}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className="input-control"
          style={inputStyle}
          aria-invalid={error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
      </div>

      {error && errorMessage && (
        <span id={`${inputId}-error`} className="input-error">
          {errorMessage}
        </span>
      )}

      {hint && !error && (
        <span id={`${inputId}-hint`} className="input-hint">
          {hint}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  hint: PropTypes.string,
  icon: PropTypes.elementType,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
};

export default Input;
