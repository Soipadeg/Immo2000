/**
 * Composant pour gérer le callback DocuSign OAuth
 * Traite le code d'autorisation retourné par DocuSign
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import docusignApi from '../services/api/docusign';
import { Button, Alert, Input } from '@/components';
import '../styles/DocuSignCallbackPage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/DocuSignCallbackPage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/DocuSignCallbackPage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/DocuSignCallbackPage.css';





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
    <div maxWidth="sm">
      <div>
        {status === 'processing' && (
          <>
            <div size={60} />
            <h5 variant="h5">
              Traitement du callback DocuSign...
            </h5>
            <p color="textSecondary">
              Veuillez patienter pendant que nous finalisons votre authentification.
            </h5>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon />
            <h5 variant="h5">
              ✅ Authentification Réussie
            </h5>
            <p>{message}</h5>
            <p color="textSecondary">Redirection en cours...</h5>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorIcon />
            <h5 variant="h5">
              ❌ Erreur
            </h5>
            <Alert severity="error">
              {message}
            </Alert>
            <p color="textSecondary">Redirection en cours...</h5>
          </>
        )}
      </div>
    </div>
  );
}
