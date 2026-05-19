import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button, Input, Alert, FormContainer } from '@/components';
import { authApi } from '../services/api';
import './ResetPasswordPage.css';
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

  if (!resetToken || !email) {
    return (
      <FormContainer
        title="Lien invalide"
        subtitle="Ce lien de réinitialisation a expiré"
        maxWidth="small"
      >
        <Alert
          isOpen={true}
          type="error"
          title="Erreur"
          message="Le lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien."
          dismissible={false}
        />
        <Button
          variant="primary"
          size="medium"
          fullWidth
          onClick={() => window.location.href = '/forgot-password'}
          style={{ marginTop: '16px' }}
        >
          Demander un nouveau lien
        </Button>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title="Créer un nouveau mot de passe"
      subtitle={`Choisissez un mot de passe sécurisé pour ${email}`}
      maxWidth="small"
    >
      {successMessage && (
        <Alert
          isOpen={true}
          type="success"
          title="Succès"
          message={successMessage}
          dismissible={false}
        />
      )}

      {error && (
        <Alert
          isOpen={true}
          type="error"
          title="Erreur"
          message={error}
          dismissible={true}
          onClose={() => setError('')}
        />
      )}

      <form onSubmit={handleSubmit} className="reset-password-form">
        <Input
          label="Nouveau mot de passe"
          type="password"
          name="password"
          placeholder="Entrez un mot de passe sécurisé"
          value={formData.password}
          onChange={handleChange}
          required
          hint="Minimum 8 caractères avec majuscules, minuscules, chiffres et caractères spéciaux"
        />

        {/* Indicateur de force */}
        {formData.password && (
          <div className="password-strength">
            <div className="strength-header">
              <span className="strength-label">Force du mot de passe:</span>
              <span className={`strength-value ${getStrengthLabel().toLowerCase()}`}>
                {getStrengthLabel()} ({passwordStrength}%)
              </span>
            </div>
            <div className="strength-bar">
              <div
                className="strength-fill"
                style={{ width: `${passwordStrength}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Checklist des critères */}
        {formData.password && (
          <div className="password-criteria">
            <div className="criteria-label">Critères de sécurité:</div>
            <ul className="criteria-list">
              <li className={PASSWORD_STRENGTH_RULES.length(formData.password) ? 'met' : 'unmet'}>
                <span className="criterion-icon">●</span>
                Au moins 8 caractères
              </li>
              <li className={PASSWORD_STRENGTH_RULES.uppercase(formData.password) ? 'met' : 'unmet'}>
                <span className="criterion-icon">●</span>
                Une lettre majuscule
              </li>
              <li className={PASSWORD_STRENGTH_RULES.lowercase(formData.password) ? 'met' : 'unmet'}>
                <span className="criterion-icon">●</span>
                Une lettre minuscule
              </li>
              <li className={PASSWORD_STRENGTH_RULES.number(formData.password) ? 'met' : 'unmet'}>
                <span className="criterion-icon">●</span>
                Un chiffre
              </li>
              <li className={PASSWORD_STRENGTH_RULES.special(formData.password) ? 'met' : 'unmet'}>
                <span className="criterion-icon">●</span>
                Un caractère spécial (!@#$%^&*...)
              </li>
            </ul>
          </div>
        )}

        <Input
          label="Confirmer le mot de passe"
          type="password"
          name="passwordConfirm"
          placeholder="Confirmez votre mot de passe"
          value={formData.passwordConfirm}
          onChange={handleChange}
          required
          error={
            formData.password &&
            formData.passwordConfirm &&
            formData.password !== formData.passwordConfirm
          }
          errorMessage={
            formData.password &&
            formData.passwordConfirm &&
            formData.password !== formData.passwordConfirm
              ? "Les mots de passe ne correspondent pas"
              : ""
          }
        />

        {formData.password &&
          formData.passwordConfirm &&
          formData.password === formData.passwordConfirm && (
            <div className="password-match-success">
              <span className="check-icon">✓</span>
              Les mots de passe correspondent
            </div>
          )}

        <Button
          variant="primary"
          size="medium"
          fullWidth
          disabled={loading || !formData.password || !formData.passwordConfirm}
          loading={loading}
          type="submit"
        >
          {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
        </Button>

        <div className="form-link">
          Vous vous souvenez de votre mot de passe ?{' '}
          <Link to="/login">Se connecter</Link>
        </div>
      </form>
    </FormContainer>
  );
}
