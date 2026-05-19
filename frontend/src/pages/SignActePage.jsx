/**
 * Page de signature de l'acte authentique
 * Signature finale avec DocuSign OAuth
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SecurityIcon from '@mui/icons-material/Security';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssignmentIcon from '@mui/icons-material/Assignment';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HourglassIcon from '@mui/icons-material/HourglassEmpty';
import TimelineIcon from '@mui/lab';
import { transactionsApi, docusignApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

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
          {completed ? <CheckCircleIcon /> : pending ? <HourglassIcon /> : ''}
        </TimelineDot>
        {index < 3 && <TimelineConnector />}
      </TimelineSeparator>
      <TimelineContent>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {label}
        </Typography>
      </TimelineContent>
    </TimelineItem>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
        🔏 Signature de l'Acte Authentique
      </Typography>
      <Typography color="textSecondary" sx={{ mb: 4 }}>
        Étape finale de la transaction - Signature irrevocable de l'acte de vente
      </Typography>

      {/* Avertissement Important */}
      <Alert severity="warning" sx={{ mb: 4 }}>
        <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
          ⚠️ Attention: Cette signature est irrevocable
        </Typography>
        <Typography variant="body2">
          Une fois l'acte signé par les deux parties (vendeur et acheteur), la transaction sera finalisée et
          irrevocable. Vérifiez tous les détails avant de procéder.
        </Typography>
      </Alert>

      {/* Timeline des transactions */}
      <Card sx={{ mb: 4, bgcolor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            📊 Progression de la Transaction
          </Typography>
          <Timeline position="alternate">
            {getTimelineItem(0, 'Compromis Signé', true)}
            {getTimelineItem(1, 'Paiement Effectué', true)}
            {getTimelineItem(2, 'Acte Préparé', true)}
            {getTimelineItem(3, 'Acte Signature', activeStep >= 3, activeStep >= 3)}
            {getTimelineItem(4, 'Finalisation', false, activeStep >= 4)}
          </Timeline>
        </CardContent>
      </Card>

      {/* Infos transaction */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography color="textSecondary" gutterBottom>
                Bien
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {transaction?.annonce?.titre}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="textSecondary" gutterBottom>
                Prix de Vente
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="textSecondary" gutterBottom>
                Notaire
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {transaction?.notaire?.etude_notariale}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="textSecondary" gutterBottom>
                Statut Paiement
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                ✅ Payé
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 4 }} />

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Étape 1: Télécharger */}
      {activeStep === 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              📥 Étape 1: Télécharger l'Acte
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              L'acte authentique a été préparé par le notaire. Téléchargez-le pour le consulter attentivement.
            </Alert>

            <List>
              <ListItem>
                <ListItemIcon>
                  <FileDownloadIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Acte de vente authentique"
                  secondary={`${transaction?.annonce?.titre} - ${transaction?.prix_compromis?.toLocaleString('fr-FR')} €`}
                />
              </ListItem>
            </List>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadDocument}
                fullWidth
              >
                Télécharger l'Acte (PDF)
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Authentifier DocuSign */}
      {activeStep === 1 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              🔐 Étape 2: S'authentifier avec DocuSign
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Vous devez vous connecter à votre compte DocuSign pour signer électroniquement l'acte.
            </Alert>

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
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
                {submitting ? <CircularProgress size={24} /> : 'Connecter DocuSign'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Étape 3: Signer */}
      {activeStep === 2 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              ✍️ Étape 3: Signer l'Acte
            </Typography>

            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
                ⚠️ Avertissement: Cette signature est irrevocable
              </Typography>
              Vous êtes sur le point de signer l'acte authentique. Cette signature engagera définitivement les deux
              parties. Vous avez un délai de 48 heures pour vous rétracter après cette signature.
            </Alert>

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
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
                endIcon={<OpenInNewIcon />}
              >
                {submitting ? <CircularProgress size={24} /> : 'Accéder à DocuSign'}
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              Une fenêtre DocuSign va s'ouvrir. Après avoir signé, revenez ici pour confirmer.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Étape 4: Finaliser */}
      {activeStep === 3 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              ✅ Étape 4: Finaliser la Transaction
            </Typography>

            <Alert severity="success" sx={{ mb: 3 }}>
              Votre signature a bien été enregistrée. La transaction peut maintenant être finalisée.
            </Alert>

            <Card sx={{ bgcolor: '#f0f8ff', p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography color="textSecondary" gutterBottom>
                    Statut Signature
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      Signée
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography color="textSecondary" gutterBottom>
                    Enveloppe DocuSign
                  </Typography>
                  <Typography variant="body2">{envelopeId}</Typography>
                </Grid>
              </Grid>
            </Card>

            <Typography variant="body2" sx={{ mb: 3 }}>
              L'acte a été signé électroniquement par DocuSign. Le notaire validera la signature et finalisera
              l'enregistrement auprès des services du gouvernement.
            </Typography>

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
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
                startIcon={<CloudUploadIcon />}
              >
                {submitting ? <CircularProgress size={24} /> : 'Finaliser la Transaction'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialog Succès */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: 'success.main' }} />
          Transaction Finalisée
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Félicitations! Votre transaction a été complètement finalisée. L'acte de vente a été signé par les deux
            parties et est maintenant en cours d'enregistrement auprès des autorités.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessOpen(false)} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
