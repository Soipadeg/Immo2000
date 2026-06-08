/**
 * PageLayout - Template réutilisable pour toutes les pages
 * Assure une cohérence visuelle avec en-tête, contenu et sections
 */

import React from 'react';
import { Button, Card } from '@/components';
import './PageLayout.css';

const PageLayout = ({
  icon = '📄',
  title = 'Page Title',
  subtitle = 'Page description',
  actionButton = null,
  children,
  sections = [],
  stats = [],
  className = '',
}) => {
  return (
    <div className={`page-layout ${className}`}>
      {/* En-tête avec titre */}
      <div className="page-header">
        <div className="page-header__content">
          <div className="page-header__title-section">
            <span className="page-header__icon">{icon}</span>
            <div>
              <h1 className="page-header__title">{title}</h1>
              {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
            </div>
          </div>
          {actionButton && (
            <div className="page-header__action">
              {actionButton}
            </div>
          )}
        </div>
      </div>

      {/* Statistiques si fourni */}
      {stats.length > 0 && (
        <div className="page-stats">
          {stats.map((stat, index) => (
            <Card key={index} className="stat-card">
              <div className="stat-card__item">
                <div className="stat-card__label">{stat.label}</div>
                <div className="stat-card__value">{stat.value}</div>
                {stat.trend && (
                  <div className={`stat-card__trend ${stat.trendUp ? 'up' : 'down'}`}>
                    {stat.trendUp ? '📈' : '📉'} {stat.trend}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Contenu principal */}
      <div className="page-content">
        {children}
      </div>

      {/* Sections supplémentaires */}
      {sections.length > 0 && (
        <div className="page-sections">
          {sections.map((section, index) => (
            <Card key={index} className="page-section">
              {section.title && (
                <h2 className="page-section__title">{section.title}</h2>
              )}
              <div className="page-section__content">
                {section.content}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageLayout;
