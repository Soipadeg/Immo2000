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
  Card,
  CardContent,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';

export default function Verify2FAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
  });
  const [resendCountdown, setResendCountdown] = useState(0);

  const userId = location.state?.user_id;
  const email = location.state?.email;

  // Timer pour renvoi
  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Vérifier les paramètres
  useEffect(() => {
    if (!userId || !email) {
      setError('Accès non autorisé. Veuillez vous connecter.');
    }
  }, [userId, email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Accepter seulement les chiffres et limiter à 6
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setFormData((prev) => ({
      ...prev,
      [name]: numericValue,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.code || formData.code.length !== 6) {
      setError('Entrez un code à 6 chiffres');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.verify2FA({
        userId,
        code: formData.code,
      });

      // Stocker le token JWT
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user_id', response.user_id);
      localStorage.setItem('user_email', response.email);
      localStorage.setItem('user_role', response.role);

      navigate('/', { state: { message: 'Connexion sécurisée !' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    try {
      await authApi.resend2FACode({ userId });
      setResendCountdown(60);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du renvoi');
    }
  };

  if (!userId || !email) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            Accès non autorisé.
            <Button href="/login" sx={{ ml: 1 }}>
              Retourner à la connexion
            </Button>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
          🔐 Authentification à 2 facteurs
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Pour sécuriser votre compte, entrez le code envoyé à:
            <br />
            <strong>{email}</strong>
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Code à 6 chiffres"
              name="code"
              value={formData.code}
              onChange={handleChange}
              margin="normal"
              placeholder="000000"
              inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
              required
              autoFocus
            />

            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1, mb: 2 }}>
              Cherchez le code dans votre email ou votre application d'authentification.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading || formData.code.length !== 6}
              type="submit"
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Vous n'avez pas reçu le code ?
            </Typography>
            <Button
              size="small"
              onClick={handleResendCode}
              disabled={resendCountdown > 0}
            >
              {resendCountdown > 0 ? `Renvoyer dans ${resendCountdown}s` : 'Renvoyer le code'}
            </Button>
          </Box>
        </Paper>

        <Card sx={{ bgcolor: '#e3f2fd', mb: 2 }}>
          <CardContent>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              💡 Conseil de sécurité
            </Typography>
            <Typography variant="caption" color="textSecondary">
              L'authentification à 2 facteurs protège votre compte contre l'accès non autorisé.
              Gardez votre téléphone et votre email sécurisés.
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            href="/login"
            size="small"
            color="secondary"
          >
            Utiliser un autre compte
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
