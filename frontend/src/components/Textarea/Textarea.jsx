import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { inputTokens, borderRadius, typography } from '@/design-system/tokens';
import './Textarea.css';

/**
 * Textarea Component
 * Multi-line text input with label, error state, and character count
 */
const Textarea = React.forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  errorMessage,
  hint,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  className = '',
  id,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(value?.length || 0);

  const inputId = id || `textarea-${Math.random()}`;

  const textareaClass = [
    'textarea-wrapper',
    isFocused && 'textarea-wrapper--focused',
    error && 'textarea-wrapper--error',
    disabled && 'textarea-wrapper--disabled',
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

  const handleChange = (e) => {
    setCharCount(e.target.value.length);
    onChange?.(e);
  };

  return (
    <div className="textarea-field">
      {label && (
        <label htmlFor={inputId} className="textarea-label">
          {label}
          {required && <span className="textarea-label__required">*</span>}
        </label>
      )}

      <div className={textareaClass}>
        <textarea
          ref={ref}
          id={inputId}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className="textarea-control"
          aria-invalid={error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
      </div>

      <div className="textarea-footer">
        <div>
          {error && errorMessage && (
            <span id={`${inputId}-error`} className="textarea-error">
              {errorMessage}
            </span>
          )}
          {hint && !error && (
            <span id={`${inputId}-hint`} className="textarea-hint">
              {hint}
            </span>
          )}
        </div>
        {maxLength && (
          <span className="textarea-counter">
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  hint: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  className: PropTypes.string,
  id: PropTypes.string,
};

export default Textarea;
