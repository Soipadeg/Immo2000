import React from 'react';
import { Card, CardContent, Box, Typography, Button, Chip, useTheme } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

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
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pb: 2 }}>
        {/* Header avec icône et badge */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
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
          </Box>

          {badge && (
            <Chip
              label={badge}
              size="small"
              color={badgeColor}
              variant="outlined"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          )}
        </Box>

        {/* Titre et description */}
        <Box sx={{ mb: 2, flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: 'textPrimary',
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              lineHeight: 1.6,
              mb: 1,
            }}
          >
            {description}
          </Typography>

          {/* Stats optionnels */}
          {stats !== undefined && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                fontWeight: 600,
                color: theme.palette.primary.main,
              }}
            >
              {stats} élément{stats !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Contenu personnalisé */}
        {children && <Box sx={{ mb: 2 }}>{children}</Box>}
      </CardContent>

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          pt: 0,
          px: 3,
          pb: 2,
        }}
      >
        {(path || onClick) && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            endIcon={<ArrowForward />}
            onClick={handleClick}
            sx={{
              fontWeight: 600,
            }}
          >
            Accéder
          </Button>
        )}
        {actions}
      </Box>
    </Card>
  );
};

export default FeatureCard;
