import React from 'react';
import './StatCard.css';

/**
 * Composant StatCard - Carte statistique professionnelle
 * Affiche une statistique avec icône et couleur thématique
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  trendUp = true,
}) => {
  return (
    <div className="stat-card">
      {/* Contenu texte */}
      <div className="stat-card__content">
        <div className="stat-card__title">{title}</div>

        <div className="stat-card__value">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </div>

        {subtitle && (
          <div className="stat-card__subtitle">{subtitle}</div>
        )}

        {trend && (
          <div className={`stat-card__trend ${trendUp ? 'up' : 'down'}`}>
            <div>{trendUp ? '↑' : '↓'}</div>
            <div>{trend}</div>
          </div>
        )}
      </div>

      {/* Icône */}
      {icon && (
        <div className="stat-card__icon">
          {typeof icon === 'string' ? icon : icon}
        </div>
      )}
    </div>
  );
};

export default StatCard;
