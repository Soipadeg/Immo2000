/**
 * Page de signature de l'acte authentique
 * Signature finale avec DocuSign OAuth
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { transactionsApi, docusignApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Alert, Input } from '@/components';
import '../styles/SignActePage.css';



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
          {completed ? <span className="icon-placeholder">CheckCircleIcon</span> : pending ? <span className="icon-placeholder">HourglassIcon</span> : ''}
        </TimelineDot>
        {index < 3 && <TimelineConnector />}
      </TimelineSeparator>
      <TimelineContent>
        <span>
          {label}
        </p>
      </TimelineContent>
    </TimelineItem>
  );

  if (loading) {
    return (
      <div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="container">
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <h4>
        🔏 Signature de l'Acte Authentique
      </p>
      <p>
        Étape finale de la transaction - Signature irrevocable de l'acte de vente
      </p>

      {/* Avertissement Important */}
      <Alert severity="warning" sx={{ mb: 4 }}>
        <p>
          ⚠️ Attention: Cette signature est irrevocable
        </p>
        <span>
          Une fois l'acte signé par les deux parties (vendeur et acheteur), la transaction sera finalisée et
          irrevocable. Vérifiez tous les détails avant de procéder.
        </p>
      </Alert>

      {/* Timeline des transactions */}
      <div className="card">
        <div className="card">
          <h4>
            📊 Progression de la Transaction
          </p>
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
              <p>
                Bien
              </p>
              <p>
                {transaction?.annonce?.titre}
              </p>
            </div>
            <div className="grid-item">
              <p>
                Prix de Vente
              </p>
              <p>
                {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
              </p>
            </div>
            <div className="grid-item">
              <p>
                Notaire
              </p>
              <p>
                {transaction?.notaire?.etude_notariale}
              </p>
            </div>
            <div className="grid-item">
              <p>
                Statut Paiement
              </p>
              <p>
                ✅ Payé
              </p>
            </div>
          </div>
        </div>
      </div>

      <Divider sx={{ my: 4 }} />

      {/* Stepper */}
      <div className="stepper">
        {steps.map((label) => (
          <div className="step">
            <div className="step">{label}</StepLabel>
          </div>
        ))}
      </div>

      {/* Étape 1: Télécharger */}
      {activeStep === 0 && (
        <div className="card">
          <div className="card">
            <h4>
              📥 Étape 1: Télécharger l'Acte
            </p>

            <Alert severity="info" sx={{ mb: 3 }}>
              L'acte authentique a été préparé par le notaire. Téléchargez-le pour le consulter attentivement.
            </Alert>

            <List>
              <ListItem>
                <span className="icon-placeholder">ListItemIcon</span>
                <ListItemText
                  primary="Acte de vente authentique"
                  secondary={`${transaction?.annonce?.titre} - ${transaction?.prix_compromis?.toLocaleString('fr-FR')} €`}
                />
              </ListItem>
            </List>

            <div>
              <Button
                variant="outlined"
                startIcon={<span className="icon-placeholder">FileDownloadIcon</span>}
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
            <h4>
              🔐 Étape 2: S'authentifier avec DocuSign
            </p>

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
                {submitting ? <span>Loading...</span> : 'Connecter DocuSign'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Étape 3: Signer */}
      {activeStep === 2 && (
        <div className="card">
          <div className="card">
            <h4>
              ✍️ Étape 3: Signer l'Acte
            </p>

            <Alert severity="error" sx={{ mb: 3 }}>
              <p>
                ⚠️ Avertissement: Cette signature est irrevocable
              </p>
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
                endIcon={<span className="icon-placeholder">OpenInNewIcon</span>}
              >
                {submitting ? <span>Loading...</span> : 'Accéder à DocuSign'}
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
            <h4>
              ✅ Étape 4: Finaliser la Transaction
            </p>

            <Alert severity="success" sx={{ mb: 3 }}>
              Votre signature a bien été enregistrée. La transaction peut maintenant être finalisée.
            </Alert>

            <div className="card">
              <div className="grid-container">
                <div className="grid-item">
                  <p>
                    Statut Signature
                  </p>
                  <div>
                    <span className="icon-placeholder">CheckCircleIcon</span>
                    <p>
                      Signée
                    </p>
                  </div>
                </div>
                <div className="grid-item">
                  <p>
                    Enveloppe DocuSign
                  </p>
                  <span>{envelopeId}</p>
                </div>
              </div>
            </div>

            <span>
              L'acte a été signé électroniquement par DocuSign. Le notaire validera la signature et finalisera
              l'enregistrement auprès des services du gouvernement.
            </p>

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
                startIcon={<span className="icon-placeholder">CloudUploadIcon</span>}
              >
                {submitting ? <span>Loading...</span> : 'Finaliser la Transaction'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Succès */}
      <div className="modal"> setSuccessOpen(false)}>
        <div className="modal">
          <span className="icon-placeholder">CheckCircleIcon</span>
          Transaction Finalisée
        </DialogTitle>
        <div className="modal">
          <p>
            Félicitations! Votre transaction a été complètement finalisée. L'acte de vente a été signé par les deux
            parties et est maintenant en cours d'enregistrement auprès des autorités.
          </p>
        </DialogContent>
        <div className="modal">
          <Button onClick={() => setSuccessOpen(false)} variant="contained">
            OK
          </Button>
        </DialogActions>
      </div>
    </div>
  );
}
