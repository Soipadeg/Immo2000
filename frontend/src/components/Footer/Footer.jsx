import React from 'react';
import PropTypes from 'prop-types';
import { footerTokens, spacing } from '@/design-system/tokens';
import './Footer.css';

/**
 * Footer Component
 * Dark footer with company info, links, and newsletter
 */
const Footer = ({
  companyName = 'Immo2000',
  companyDescription,
  socialLinks = [],
  linkSections = [],
  newsletterTitle = 'Subscribe to our newsletter',
  newsletterPlaceholder = 'Enter your email',
  onNewsletterSubmit,
  copyrightText,
  className = '',
  ...props
}) => {
  const footerClass = ['footer', className].filter(Boolean).join(' ');

  const footerStyle = {
    backgroundColor: footerTokens.background,
    color: footerTokens.color,
    padding: footerTokens.padding,
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email?.value;
    if (email && onNewsletterSubmit) {
      onNewsletterSubmit(email);
      e.target.reset();
    }
  };

  return (
    <footer className={footerClass} style={footerStyle} {...props}>
      <div className="footer-container">
        {/* Company Info */}
        <div className="footer-section footer-company">
          <h3 className="footer-title">{companyName}</h3>
          {companyDescription && (
            <p className="footer-description">{companyDescription}</p>
          )}

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="footer-social">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  className="footer-social-link"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon || social.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Link Sections */}
        {linkSections.map((section, index) => (
          <div key={index} className="footer-section">
            <h4 className="footer-section-title">{section.title}</h4>
            <ul className="footer-links">
              {section.links.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <a href={link.href} className="footer-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter */}
        <div className="footer-section footer-newsletter">
          <h4 className="footer-section-title">{newsletterTitle}</h4>
          <form className="footer-newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              name="email"
              placeholder={newsletterPlaceholder}
              className="footer-newsletter-input"
              required
              aria-label="Email address"
            />
            <button
              type="submit"
              className="footer-newsletter-button"
              aria-label="Subscribe"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <p className="footer-copyright">
          {copyrightText || `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`}
        </p>
      </div>
    </footer>
  );
};

Footer.propTypes = {
  companyName: PropTypes.string,
  companyDescription: PropTypes.string,
  socialLinks: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
    })
  ),
  linkSections: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      links: PropTypes.arrayOf(
        PropTypes.shape({
          href: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ),
  newsletterTitle: PropTypes.string,
  newsletterPlaceholder: PropTypes.string,
  onNewsletterSubmit: PropTypes.func,
  copyrightText: PropTypes.string,
  className: PropTypes.string,
};

export default Footer;
