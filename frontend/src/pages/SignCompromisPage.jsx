/**
 * Page de signature du compromis de vente
 * Intégration DocuSign pour signer le compromis avec OAuth
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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SecurityIcon from '@mui/icons-material/Security';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { transactionsApi, docusignApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Signature du Compromis avec DocuSign
      </Typography>

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
                Notaire
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {transaction?.notaire?.etude_notariale}
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
              📥 Étape 1: Télécharger le Compromis
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Le compromis a été préparé par le notaire. Téléchargez-le pour le consulter avant la signature.
            </Alert>

            <List>
              <ListItem>
                <ListItemIcon>
                  <FileDownloadIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Compromis de vente"
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
                Télécharger le PDF
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
              Vous devez vous connecter à votre compte DocuSign pour signer électroniquement le compromis.
            </Alert>

            <Typography variant="body2" sx={{ mb: 3 }}>
              Lors de la connexion, vous devrez:
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Entrer vos identifiants DocuSign"
                  secondary="Votre email et mot de passe"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Autoriser Immo2000"
                  secondary="Permettre à Immo2000 d'accéder à votre compte"
                />
              </ListItem>
            </List>

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
              ✍️ Étape 3: Signer le Compromis
            </Typography>

            <Alert severity="warning" sx={{ mb: 3 }}>
              Vous allez être redirigé vers <strong>DocuSign</strong> pour placer votre signature électronique sur le
              compromis.
            </Alert>

            <Typography variant="body2" sx={{ mb: 3 }}>
              Lors de la signature, vous devrez:
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <EditIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Placer votre signature"
                  secondary="Cliquez sur les zones de signature indiquées"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EditIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Confirmer votre signature"
                  secondary="Valider la signature électronique"
                />
              </ListItem>
            </List>

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
                color="success"
                onClick={handleRedirectToDocuSign}
                disabled={!signingUrl || submitting}
                fullWidth
                endIcon={<OpenInNewIcon />}
              >
                {submitting ? <CircularProgress size={24} /> : 'Accéder à DocuSign'}
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <strong>Info:</strong> Une fenêtre DocuSign va s'ouvrir. Après avoir signé, revenez ici pour confirmer.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Étape 4: Vérifier */}
      {activeStep === 3 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              ✅ Étape 4: Vérifier la Signature
            </Typography>

            <Alert severity="success" sx={{ mb: 3 }}>
              Votre signature a bien été enregistrée dans DocuSign. Confirmez pour continuer.
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
              Une copie du compromis signé a été archivée dans votre espace personnel. Vous pouvez maintenant procéder
              au paiement du dépôt de garantie.
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
                onClick={handleConfirmSignature}
                disabled={submitting}
                fullWidth
              >
                {submitting ? <CircularProgress size={24} /> : 'Continuer au Paiement'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialog Succès */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: 'success.main' }} />
          Signature Confirmée
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Le compromis a été signé avec succès par DocuSign. Vous pouvez maintenant effectuer le paiement du dépôt
            de garantie.
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
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [docuSignRedirect, setDocuSignRedirect] = useState('');

  // Charger la transaction
  useEffect(() => {
    const loadTransaction = async () => {
      try {
        const res = await transactionsApi.getById(transactionId);
        setTransaction(res.data);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement de la transaction');
        console.error(err);
        setLoading(false);
      }
    };

    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId]);

  // Étape 1: Télécharger le document
  const handleDownloadDocument = async () => {
    try {
      // Simuler le téléchargement
      const mockPdfUrl = `data:application/pdf;base64,JVBERi0xLjQK...`;
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

  // Étape 2: Signer via DocuSign
  const handleSignWithDocuSign = async () => {
    try {
      setSubmitting(true);

      // Créer une session DocuSign
      // TODO: Appeler API pour créer l'enveloppe DocuSign
      // const res = await docusignApi.createEnvelope(...)
      // setDocuSignRedirect(res.redirectUrl)

      // Pour cette démo, on simule
      setDocuSignRedirect(`https://demo.docusign.net/...`);

      // Redirection vers DocuSign
      // window.location.href = res.redirectUrl;
      // À la place, on montre un message
      setActiveStep(2);
    } catch (err) {
      setError('Erreur lors de l\'initialisation de DocuSign');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Étape 3: Vérifier et confirmer
  const handleConfirmSignature = async () => {
    try {
      setSubmitting(true);

      // Vérifier la signature auprès de DocuSign
      // TODO: Récupérer le status de l'enveloppe DocuSign

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Signature du Compromis
      </Typography>

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
                Notaire
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {transaction?.notaire?.etude_notariale}
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
              📥 Étape 1: Télécharger le Compromis
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Le compromis a été préparé par le notaire. Téléchargez-le pour le consulter avant la signature.
            </Alert>

            <List>
              <ListItem>
                <ListItemIcon>
                  <FileDownloadIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Compromis de vente"
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
                Télécharger le PDF
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Signer */}
      {activeStep === 1 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              ✍️ Étape 2: Signer via DocuSign
            </Typography>

            <Alert severity="warning" sx={{ mb: 3 }}>
              Vous allez être redirigé vers <strong>DocuSign</strong> pour signer électroniquement le compromis.
            </Alert>

            <Typography variant="body2" sx={{ mb: 3 }}>
              Lors de la signature, vous devrez:
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <EditIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Placer votre signature"
                  secondary="Cliquez sur les zones de signature indiquées"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Authentifier votre identité"
                  secondary="DocuSign utilisera un code de vérification"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Confirmer la signature"
                  secondary="Valider la signature électronique"
                />
              </ListItem>
            </List>

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
                color="warning"
                onClick={handleSignWithDocuSign}
                disabled={submitting}
                fullWidth
              >
                {submitting ? <CircularProgress size={24} /> : 'Accéder à DocuSign'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Étape 3: Vérifier */}
      {activeStep === 2 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              ✅ Étape 3: Vérifier la Signature
            </Typography>

            <Alert severity="success" sx={{ mb: 3 }}>
              Votre signature a bien été enregistrée dans DocuSign. Confirmez pour continuer.
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
                  <Typography variant="body2">{`Envelope #${Math.random().toString(36).substr(2, 9)}`}</Typography>
                </Grid>
              </Grid>
            </Card>

            <Typography variant="body2" sx={{ mb: 3 }}>
              Une copie du compromis signé a été archivée dans votre espace personnel. Vous pouvez maintenant
              procéder au paiement du dépôt de garantie.
            </Typography>

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
                color="success"
                onClick={handleConfirmSignature}
                disabled={submitting}
                fullWidth
              >
                {submitting ? <CircularProgress size={24} /> : 'Continuer au Paiement'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialog Succès */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: 'success.main' }} />
          Signature Confirmée
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Le compromis a été signé avec succès. Vous pouvez maintenant effectuer le paiement du dépôt de garantie.
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
