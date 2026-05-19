import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import './Alert.css';

/**
 * Alert Component
 * Alert/Toast notification with auto-dismiss
 */
const Alert = ({
  isOpen,
  onClose,
  type = 'info',
  title,
  message,
  dismissible = true,
  autoDismiss = true,
  duration = 5000,
  className = '',
  ...props
}) => {
  useEffect(() => {
    if (isOpen && autoDismiss) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDismiss, duration, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
      default:
        return <InfoIcon />;
    }
  };

  const alertClass = [
    'alert',
    `alert--${type}`,
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
      </div>

      {dismissible && (
        <button
          className="alert-close"
          onClick={onClose}
          aria-label="Close alert"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

Alert.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string,
  message: PropTypes.string,
  dismissible: PropTypes.bool,
  autoDismiss: PropTypes.bool,
  duration: PropTypes.number,
  className: PropTypes.string,
};

export default Alert;
