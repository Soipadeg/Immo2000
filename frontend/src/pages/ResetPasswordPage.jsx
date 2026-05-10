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
  LinearProgress,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';

const PASSWORD_STRENGTH_RULES = {
  length: (pwd) => pwd.length >= 8,
  uppercase: (pwd) => /[A-Z]/.test(pwd),
  lowercase: (pwd) => /[a-z]/.test(pwd),
  number: (pwd) => /[0-9]/.test(pwd),
  special: (pwd) => /[!@#$%^&*()_+\-=\[\]{};:'",.></?\\|`~]/.test(pwd),
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  const resetToken = location.state?.resetToken;
  const email = location.state?.email;

  // Vérifier que nous avons un token
  React.useEffect(() => {
    if (!resetToken || !email) {
      setError('Lien de réinitialisation invalide. Demandez un nouveau lien.');
    }
  }, [resetToken, email]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    Object.values(PASSWORD_STRENGTH_RULES).forEach((rule) => {
      if (rule(password)) strength += 20;
    });
    return Math.min(100, strength);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.password || !formData.passwordConfirm) {
      setError('Tous les champs sont requis');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    // Vérifier les règles de sécurité
    const unmetRules = Object.entries(PASSWORD_STRENGTH_RULES).filter(
      ([_, rule]) => !rule(formData.password)
    );

    if (unmetRules.length > 0) {
      const unmetNames = unmetRules.map(([name]) => name).join(', ');
      setError(`Mot de passe faible. Manquant: ${unmetNames}`);
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        email,
        resetToken,
        newPassword: formData.password,
      });

      setSuccessMessage('Mot de passe réinitialisé avec succès !');

      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Votre mot de passe a été changé. Connectez-vous.' },
        });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken || !email) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Lien invalide ou expiré
          </Alert>
          <Button variant="contained" href="/forgot-password">
            Demander un nouveau lien
          </Button>
        </Box>
      </Container>
    );
  }

  const getStrengthColor = () => {
    if (passwordStrength < 40) return '#f44336';
    if (passwordStrength < 70) return '#ff9800';
    return '#4caf50';
  };

  const getStrengthLabel = () => {
    if (passwordStrength < 40) return 'Faible';
    if (passwordStrength < 70) return 'Moyen';
    return 'Fort';
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
          Créer un nouveau mot de passe
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper elevation={3} sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Choisissez un mot de passe sécurisé pour <strong>{email}</strong>
            </Typography>

            <TextField
              fullWidth
              label="Nouveau mot de passe"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />

            {/* Indicateur de force */}
            {formData.password && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Force du mot de passe:
                  </Typography>
                  <Typography variant="caption" sx={{ color: getStrengthColor(), fontWeight: 600 }}>
                    {getStrengthLabel()} ({passwordStrength}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  sx={{
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getStrengthColor(),
                    },
                  }}
                />
              </Box>
            )}

            {/* Checklist des règles */}
            {formData.password && (
              <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                  Critères:
                </Typography>
                <Typography variant="caption" color={PASSWORD_STRENGTH_RULES.length(formData.password) ? '#4caf50' : '#999'} sx={{ display: 'block' }}>
                  {PASSWORD_STRENGTH_RULES.length(formData.password) ? '✓' : '✗'} Au moins 8 caractères
                </Typography>
                <Typography variant="caption" color={PASSWORD_STRENGTH_RULES.uppercase(formData.password) ? '#4caf50' : '#999'} sx={{ display: 'block' }}>
                  {PASSWORD_STRENGTH_RULES.uppercase(formData.password) ? '✓' : '✗'} Une lettre majuscule
                </Typography>
                <Typography variant="caption" color={PASSWORD_STRENGTH_RULES.lowercase(formData.password) ? '#4caf50' : '#999'} sx={{ display: 'block' }}>
                  {PASSWORD_STRENGTH_RULES.lowercase(formData.password) ? '✓' : '✗'} Une lettre minuscule
                </Typography>
                <Typography variant="caption" color={PASSWORD_STRENGTH_RULES.number(formData.password) ? '#4caf50' : '#999'} sx={{ display: 'block' }}>
                  {PASSWORD_STRENGTH_RULES.number(formData.password) ? '✓' : '✗'} Un chiffre
                </Typography>
                <Typography variant="caption" color={PASSWORD_STRENGTH_RULES.special(formData.password) ? '#4caf50' : '#999'} sx={{ display: 'block' }}>
                  {PASSWORD_STRENGTH_RULES.special(formData.password) ? '✓' : '✗'} Un caractère spécial
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="Confirmer le mot de passe"
              name="passwordConfirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              margin="normal"
              required
            />

            {formData.password && formData.passwordConfirm && formData.password === formData.passwordConfirm && (
              <Alert severity="success" sx={{ mt: 2 }}>
                ✓ Les mots de passe correspondent
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading || !formData.password || !formData.passwordConfirm}
              type="submit"
            >
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
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
        </Paper>
      </Box>
    </Container>
  );
}
