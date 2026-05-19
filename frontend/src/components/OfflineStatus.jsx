/**
 * Composant OfflineStatus
 * Phase 5.4 - Advanced Features
 *
 * Affiche:
 * - Notification offline
 * - Requêtes en attente
 * - Statut sync
 */

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Snackbar,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SyncIcon from '@mui/icons-material/Sync';
import { useOfflineMode } from '../services/syncService';

/**
 * Composant principal de statut offline
 */
export function OfflineStatus() {
  const { isOnline, pendingCount, sync } = useOfflineMode();
  const [showDetails, setShowDetails] = React.useState(false);

  // Pas d'affichage si online et pas de requêtes en attente
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <>
      {/* Snackbar de notification */}
      <Snackbar
        open={!isOnline || pendingCount > 0}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        autoHideDuration={null}
      >
        <Alert
          severity={isOnline ? 'info' : 'warning'}
          icon={isOnline ? <CloudDoneIcon /> : <CloudOffIcon />}
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {pendingCount > 0 && (
                <Chip
                  label={`${pendingCount} en attente`}
                  size="small"
                  color="warning"
                />
              )}

              {!isOnline && (
                <Typography variant="caption" sx={{ color: 'warning.main' }}>
                  Mode hors ligne
                </Typography>
              )}

              {isOnline && pendingCount > 0 && (
                <Button
                  size="small"
                  color="inherit"
                  onClick={sync}
                  startIcon={<SyncIcon />}
                >
                  Syncer
                </Button>
              )}

              <Button
                size="small"
                color="inherit"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Masquer' : 'Détails'}
              </Button>
            </Box>
          }
        />
      </Snackbar>

      {/* Détails des requêtes en attente */}
      {showDetails && pendingCount > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 80,
            left: 16,
            right: 16,
            p: 2,
            backgroundColor: 'white',
            border: '1px solid #ffb74d',
            borderRadius: 1,
            boxShadow: 2,
            maxHeight: 200,
            overflow: 'auto',
            zIndex: 1300,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>
            Requêtes en attente ({pendingCount})
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Ces requêtes seront envoyées dès la reconnexion
          </Typography>
          {!isOnline && (
            <LinearProgress sx={{ mt: 1 }} />
          )}
        </Box>
      )}
    </>
  );
}

/**
 * Composant de bannière offline (plus visible)
 */
export function OfflineBanner() {
  const { isOnline } = useOfflineMode();

  if (isOnline) return null;

  return (
    <Alert
      severity="warning"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        borderRadius: 0,
      }}
      icon={<CloudOffIcon />}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography>
          ⚠️ Vous êtes hors ligne. Les modifications seront synchronisées à la reconnexion.
        </Typography>
        <Typography variant="caption" color="inherit">
          Connexion en attente...
        </Typography>
      </Box>
    </Alert>
  );
}

/**
 * Indicateur de statut de synchronisation
 */
export function SyncStatusIndicator() {
  const { isOnline, pendingCount } = useOfflineMode();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {isOnline ? (
        <>
          <CloudDoneIcon
            sx={{
              color: pendingCount === 0 ? '#4caf50' : '#ff9800',
              fontSize: 20,
            }}
          />
          <Typography variant="caption">
            {pendingCount === 0 ? 'Synchronisé' : `${pendingCount} en attente`}
          </Typography>
        </>
      ) : (
        <>
          <CloudOffIcon sx={{ color: '#f44336', fontSize: 20, animation: 'pulse 2s infinite' }} />
          <Typography variant="caption" color="error">
            Hors ligne
          </Typography>
        </>
      )}
    </Box>
  );
}

/**
 * Dialog pour confirmer action offline
 */
export function OfflineWarningDialog({ open, onClose, onConfirm, title, message }) {
  return (
    <Alert
      severity="warning"
      onClose={onClose}
      sx={{ mb: 2 }}
    >
      <Typography variant="subtitle2" fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {message}
      </Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button size="small" variant="outlined" onClick={onClose}>
          Annuler
        </Button>
        <Button size="small" variant="contained" onClick={onConfirm}>
          Continuer hors ligne
        </Button>
      </Box>
    </Alert>
  );
}
