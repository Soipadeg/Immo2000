import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Link,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: Email, 1: Code, 2: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    resetCode: '',
  });
  const [sentEmail, setSentEmail] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  // Étape 1: Envoyer email de réinitialisation
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email) {
      setError('Email requis');
      return;
    }

    setLoading(true);

    try {
      await authApi.requestPasswordReset({ email: formData.email });
      setSentEmail(formData.email);
      setSuccessMessage('Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.');
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2: Vérifier le code et obtenir lien de réinitialisation
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.resetCode) {
      setError('Code de réinitialisation requis');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.verifyResetCode({
        email: sentEmail,
        resetCode: formData.resetCode,
      });

      // Rediriger vers la page de réinitialisation avec le token
      navigate('/reset-password', {
        state: {
          resetToken: response.resetToken,
          email: sentEmail,
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
          Réinitialiser votre mot de passe
        </Typography>

        <Stepper activeStep={step} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Email</StepLabel>
          </Step>
          <Step>
            <StepLabel>Code</StepLabel>
          </Step>
          <Step>
            <StepLabel>Nouveau mot de passe</StepLabel>
          </Step>
        </Stepper>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper elevation={3} sx={{ p: 3 }}>
          {step === 0 && (
            <form onSubmit={handleRequestReset}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Entrez votre adresse email pour recevoir un code de réinitialisation.
              </Typography>

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
              />

              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                sx={{ mt: 3 }}
                disabled={loading}
                type="submit"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le code'}
              </Button>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                  Vous vous souvenez de votre mot de passe ?{' '}
                  <Link href="/login" underline="hover">
                    Se connecter
                  </Link>
                </Typography>
              </Box>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={handleVerifyCode}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Un code a été envoyé à <strong>{sentEmail}</strong>
                <br />
                Entrez le code pour continuer.
              </Typography>

              <TextField
                fullWidth
                label="Code de réinitialisation"
                name="resetCode"
                value={formData.resetCode}
                onChange={handleChange}
                margin="normal"
                placeholder="Ex: 123456"
                required
              />

              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1, mb: 2 }}>
                Le code expire dans 30 minutes.
              </Typography>

              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                sx={{ mt: 3 }}
                disabled={loading}
                type="submit"
              >
                {loading ? 'Vérification...' : 'Vérifier le code'}
              </Button>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  size="small"
                  onClick={() => {
                    setStep(0);
                    setFormData({ email: sentEmail, resetCode: '' });
                    setSentEmail('');
                  }}
                >
                  Utiliser un autre email
                </Button>
              </Box>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
