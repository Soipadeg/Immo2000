import React from 'react';
import { Paper, Box, Typography, Icon, useTheme } from '@mui/material';

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
  const theme = useTheme();

  // Déterminer la couleur en fonction du paramètre
  const colorValue = theme.palette[color]?.main || color;
  const colorLight = theme.palette[color]?.light || color;

  return (
    <Paper
      sx={{
        p: 3,
        background: `linear-gradient(135deg, ${colorLight}15 0%, ${colorValue}08 100%)`,
        border: `1px solid ${colorLight}30`,
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        cursor: 'default',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${colorValue}20`,
          borderColor: `${colorLight}60`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Contenu texte */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'textSecondary',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mt: 1.5,
              mb: 1,
              color: 'textPrimary',
            }}
          >
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </Typography>

          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}

          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: trendUp ? 'success.main' : 'error.main',
                  fontWeight: 600,
                }}
              >
                {trendUp ? '↑' : '↓'} {trend}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Icône */}
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '12px',
              backgroundColor: `${colorValue}15`,
              color: colorValue,
              flexShrink: 0,
              ml: 2,
            }}
          >
            {typeof icon === 'string' ? (
              <Icon>{icon}</Icon>
            ) : (
              React.cloneElement(icon, {
                sx: { fontSize: 28, ...(icon.props?.sx || {}) },
              })
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default StatCard;
