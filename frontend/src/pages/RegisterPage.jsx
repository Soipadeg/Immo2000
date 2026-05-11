import React, { useState, useRef } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Link,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { register as apiRegister } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const recaptchaRef = useRef();
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    prenom: '',
    nom: '',
    telephone: '',
    acceptCGU: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.nom || !formData.prenom || !formData.telephone) {
      setError('Tous les champs sont requis');
      return;
    }

    if (!formData.acceptCGU) {
      setError('Vous devez accepter les Conditions Générales d\'Utilisation et la Politique de Confidentialité');
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

    // Validation du téléphone (format basique)
    const phoneRegex = /^[+]?[0-9\s\-()]{9,}$/;
    if (!phoneRegex.test(formData.telephone.replace(/\s/g, ''))) {
      setError('Numéro de téléphone invalide');
      return;
    }

    setLoading(true);

    try {
      // Récupérer le token ReCAPTCHA
      setCaptchaLoading(true);
      const captchaToken = await recaptchaRef.current.executeAsync();
      setCaptchaLoading(false);

      if (!captchaToken) {
        setError('Erreur de vérification de sécurité. Veuillez réessayer.');
        setLoading(false);
        return;
      }

      const response = await apiRegister({
        ...formData,
        captchaToken,
      });

      // Redirection automatique vers login
      navigate('/login', {
        state: { message: 'Inscription réussie ! Connectez-vous.' },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
      setCaptchaLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
          Créer un compte
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper elevation={3} sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
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

            <TextField
              fullWidth
              label="Prénom"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Téléphone"
              name="telephone"
              type="tel"
              value={formData.telephone}
              onChange={handleChange}
              margin="normal"
              placeholder="+33 6 12 34 56 78"
              required
            />

            <TextField
              fullWidth
              label="Mot de passe"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />

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

            {/* Acceptation CGU/RGPD */}
            <Stack sx={{ mt: 3, mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="acceptCGU"
                    checked={formData.acceptCGU}
                    onChange={handleCheckboxChange}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    J'accepte les{' '}
                    <Link href="/cgu" target="_blank" underline="hover">
                      Conditions Générales d'Utilisation
                    </Link>
                    {' '}et la{' '}
                    <Link href="/politique-confidentialite" target="_blank" underline="hover">
                      Politique de Confidentialité (RGPD)
                    </Link>
                  </Typography>
                }
              />
            </Stack>

            {/* ReCAPTCHA v3 (invisible) */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                size="invisible"
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading || captchaLoading}
              type="submit"
            >
              {captchaLoading ? 'Vérification de sécurité...' : loading ? 'Inscription en cours...' : 'S\'inscrire'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Vous avez déjà un compte ?{' '}
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
