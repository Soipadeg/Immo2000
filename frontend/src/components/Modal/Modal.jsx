import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './Modal.css';

/**
 * Modal Component
 * Accessible modal dialog with overlay
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeButton = true,
  scrollable = false,
  className = '',
  ...props
}) => {
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalClass = [
    'modal-overlay',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const contentClass = [
    'modal-content',
    `modal-content--${size}`,
    scrollable && 'modal-content--scrollable',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={modalClass} onClick={onClose} {...props}>
      <div
        className={contentClass}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        <div className="modal-header">
          {title && <h2 id="modal-title" className="modal-title">{title}</h2>}
          {closeButton && (
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  closeButton: PropTypes.bool,
  scrollable: PropTypes.bool,
  className: PropTypes.string,
};

export default Modal;
