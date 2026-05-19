import React
import { Button, Alert, Input } from '@/components';, { useState } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { register } from '../services/api';
import '../styles/CreerAnnonceEtape2.css';

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
    <div maxWidth="sm">
      <div sx={{ py: 4 }}>
        {/* Titre */}
        <div sx={{ mb: 4, textAlign: 'center' }}>
          <h1  component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            👤 Créer votre compte
          </h1>
          <p  sx={{ color: 'text.secondary' }}>
            Étape 2 sur 4 : Profil de base
          </h1>
          <LinearProgress variant="determinate" value={50} sx={{ mt: 2 }} />
        </div>

        {/* Erreurs */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Formulaire */}
        <div elevation={3} sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <div container spacing={2}>
              {/* Email */}
              <div item xs={12}>
                <Input
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vous@exemple.com"
                  required
                / />
              </div>

              {/* Nom et Prénom */}
              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="Nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Dupont"
                  required
                / />
              </div>

              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="Prénom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  placeholder="Jean"
                  required
                / />
              </div>

              {/* Téléphone */}
              <div item xs={12}>
                <Input
                  fullWidth
                  label="Téléphone"
                  name="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  required
                / />
              </div>

              {/* Mot de passe */}
              <div item xs={12}>
                <Input
                  fullWidth
                  label="Mot de passe"
                  name="mot_de_passe"
                  type="password"
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  required
                  helperText="Min 8 caractères, majuscule, minuscule, chiffre, caractère spécial"
                / />
                {formData.mot_de_passe && (
                  <div sx={{ mt: 1 }}>
                    <LinearProgress variant="determinate" value={passwordStrength} />
                    <p  sx={{ color: 'text.secondary' }}>
                      Force du mot de passe: {passwordStrength}%
                    </h1>
                  </div>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div item xs={12}>
                <Input
                  fullWidth
                  label="Confirmer le mot de passe"
                  name="mot_de_passe_confirm"
                  type="password"
                  value={formData.mot_de_passe_confirm}
                  onChange={handleChange}
                  required
                / />
              </div>

              {/* CGU / Politique */}
              <div item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="acceptCGU"
                      checked={formData.acceptCGU}
                      onChange={handleChange}
                    />
                  }
                  label={
                    <span >
                      J'accepte les{' '}
                      <Link href="/cgu" target="_blank" underline="hover">
                        Conditions Générales d'Utilisation
                      </Link>
                      {' '}et la{' '}
                      <Link href="/politique-confidentialite" target="_blank" underline="hover">
                        Politique de Confidentialité
                      </Link>
                    </h1>
                  }
                />
              </div>
            </div>

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
            <div sx={{ mt: 3, textAlign: 'center' }}>
              <span >
                Vous avez déjà un compte ?{' '}
                <Link href="/connexion" underline="hover">
                  Se connecter
                </Link>
              </h1>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
