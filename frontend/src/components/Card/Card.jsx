import React from 'react';
import PropTypes from 'prop-types';
import { cardTokens, borderRadius, shadows } from '@/design-system/tokens';
import './Card.css';

/**
 * Card Component
 * Container component for content with shadow and rounded corners
 */
const Card = ({
  children,
  variant = 'elevated',
  interactive = false,
  className = '',
  onClick,
  style = {},
  ...props
}) => {
  const cardClass = [
    'card',
    `card--${variant}`,
    interactive && 'card--interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const cardStyle = {
    ...cardTokens,
    borderRadius: borderRadius.lg,
    ...style,
  };

  const handleClick = interactive ? onClick : undefined;

  return (
    <div
      className={cardClass}
      onClick={handleClick}
      style={cardStyle}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['flat', 'elevated', 'outlined', 'interactive']),
  interactive: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object,
};

export default Card;
