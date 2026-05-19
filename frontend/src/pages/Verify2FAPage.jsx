import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button, Input, Alert, FormContainer } from '@/components';
import { authApi } from '../services/api';
import './Verify2FAPage.css';
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
      <FormContainer
        title="Accès refusé"
        subtitle="Authentification requise"
        maxWidth="small"
      >
        <Alert
          isOpen={true}
          type="error"
          title="Erreur"
          message="Accès non autorisé. Veuillez vous connecter."
          dismissible={false}
        />
        <Button
          variant="primary"
          size="medium"
          fullWidth
          onClick={() => window.location.href = '/login'}
          style={{ marginTop: '16px' }}
        >
          Retourner à la connexion
        </Button>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title="🔐 Authentification 2FA"
      subtitle={`Vérification pour ${email}`}
      maxWidth="small"
    >
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

      <form onSubmit={handleSubmit} className="verify-2fa-form">
        <p className="form-description">
          Pour sécuriser votre compte, entrez le code envoyé à <strong>{email}</strong>.
        </p>

        <Input
          label="Code à 6 chiffres"
          name="code"
          type="text"
          value={formData.code}
          onChange={handleChange}
          placeholder="000000"
          inputMode="numeric"
          maxLength={6}
          required
          hint="Cherchez le code dans votre email ou application d'authentification"
        />

        <Button
          variant="primary"
          size="medium"
          fullWidth
          disabled={loading || formData.code.length !== 6}
          loading={loading}
          type="submit"
        >
          {loading ? 'Vérification...' : 'Vérifier le code'}
        </Button>
      </form>

      <div className="resend-section">
        <p className="resend-text">Vous n'avez pas reçu le code ?</p>
        <Button
          variant="ghost"
          size="medium"
          fullWidth
          disabled={resendCountdown > 0}
          onClick={handleResendCode}
        >
          {resendCountdown > 0
            ? `Renvoyer dans ${resendCountdown}s`
            : 'Renvoyer le code'}
        </Button>
      </div>

      <div className="security-tip">
        <strong>💡 Conseil de sécurité</strong>
        <p>
          L'authentification à 2 facteurs protège votre compte contre l'accès non
          autorisé. Gardez votre téléphone et votre email sécurisés.
        </p>
      </div>

      <div className="form-link">
        <Link to="/login">Utiliser un autre compte</Link>
      </div>
    </FormContainer>
  );
}
  );
}
