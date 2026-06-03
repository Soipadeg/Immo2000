import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { inputTokens, borderRadius, typography } from '@/design-system/tokens';
import './Select.css';

/**
 * Select Component
 * Dropdown select with label, error state, and optional grouping
 */
const Select = React.forwardRef(({
  label,
  placeholder = 'Sélectionner une option',
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  errorMessage,
  hint,
  disabled = false,
  required = false,
  options = [],
  optionGroups,
  className = '',
  id,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const selectId = id || `select-${Math.random()}`;

  const selectClass = [
    'select-wrapper',
    isFocused && 'select-wrapper--focused',
    error && 'select-wrapper--error',
    disabled && 'select-wrapper--disabled',
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

  return (
    <div className="select-field">
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
          {required && <div className="select-label__required">*</div>}
        </label>
      )}

      <div className={selectClass}>
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className="select-control"
          aria-invalid={error}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}

          {optionGroups ? (
            optionGroups.map((group, idx) => (
              <optgroup key={idx} label={group.label}>
                {group.options.map((option, optIdx) => (
                  <option key={optIdx} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))
          ) : (
            options.map((option, idx) => (
              <option key={idx} value={option.value}>
                {option.label}
              </option>
            ))
          )}
        </select>
      </div>

      {error && errorMessage && (
        <div id={`${selectId}-error`} className="select-error">
          {errorMessage}
        </div>
      )}

      {hint && !error && (
        <div id={`${selectId}-hint`} className="select-hint">
          {hint}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
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
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  optionGroups: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ),
  className: PropTypes.string,
  id: PropTypes.string,
};

export default Select;
