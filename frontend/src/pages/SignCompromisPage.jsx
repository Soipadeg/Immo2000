import '../styles/SignCompromisPage.css';
/**
 * Page de signature du compromis de vente
 * Intégration DocuSign pour signer le compromis avec OAuth
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { transactionsApi, docusignApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Alert, Input } from '@/components';



const steps = ['Télécharger', 'Authentifier DocuSign', 'Signer', 'Vérifier'];

export default function SignCompromisPage() {
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
      link.href = `/api/v1/transactions/${transactionId}/compromis/pdf`;
      link.setAttribute('download', `compromis-${transactionId}.pdf`);
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
          documentType: 'sign-compromis',
        })
      );

      // Appeler l'API pour obtenir l'URL d'autorisation DocuSign
      const res = await docusignApi.startOAuth(transactionId, 'compromis');

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

  // Étape 4: Vérifier et confirmer
  const handleConfirmSignature = async () => {
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
      await transactionsApi.signComromis(transactionId);

      setSuccessOpen(true);
      setTimeout(() => {
        navigate(`/transactions/${transactionId}/payment`);
      }, 1500);
    } catch (err) {
      setError('Erreur lors de la confirmation de la signature');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

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
        Signature du Compromis avec DocuSign
      </p>

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
                Notaire
              </p>
              <p>
                {transaction?.notaire?.etude_notariale}
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
              📥 Étape 1: Télécharger le Compromis
            </p>

            <Alert severity="info" sx={{ mb: 3 }}>
              Le compromis a été préparé par le notaire. Téléchargez-le pour le consulter avant la signature.
            </Alert>

            <List>
              <ListItem>
                <span className="icon-placeholder">ListItemIcon</span>
                <ListItemText
                  primary="Compromis de vente"
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
                Télécharger le PDF
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
              Vous devez vous connecter à votre compte DocuSign pour signer électroniquement le compromis.
            </Alert>

            <span>
              Lors de la connexion, vous devrez:
            </p>

            <List>
              <ListItem>
                <span className="icon-placeholder">ListItemIcon</span>
                <ListItemText
                  primary="Entrer vos identifiants DocuSign"
                  secondary="Votre email et mot de passe"
                />
              </ListItem>
              <ListItem>
                <span className="icon-placeholder">ListItemIcon</span>
                <ListItemText
                  primary="Autoriser Immo2000"
                  secondary="Permettre à Immo2000 d'accéder à votre compte"
                />
              </ListItem>
            </List>

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
              ✍️ Étape 3: Signer le Compromis
            </p>

            <Alert severity="warning" sx={{ mb: 3 }}>
              Vous allez être redirigé vers <strong>DocuSign</strong> pour placer votre signature électronique sur le
              compromis.
            </Alert>

            <span>
              Lors de la signature, vous devrez:
            </p>

            <List>
              <ListItem>
                <span className="icon-placeholder">ListItemIcon</span>
                <ListItemText
                  primary="Placer votre signature"
                  secondary="Cliquez sur les zones de signature indiquées"
                />
              </ListItem>
              <ListItem>
                <span className="icon-placeholder">ListItemIcon</span>
                <ListItemText
                  primary="Confirmer votre signature"
                  secondary="Valider la signature électronique"
                />
              </ListItem>
            </List>

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
                color="success"
                onClick={handleRedirectToDocuSign}
                disabled={!signingUrl || submitting}
                fullWidth
                endIcon={<span className="icon-placeholder">OpenInNewIcon</span>}
              >
                {submitting ? <span>Loading...</span> : 'Accéder à DocuSign'}
              </Button>
            </div>

            <Alert severity="info" sx={{ mt: 3 }}>
              <strong>Info:</strong> Une fenêtre DocuSign va s'ouvrir. Après avoir signé, revenez ici pour confirmer.
            </Alert>
          </div>
        </div>
      )}

      {/* Étape 4: Vérifier */}
      {activeStep === 3 && (
        <div className="card">
          <div className="card">
            <h4>
              ✅ Étape 4: Vérifier la Signature
            </p>

            <Alert severity="success" sx={{ mb: 3 }}>
              Votre signature a bien été enregistrée dans DocuSign. Confirmez pour continuer.
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
              Une copie du compromis signé a été archivée dans votre espace personnel. Vous pouvez maintenant procéder
              au paiement du dépôt de garantie.
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
                onClick={handleConfirmSignature}
                disabled={submitting}
                fullWidth
              >
                {submitting ? <span>Loading...</span> : 'Continuer au Paiement'}
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
            <h2>✓ Signature Confirmée</h2>
            <p>
              Le compromis a été signé avec succès par DocuSign. Vous pouvez maintenant effectuer le paiement du dépôt
              de garantie.
            </p>
            <Button onClick={() => setSuccessOpen(false)} variant="primary">
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
}
