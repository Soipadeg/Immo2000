import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { Button, Input, Alert, FormContainer } from '@/components';
import { authApi } from '../services/api';
import './VerifyEmailPage.css';

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
      <FormContainer
        title="Vérification en cours..."
        subtitle="Veuillez patienter"
        maxWidth="small"
      >
        <div className="verifying-loader">
          <div className="spinner"></div>
          <p>Vérification de votre email...</p>
        </div>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title="Vérifier votre email"
      subtitle={requiresVerification ? `Confirmez ${email}` : 'Vérifiez votre adresse email'}
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

      {requiresVerification ? (
        <div className="verify-email-form">
          <p className="form-description">
            Un email de vérification a été envoyé à <strong>{email}</strong>.<br />
            Entrez le code ou cliquez sur le lien dans l'email.
          </p>

          <form onSubmit={handleVerify}>
            <Input
              label="Code de vérification"
              name="verificationCode"
              placeholder="Ex: abc123def456"
              value={formData.verificationCode}
              onChange={handleChange}
              required
              hint="Le code expire dans 24 heures"
            />

            <Button
              variant="primary"
              size="medium"
              fullWidth
              disabled={loading}
              loading={loading}
              type="submit"
            >
              {loading ? 'Vérification...' : 'Vérifier mon email'}
            </Button>
          </form>

          <div className="resend-section">
            <p className="resend-text">Vous n'avez pas reçu le code ?</p>
            <Button
              variant="ghost"
              size="medium"
              fullWidth
              disabled={resendLoading || resendCountdown > 0}
              onClick={handleResendEmail}
            >
              {resendCountdown > 0
                ? `Renvoyer dans ${resendCountdown}s`
                : 'Renvoyer le code'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="verify-email-form">
          <p className="form-description">
            Un lien de vérification a été envoyé à <strong>{email}</strong>.<br />
            Cliquez sur le lien dans l'email pour continuer.
          </p>

          <Button
            variant="primary"
            size="medium"
            fullWidth
            onClick={() => window.location.href = 'mailto:'}
          >
            Ouvrir mon email
          </Button>

          <Button
            variant="secondary"
            size="medium"
            fullWidth
            disabled={resendCountdown > 0}
            onClick={handleResendEmail}
          >
            {resendCountdown > 0
              ? `Renvoyer dans ${resendCountdown}s`
              : 'Renvoyer l\'email'}
          </Button>

          <div className="form-link">
            <Link to="/login">Retour à la connexion</Link>
          </div>
        </div>
      )}

      <div className="verify-email-info">
        <strong>Pourquoi vérifier l'email ?</strong>
        <p>
          Cela protège votre compte et nous permet de vous envoyer des notifications
          importantes.
        </p>
      </div>
    </FormContainer>
  );
}
