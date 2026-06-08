/**
 * Loading Spinner Component
 * Utilisé comme fallback pour Suspense lors du chargement des pages
 */

import React from 'react'
import { CircularProgress, Box } from '@mui/material'

const LoadingSpinner = ({ message = 'Chargement en cours...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        gap: 2
      }}
    >
      <CircularProgress
        size={60}
        sx={{
          color: '#1976d2'
        }}
      />
      <p style={{
        fontSize: '16px',
        color: '#666',
        margin: '0 20px',
        textAlign: 'center'
      }}>
        {message}
      </p>
    </Box>
  )
}

export default LoadingSpinner
