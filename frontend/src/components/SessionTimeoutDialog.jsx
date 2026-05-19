/**
 * Dialog pour avertissement de timeout de session
 */

import React, { useEffect, useState } from 'react';


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
      <DialogTitle>
        <WarningIcon />
        Session Expiring Soon
      </DialogTitle>

      <DialogContent>
        <div>
          <p>
            Votre session expire dans{' '}
            <strong style={{ color: '#ff9800' }}>
              {formatTime(displayTime)}
            </strong>
          </p>

          <p>
            Pour des raisons de sécurité, votre session expirera après 24 heures
            d'inactivité. Cliquez sur "Prolonger la session" pour continuer votre
            travail.
          </p>

          <LinearProgress variant="determinate" value={progress} />
        </div>
      </DialogContent>

      <DialogActions>
        <button onClick={onLogout} color="error">
          Déconnexion
        </button>
        <button onClick={onExtend} variant="contained" color="primary">
          Prolonger la session
        </button>
      </DialogActions>
    </Dialog>
  );
}
