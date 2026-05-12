/**
 * Dialog pour avertissement de timeout de session
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

export default function SessionTimeoutDialog({ timeRemaining, onExtend, onLogout }) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timeRemaining ? (timeRemaining / 300) * 100 : 0; // 300 seconds = 5 minutes

  return (
    <Dialog open={true} disableEscapeKeyDown={true} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon sx={{ color: 'warning.main' }} />
        Session Expiring Soon
      </DialogTitle>

      <DialogContent>
        <Box sx={{ my: 2 }}>
          <Typography variant="body1" gutterBottom>
            Votre session expire dans{' '}
            <strong style={{ color: '#ff9800' }}>
              {formatTime(displayTime)}
            </strong>
          </Typography>

          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Pour des raisons de sécurité, votre session expirera après 24 heures
            d'inactivité. Cliquez sur "Prolonger la session" pour continuer votre
            travail.
          </Typography>

          <LinearProgress variant="determinate" value={progress} sx={{ mt: 2 }} />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onLogout} color="error">
          Déconnexion
        </Button>
        <Button onClick={onExtend} variant="contained" color="primary">
          Prolonger la session
        </Button>
      </DialogActions>
    </Dialog>
  );
}
