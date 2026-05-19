import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { navbarTokens, spacing } from '@/design-system/tokens';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import './Navbar.css';

/**
 * Navbar Component
 * Fixed navigation bar with responsive mobile menu
 */
const Navbar = ({
  logo,
  navLinks = [],
  rightContent,
  sticky = true,
  className = '',
  ...props
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navbarClass = [
    'navbar',
    sticky && 'navbar--sticky',
    mobileMenuOpen && 'navbar--menu-open',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const navbarStyle = {
    height: navbarTokens.heightDesktop,
    background: navbarTokens.background,
    boxShadow: navbarTokens.shadow,
    zIndex: navbarTokens.zIndex,
  };

  return (
    <nav className={navbarClass} style={navbarStyle} {...props}>
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          {typeof logo === 'string' ? <span className="navbar-logo__text">{logo}</span> : logo}
        </div>

        {/* Desktop Navigation Links */}
        <div className="navbar-links">
          {navLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className={`navbar-link ${link.active ? 'navbar-link--active' : ''}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Content */}
        <div className="navbar-right">
          {rightContent}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">
          <div className="navbar-mobile-links">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className={`navbar-mobile-link ${link.active ? 'navbar-mobile-link--active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
          {rightContent && (
            <div className="navbar-mobile-right">
              {rightContent}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

Navbar.propTypes = {
  logo: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  navLinks: PropTypes.arrayOf(
    PropTypes.shape({
      href: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      active: PropTypes.bool,
    })
  ),
  rightContent: PropTypes.node,
  sticky: PropTypes.bool,
  className: PropTypes.string,
};

export default Navbar;
