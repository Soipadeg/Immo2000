import './ForgotPasswordPage.css';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Alert, FormContainer } from '@/components';
import { authApi } from '../services/api';

/**
 * ForgotPasswordPage
 * Two-step password reset: email verification and code validation
 */
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
    <FormContainer
      title="Réinitialiser votre mot de passe"
      subtitle="Retrouvez l'accès à votre compte en quelques étapes"
      maxWidth="small"
    >
      {/* Progress indicator */}
      <div className="forgot-password-steps">
        <div className={`step ${step >= 0 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Email</div>
        </div>
        <div className="step-divider"></div>
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Code</div>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Step 0: Email verification */}
      {step === 0 && (
        <form onSubmit={handleRequestReset} className="forgot-password-form">
          <div className="form-description">
            Entrez votre adresse email pour recevoir un code de réinitialisation.
          </div>

          <Input
            label="Adresse email"
            type="email"
            name="email"
            placeholder="vous@exemple.com"
            value={formData.email}
            onChange={handleChange}
            required
            hint="Nous enverrons un code de confirmation à cette adresse"
          />

          <Button
            variant="primary"
            size="medium"
            fullWidth
            disabled={loading}
            loading={loading}
            type="submit"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le code'}
          </Button>

          <div className="form-link">
            Vous vous souvenez de votre mot de passe ?{' '}
            <Link to="/login">Se connecter</Link>
          </div>
        </form>
      )}

      {/* Step 1: Code verification */}
      {step === 1 && (
        <form onSubmit={handleVerifyCode} className="forgot-password-form">
          <div className="form-description">
            Un code de réinitialisation a été envoyé à<br />
            <strong>{sentEmail}</strong>
          </div>

          <Input
            label="Code de réinitialisation"
            name="resetCode"
            placeholder="Ex: 123456"
            value={formData.resetCode}
            onChange={handleChange}
            required
            hint="Le code expire dans 30 minutes"
          />

          <Button
            variant="primary"
            size="medium"
            fullWidth
            disabled={loading}
            loading={loading}
            type="submit"
          >
            {loading ? 'Vérification...' : 'Vérifier le code'}
          </Button>

          <Button
            variant="ghost"
            size="medium"
            fullWidth
            disabled={loading}
            onClick={() => {
              setStep(0);
              setFormData({ email: '', resetCode: '' });
              setError('');
            }}
          >
            Utiliser une autre adresse email
          </Button>

          <div className="form-link">
            Pas encore reçu le code ?{' '}
            <button
              type="button"
              className="resend-link"
              onClick={handleRequestReset}
              disabled={loading}
            >
              Renvoyer
            </button>
          </div>
        </form>
      )}
    </FormContainer>
  );
}
