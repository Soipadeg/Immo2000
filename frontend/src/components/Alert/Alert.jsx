import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import './Alert.css';

/**
 * Alert Component
 * Alert/Toast notification with auto-dismiss
 */
const Alert = ({
  isOpen = true,
  onClose,
  type = 'info',
  title,
  message,
  children,
  dismissible = true,
  autoDismiss = false,
  duration = 5000,
  className = '',
  ...props
}) => {
  useEffect(() => {
    if (isOpen && autoDismiss) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDismiss, duration, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon data-testid="success-icon" />;
      case 'error':
        return <ErrorIcon data-testid="error-icon" />;
      case 'warning':
        return <WarningIcon data-testid="warning-icon" />;
      case 'info':
      default:
        return <InfoIcon data-testid="info-icon" />;
    }
  };

  const alertClass = [
    'alert',
    'alert--' + type,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={alertClass} role="alert" {...props}>
      <div className="alert-icon">
        {getIcon()}
      </div>

      <div className="alert-content">
        {title && <h4 className="alert-title">{title}</h4>}
        {message && <p className="alert-message">{message}</p>}
        {children}
      </div>

      {dismissible && (
        <button
          className="alert-close"
          onClick={onClose}
          aria-label="Close alert"
          type="button"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

Alert.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string,
  message: PropTypes.string,
  children: PropTypes.node,
  dismissible: PropTypes.bool,
  autoDismiss: PropTypes.bool,
  duration: PropTypes.number,
  className: PropTypes.string,
};

export default Alert;
