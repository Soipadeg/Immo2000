import React from 'react';

/**
 * Composant FeatureCard - Carte fonctionnalité professionnelle
 * Affiche une fonctionnalité avec description et bouton d'accès
 */
const FeatureCard = ({
  title,
  description,
  icon,
  badge,
  badgeColor = 'primary',
  onClick,
  path,
  stats,
  actions,
  children,
}) => {
  const theme = useTheme();

  const handleClick = () => {
    if (path) {
      window.location.href = path;
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: '12px',
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-8px)',
          borderColor: theme.palette.primary.main,
        },
        cursor: path || onClick ? 'pointer' : 'default',
      }}
    >
      <CardContent>
        {/* Header avec icône et badge */}
        <div>
          <div sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '12px',
              backgroundColor: `${theme.palette.primary.main}12`,
              color: theme.palette.primary.main,
            }}
          >
            {typeof icon === 'string' ? (
              icon
            ) : (
              React.cloneElement(icon, {
                sx: { fontSize: 28, ...(icon.props?.sx || {}) },
              })
            )}
          </div>

          {badge && (
            <Chip
              label={badge}
              size="small"
              variant="outlined"
            />
          )}
        </div>

        {/* Titre et description */}
        <div>
          <div>
            {title}
          </div>

          <div>
            {description}
          </div>

          {/* Stats optionnels */}
          {stats !== undefined && (
            <div>
              {stats} élément{stats !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Contenu personnalisé */}
        {children && <div>{children}</div>}
      </CardContent>

      {/* Actions */}
      <div
      >
        {(path || onClick) && (
          <button variant="contained"
            color="primary"
            size="small"
            endIcon={<ArrowForward />}
            onClick={handleClick}
          >
            Accéder
          </button>
        )}
        {actions}
      </div>
    </Card>
  );
};

export default FeatureCard;
