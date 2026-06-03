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
        <div className="alert"
          icon={isOnline ? <CloudDoneIcon /> : <CloudOffIcon />}
          action={
            <div>
              {pendingCount > 0 && (
                <div className="chip" label={`${pendingCount} en attente`}
                />
              )}

              {!isOnline && (
                <div>
                  Mode hors ligne
                </div>
              )}

              {isOnline && pendingCount > 0 && (
                <button
                  onClick={sync}
                >
                  Syncer
                </button>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Masquer' : 'Détails'}
              </button>
            </div>
          }
        />
      </Snackbar>

      {/* Détails des requêtes en attente */}
      {showDetails && pendingCount > 0 && (
        <div
        >
          <div>
            Requêtes en attente ({pendingCount})
          </div>
          <div>
            Ces requêtes seront envoyées dès la reconnexion
          </div>
          {!isOnline && (
            <div class="progress-bar"><div class="progress-fill"></div></div>
          )}
        </div>
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
    <div className="alert"
      icon={<CloudOffIcon />}
    >
      <div>
        <div>
          ⚠️ Vous êtes hors ligne. Les modifications seront synchronisées à la reconnexion.
        </div>
        <div>
          Connexion en attente...
        </div>
      </div>
    </div>
  );
}

/**
 * Indicateur de statut de synchronisation
 */
export function SyncStatusIndicator() {
  const { isOnline, pendingCount } = useOfflineMode();

  return (
    <div>
      {isOnline ? (
        <>
          <CloudDoneIcon
          />
          <div>
            {pendingCount === 0 ? 'Synchronisé' : `${pendingCount} en attente`}
          </div>
        </>
      ) : (
        <>
          <CloudOffIcon />
          <div>
            Hors ligne
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Dialog pour confirmer action offline
 */
export function OfflineWarningDialog({ open, onClose, onConfirm, title, message }) {
  return (
    <div className="alert"
      onClose={onClose}
    >
      <div>
        {title}
      </div>
      <div>
        {message}
      </div>
      <div>
        <button onClick={onClose}>
          Annuler
        </button>
        <button onClick={onConfirm}>
          Continuer hors ligne
        </button>
      </div>
    </div>
  );
}
