import '../styles/SignActePage.css';
/**
 * Page de signature de l'acte authentique
 * Signature finale avec DocuSign OAuth
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { transactionsApi, docusignApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Alert, Input } from '@/components';



const steps = ['Télécharger', 'Authentifier DocuSign', 'Signer', 'Finaliser'];

export default function SignActePage() {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [envelopeId, setEnvelopeId] = useState(searchParams.get('envelope') || null);
  const [signingUrl, setSigningUrl] = useState(null);

  // Charger la transaction
  useEffect(() => {
    const loadTransaction = async () => {
      try {
        const res = await transactionsApi.getById(transactionId);
        setTransaction(res.data);
        setLoading(false);

        // Si on vient du callback DocuSign, avancer aux étapes suivantes
        if (envelopeId) {
          setActiveStep(2);
          await loadSigningUrl(envelopeId);
        }
      } catch (err) {
        setError('Erreur lors du chargement de la transaction');
        console.error(err);
        setLoading(false);
      }
    };

    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId, envelopeId]);

  const loadSigningUrl = async (envId) => {
    try {
      const res = await docusignApi.getSigningUrl(transactionId, envId);
      setSigningUrl(res.signing_url);
    } catch (err) {
      console.error('Erreur récupération URL signature:', err);
      setError('Erreur lors de la récupération du lien de signature');
    }
  };

  // Étape 1: Télécharger le document
  const handleDownloadDocument = async () => {
    try {
      const link = document.createElement('a');
      link.href = `/api/v1/transactions/${transactionId}/acte/pdf`;
      link.setAttribute('download', `acte-${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setActiveStep(1);
    } catch (err) {
      setError('Erreur lors du téléchargement du document');
      console.error(err);
    }
  };

  // Étape 2: Initier OAuth DocuSign
  const handleStartDocuSignAuth = async () => {
    try {
      setSubmitting(true);

      // Sauvegarder l'état pour le callback
      localStorage.setItem(
        'docusign_oauth_state',
        JSON.stringify({
          transactionId,
          documentType: 'sign-acte',
        })
      );

      // Appeler l'API pour obtenir l'URL d'autorisation DocuSign
      const res = await docusignApi.startOAuth(transactionId, 'acte');

      // Rediriger vers DocuSign pour authentification
      window.location.href = res.auth_url;
    } catch (err) {
      setError('Erreur lors de la connexion à DocuSign');
      console.error(err);
      setSubmitting(false);
    }
  };

  // Étape 3: Rediriger vers DocuSign pour signer
  const handleRedirectToDocuSign = async () => {
    try {
      if (signingUrl) {
        // Ouvrir DocuSign dans une nouvelle fenêtre
        const docusignWindow = window.open(signingUrl, 'docusign_signing');

        if (!docusignWindow) {
          setError('Veuillez autoriser les pop-ups pour accéder à DocuSign');
          return;
        }

        // Vérifier le statut de la signature toutes les 2 secondes
        const checkInterval = setInterval(async () => {
          try {
            const status = await docusignApi.getEnvelopeStatus(transactionId, envelopeId);

            if (status.status === 'completed') {
              clearInterval(checkInterval);
              setActiveStep(3);
            } else if (status.status === 'declined' || status.status === 'voided') {
              clearInterval(checkInterval);
              setError('La signature a été déclinée ou annulée');
            }
          } catch (err) {
            // Ignorer les erreurs durant le polling
          }
        }, 2000);

        // Arrêter le polling après 30 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 30 * 60 * 1000);
      }
    } catch (err) {
      setError('Erreur lors de la redirection DocuSign');
      console.error(err);
    }
  };

  // Étape 4: Finaliser la transaction
  const handleFinalizeTransaction = async () => {
    try {
      setSubmitting(true);

      // Vérifier la signature
      const status = await docusignApi.getEnvelopeStatus(transactionId, envelopeId);

      if (status.status !== 'completed') {
        setError('La signature n\'est pas complétée');
        setSubmitting(false);
        return;
      }

      // Confirmer côté serveur
      await transactionsApi.signActe(transactionId);

      setSuccessOpen(true);
      setTimeout(() => {
        navigate('/transactions');
      }, 1500);
    } catch (err) {
      setError('Erreur lors de la finalisation de la transaction');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Timeline des étapes
  const getTimelineItem = (index, label, completed = false, pending = false) => (
    <TimelineItem key={label}>
      <TimelineSeparator>
        <TimelineDot
          sx={{
            bgcolor: completed ? 'success.main' : pending ? 'warning.main' : 'action.disabled',
          }}
        >
          {completed ? <div className="icon-placeholder">CheckCircleIcon</div> : pending ? <div className="icon-placeholder">HourglassIcon</div> : ''}
        </TimelineDot>
        {index < 3 && <TimelineConnector />}
      </TimelineSeparator>
      <TimelineContent>
        <div>
          {label}
        </div>
      </TimelineContent>
    </TimelineItem>
  );

  if (loading) {
    return (
      <div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <div>
        🔏 Signature de l'Acte Authentique
      </div>
      <div>
        Étape finale de la transaction - Signature irrevocable de l'acte de vente
      </div>

      {/* Avertissement Important */}
      <Alert severity="warning" sx={{ mb: 4 }}>
        <div>
          ⚠️ Attention: Cette signature est irrevocable
        </div>
        <div>
          Une fois l'acte signé par les deux parties (vendeur et acheteur), la transaction sera finalisée et
          irrevocable. Vérifiez tous les détails avant de procéder.
        </div>
      </Alert>

      {/* Timeline des transactions */}
      <div className="card">
        <div className="card">
          <div>
            📊 Progression de la Transaction
          </div>
          <Timeline position="alternate">
            {getTimelineItem(0, 'Compromis Signé', true)}
            {getTimelineItem(1, 'Paiement Effectué', true)}
            {getTimelineItem(2, 'Acte Préparé', true)}
            {getTimelineItem(3, 'Acte Signature', activeStep >= 3, activeStep >= 3)}
            {getTimelineItem(4, 'Finalisation', false, activeStep >= 4)}
          </Timeline>
        </div>
      </div>

      {/* Infos transaction */}
      <div className="card">
        <div className="card">
          <div className="grid-container">
            <div className="grid-item">
              <div>
                Bien
              </div>
              <div>
                {transaction?.annonce?.titre}
              </div>
            </div>
            <div className="grid-item">
              <div>
                Prix de Vente
              </div>
              <div>
                {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
              </div>
            </div>
            <div className="grid-item">
              <div>
                Notaire
              </div>
              <div>
                {transaction?.notaire?.etude_notariale}
              </div>
            </div>
            <div className="grid-item">
              <div>
                Statut Paiement
              </div>
              <div>
                ✅ Payé
              </div>
            </div>
          </div>
        </div>
      </div>

      <Divider sx={{ my: 4 }} />

      {/* Stepper */}
      <div className="stepper">
        {steps.map((label) => (
          <div className="step">
            <div className="step">{label}</div>
          </div>
        ))}
      </div>

      {/* Étape 1: Télécharger */}
      {activeStep === 0 && (
        <div className="card">
          <div className="card">
            <div>
              📥 Étape 1: Télécharger l'Acte
            </div>

            <Alert severity="info" sx={{ mb: 3 }}>
              L'acte authentique a été préparé par le notaire. Téléchargez-le pour le consulter attentivement.
            </Alert>

            <List>
              <li>
                <div className="icon-placeholder">ListItemIcon</div>
                <ListItemText
                  primary="Acte de vente authentique"
                  secondary={`${transaction?.annonce?.titre} - ${transaction?.prix_compromis?.toLocaleString('fr-FR')} €`}
                />
              </li>
            </List>

            <div>
              <Button
                variant="outlined"
                startIcon={<div className="icon-placeholder">FileDownloadIcon</div>}
                onClick={handleDownloadDocument}
                fullWidth
              >
                Télécharger l'Acte (PDF)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Étape 2: Authentifier DocuSign */}
      {activeStep === 1 && (
        <div className="card">
          <div className="card">
            <div>
              🔐 Étape 2: S'authentifier avec DocuSign
            </div>

            <Alert severity="info" sx={{ mb: 3 }}>
              Vous devez vous connecter à votre compte DocuSign pour signer électroniquement l'acte.
            </Alert>

            <div>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                disabled={submitting}
              >
                Retour
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartDocuSignAuth}
                disabled={submitting}
                fullWidth
              >
                {submitting ? <div>Loading...</div> : 'Connecter DocuSign'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Étape 3: Signer */}
      {activeStep === 2 && (
        <div className="card">
          <div className="card">
            <div>
              ✍️ Étape 3: Signer l'Acte
            </div>

            <Alert severity="error" sx={{ mb: 3 }}>
              <div>
                ⚠️ Avertissement: Cette signature est irrevocable
              </div>
              Vous êtes sur le point de signer l'acte authentique. Cette signature engagera définitivement les deux
              parties. Vous avez un délai de 48 heures pour vous rétracter après cette signature.
            </Alert>

            <div>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(1)}
                disabled={submitting}
              >
                Retour
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleRedirectToDocuSign}
                disabled={!signingUrl || submitting}
                fullWidth
                endIcon={<div className="icon-placeholder">OpenInNewIcon</div>}
              >
                {submitting ? <div>Loading...</div> : 'Accéder à DocuSign'}
              </Button>
            </div>

            <Alert severity="info" sx={{ mt: 3 }}>
              Une fenêtre DocuSign va s'ouvrir. Après avoir signé, revenez ici pour confirmer.
            </Alert>
          </div>
        </div>
      )}

      {/* Étape 4: Finaliser */}
      {activeStep === 3 && (
        <div className="card">
          <div className="card">
            <div>
              ✅ Étape 4: Finaliser la Transaction
            </div>

            <Alert severity="success" sx={{ mb: 3 }}>
              Votre signature a bien été enregistrée. La transaction peut maintenant être finalisée.
            </Alert>

            <div className="card">
              <div className="grid-container">
                <div className="grid-item">
                  <div>
                    Statut Signature
                  </div>
                  <div>
                    <div className="icon-placeholder">CheckCircleIcon</div>
                    <div>
                      Signée
                    </div>
                  </div>
                </div>
                <div className="grid-item">
                  <div>
                    Enveloppe DocuSign
                  </div>
                  <div>{envelopeId}</div>
                </div>
              </div>
            </div>

            <div>
              L'acte a été signé électroniquement par DocuSign. Le notaire validera la signature et finalisera
              l'enregistrement auprès des services du gouvernement.
            </div>

            <div>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(2)}
                disabled={submitting}
              >
                Retour
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleFinalizeTransaction}
                disabled={submitting}
                fullWidth
                startIcon={<div className="icon-placeholder">CloudUploadIcon</div>}
              >
                {submitting ? <div>Loading...</div> : 'Finaliser la Transaction'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            textAlign: 'center',
          }}>
            <div>✓ Transaction Finalisée</div>
            <div>
              Félicitations! Votre transaction a été complètement finalisée. L'acte de vente a été signé par les deux
              parties et est maintenant en cours d'enregistrement auprès des autorités.
            </div>
            <Button onClick={() => setSuccessOpen(false)} variant="primary">
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
