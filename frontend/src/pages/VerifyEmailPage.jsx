import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    verificationCode: searchParams.get('token') || '',
  });
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const email = location.state?.email || localStorage.getItem('user_email') || '';
  const requiresVerification = location.state?.requiresVerification || false;

  // Timer pour le délai de renvoi
  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Vérifier automatiquement si token en URL
  useEffect(() => {
    if (searchParams.get('token')) {
      handleAutoVerify();
    }
  }, []);

  const handleAutoVerify = async () => {
    const token = searchParams.get('token');
    if (!token) return;

    setVerifying(true);

    try {
      await authApi.verifyEmail({ verificationToken: token });

      setSuccessMessage('✓ Email vérifié avec succès !');

      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Email vérifiée. Vous pouvez maintenant vous connecter.' },
        });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Vérification échouée');
      setVerifying(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.verificationCode) {
      setError('Code de vérification requis');
      return;
    }

    setLoading(true);

    try {
      await authApi.verifyEmail({ verificationToken: formData.verificationCode });

      setSuccessMessage('✓ Email vérifié avec succès !');

      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Email vérifiée. Vous pouvez maintenant vous connecter.' },
        });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCountdown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      await authApi.resendVerificationEmail({ email });

      setSuccessMessage('✓ Email de vérification renvoyé !');
      setResendCountdown(60); // 60 secondes avant de pouvoir renvoyer
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du renvoi');
    } finally {
      setResendLoading(false);
    }
  };

  if (verifying) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">
            Vérification de votre email...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
          Vérifier votre email
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper elevation={3} sx={{ p: 3 }}>
          {requiresVerification ? (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Pour activer votre compte, vérifiez votre adresse email.
                <br />
                <strong>{email}</strong>
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                📧 Un email de vérification a été envoyé. Cliquez sur le lien dans l'email ou entrez le code ci-dessous.
              </Alert>

              <form onSubmit={handleVerify}>
                <TextField
                  fullWidth
                  label="Code de vérification"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  margin="normal"
                  placeholder="Ex: abc123def456"
                  required
                />

                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1, mb: 2 }}>
                  Vous devriez recevoir le code dans quelques minutes.
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
                  {loading ? 'Vérification...' : 'Vérifier mon email'}
                </Button>
              </form>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Vous n'avez pas reçu le code ?
                </Typography>
                <Button
                  size="small"
                  onClick={handleResendEmail}
                  disabled={resendLoading || resendCountdown > 0}
                >
                  {resendCountdown > 0 ? `Renvoyer dans ${resendCountdown}s` : 'Renvoyer le code'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Vérifiez votre email pour continuer.
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                📧 Un lien de vérification a été envoyé à <strong>{email}</strong>
              </Alert>

              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                sx={{ mt: 3 }}
                onClick={() => window.location.href = 'mailto:'}
              >
                Ouvrir l'email
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                sx={{ mt: 2 }}
                onClick={handleResendEmail}
                disabled={resendCountdown > 0}
              >
                {resendCountdown > 0 ? `Renvoyer dans ${resendCountdown}s` : 'Renvoyer l\'email'}
              </Button>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Link href="/login" underline="hover">
                  Retour à la connexion
                </Link>
              </Box>
            </>
          )}
        </Paper>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="caption">
            <strong>Pourquoi vérifier l'email ?</strong>
            <br />
            Cela protège votre compte et nous permet de vous envoyer des notifications importantes.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
}
