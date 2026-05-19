/**
 * Composant pour gérer le callback DocuSign OAuth
 * Traite le code d'autorisation retourné par DocuSign
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Container,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import docusignApi from '../services/api/docusign';

export default function DocuSignCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Récupérer transactionId et documentType du state (stocké en localStorage)
        const callbackState = JSON.parse(localStorage.getItem('docusign_oauth_state') || '{}');
        const { transactionId, documentType } = callbackState;

        if (error) {
          setStatus('error');
          setMessage(`Erreur DocuSign: ${error}`);
          setTimeout(() => {
            navigate(`/transactions/${transactionId}/${documentType}`);
          }, 3000);
          return;
        }

        if (!code || !transactionId) {
          setStatus('error');
          setMessage('Code ou transaction ID manquant');
          setTimeout(() => {
            navigate(`/transactions/${transactionId}/${documentType}`);
          }, 3000);
          return;
        }

        // Appeler le backend pour traiter le callback
        const response = await docusignApi.handleOAuthCallback(code, state, transactionId);

        setStatus('success');
        setMessage(`Signature initialisée! Enveloppe: ${response.envelope_id}`);

        // Redirection après succès
        setTimeout(() => {
          // Rediriger vers la page appropriée selon documentType
          if (documentType === 'sign-compromis') {
            navigate(`/transactions/${transactionId}/sign-compromis?envelope=${response.envelope_id}`);
          } else if (documentType === 'sign-acte') {
            navigate(`/transactions/${transactionId}/sign-acte?envelope=${response.envelope_id}`);
          } else {
            navigate(`/transactions/${transactionId}`);
          }
        }, 2000);

        // Nettoyer localStorage
        localStorage.removeItem('docusign_oauth_state');
      } catch (err) {
        console.error('Erreur callback DocuSign:', err);
        setStatus('error');
        setMessage(err.response?.data?.message || 'Erreur lors du traitement du callback');

        setTimeout(() => {
          navigate(-1);
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        {status === 'processing' && (
          <>
            <CircularProgress sx={{ mb: 3 }} size={60} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Traitement du callback DocuSign...
            </Typography>
            <Typography color="textSecondary">
              Veuillez patienter pendant que nous finalisons votre authentification.
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main', mb: 2 }}>
              ✅ Authentification Réussie
            </Typography>
            <Typography sx={{ mb: 3 }}>{message}</Typography>
            <Typography color="textSecondary">Redirection en cours...</Typography>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main', mb: 2 }}>
              ❌ Erreur
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Typography color="textSecondary">Redirection en cours...</Typography>
          </>
        )}
      </Box>
    </Container>
  );
}
