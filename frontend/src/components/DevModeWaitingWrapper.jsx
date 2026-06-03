import React, { useEffect, useState } from 'react';

/**
 * Wrapper that ensures dev_mode is properly established before rendering children
 * This prevents race conditions where API calls are made before dev_mode is detected
 */
const DevModeWaitingWrapper = ({ children }) => {
  const [devModeReady, setDevModeReady] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);

  useEffect(() => {
    // Check if we're in dev mode
    const devMode = localStorage.getItem('dev_mode') === 'true';

    if (devMode) {
      // If dev mode, wait a moment to ensure all localStorage values are synced
      // and useAuth() has had time to process them
      const timer = setTimeout(() => {
        // Verify that required dev_mode field is set
        const devRole = localStorage.getItem('dev_role');

        if (devRole) {
          setDevModeReady(true);
          setIsWaiting(false);
        } else {
          console.warn('DevModeWaitingWrapper: Dev mode incomplete, retrying...');
          // Retry after a bit more time
          setTimeout(() => {
            setDevModeReady(true);
            setIsWaiting(false);
          }, 500);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      // Not in dev mode, render immediately
      setDevModeReady(true);
      setIsWaiting(false);
    }
  }, []);

  if (isWaiting) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: '#f5f5f5',
      }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{ color: '#666' }}>Initialisation...</div>
      </div>
    );
  }

  return devModeReady ? children : null;
};

export default DevModeWaitingWrapper;
