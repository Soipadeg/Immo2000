import React from 'react';
import PropTypes from 'prop-types';
import './FormContainer.css';

/**
 * FormContainer Component
 * Standard layout for form pages (login, register, etc.)
 */
const FormContainer = ({
  title,
  subtitle,
  children,
  maxWidth = 'medium',
  className = '',
  ...props
}) => {
  const containerClass = [
    'form-container',
    `form-container--${maxWidth}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass} {...props}>
      <div className="form-container-inner">
        <div className="form-container-header">
          {title && (
            <h1 className="form-container-title">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="form-container-subtitle">
              {subtitle}
            </p>
          )}
        </div>

        <div className="form-container-content">
          {children}
        </div>
      </div>
    </div>
  );
};

FormContainer.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
};

export default FormContainer;
