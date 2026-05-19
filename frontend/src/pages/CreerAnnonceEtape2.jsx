import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Stack,
  Grid,
  LinearProgress,
  Link,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { register } from '../services/api';

/**
 * Page ÉTAPE 2 du tunnel : Création de compte
 *
 * Utilisateur remplit :
 * - Email
 * - Mot de passe (min 8 chars, majuscule, minuscule, chiffre, spécial)
 * - Nom, Prénom
 * - Téléphone
 */
export default function CreerAnnonceEtape2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const annonceId = searchParams.get('annonce_id');

  const [formData, setFormData] = useState({
    email: '',
    mot_de_passe: '',
    mot_de_passe_confirm: '',
    nom: '',
    prenom: '',
    telephone: '',
    acceptCGU: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Calculer la force du mot de passe
    if (name === 'mot_de_passe') {
      let strength = 0;
      if (value.length >= 8) strength += 25;
      if (/[A-Z]/.test(value)) strength += 25;
      if (/[a-z]/.test(value)) strength += 25;
      if (/[0-9!@#$%^&*()_+\-=\[\]{};:',.<>?/\\|`~]/.test(value)) strength += 25;
      setPasswordStrength(strength);
    }

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return;
    }

    if (!/^[^@]+@[^@]+\.[^@]+$/.test(formData.email)) {
      setError('Email invalide');
      return;
    }

    if (formData.mot_de_passe.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!/[A-Z]/.test(formData.mot_de_passe)) {
      setError('Le mot de passe doit contenir au moins une majuscule');
      return;
    }

    if (!/[a-z]/.test(formData.mot_de_passe)) {
      setError('Le mot de passe doit contenir au moins une minuscule');
      return;
    }

    if (!/[0-9]/.test(formData.mot_de_passe)) {
      setError('Le mot de passe doit contenir au moins un chiffre');
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};:',.<>?/\\|`~]/.test(formData.mot_de_passe)) {
      setError('Le mot de passe doit contenir au moins un caractère spécial');
      return;
    }

    if (formData.mot_de_passe !== formData.mot_de_passe_confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!formData.nom.trim() || !formData.prenom.trim()) {
      setError('Nom et prénom sont requis');
      return;
    }

    if (!formData.telephone.trim()) {
      setError('Téléphone est requis');
      return;
    }

    if (!formData.acceptCGU) {
      setError('Vous devez accepter les CGU et la politique de confidentialité');
      return;
    }

    setLoading(true);

    try {
      // Appeler l'API
      const response = await register({
        email: formData.email,
        mot_de_passe: formData.mot_de_passe,
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        annonce_id: annonceId ? parseInt(annonceId) : null,
      });

      // Stocker le token
      if (response.access_token) {
        localStorage.setItem('auth_token', response.access_token);
      }

      // Rediriger vers étape 3
      navigate(`/creer-annonce/etape3?annonce_id=${annonceId}`, {
        state: {
          message: 'Compte créé avec succès ! Passez à l\'étape suivante.',
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        {/* Titre */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            👤 Créer votre compte
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Étape 2 sur 4 : Profil de base
          </Typography>
          <LinearProgress variant="determinate" value={50} sx={{ mt: 2 }} />
        </Box>

        {/* Erreurs */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Formulaire */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Email */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vous@exemple.com"
                  required
                />
              </Grid>

              {/* Nom et Prénom */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Dupont"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  placeholder="Jean"
                  required
                />
              </Grid>

              {/* Téléphone */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  name="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  required
                />
              </Grid>

              {/* Mot de passe */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mot de passe"
                  name="mot_de_passe"
                  type="password"
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  required
                  helperText="Min 8 caractères, majuscule, minuscule, chiffre, caractère spécial"
                />
                {formData.mot_de_passe && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress variant="determinate" value={passwordStrength} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Force du mot de passe: {passwordStrength}%
                    </Typography>
                  </Box>
                )}
              </Grid>

              {/* Confirmation mot de passe */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirmer le mot de passe"
                  name="mot_de_passe_confirm"
                  type="password"
                  value={formData.mot_de_passe_confirm}
                  onChange={handleChange}
                  required
                />
              </Grid>

              {/* CGU / Politique */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="acceptCGU"
                      checked={formData.acceptCGU}
                      onChange={handleChange}
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
                        Politique de Confidentialité
                      </Link>
                    </Typography>
                  }
                />
              </Grid>
            </Grid>

            {/* Boutons */}
            <Stack direction="row" spacing={2} sx={{ mt: 4, justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate(-1)}
              >
                Retour
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Création en cours...' : 'Continuer vers étape 3'}
              </Button>
            </Stack>

            {/* Lien vers login */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Vous avez déjà un compte ?{' '}
                <Link href="/connexion" underline="hover">
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
