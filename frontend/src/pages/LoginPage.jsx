import React, { useState, useEffect, useRef } from 'react';
import { Button, Alert, Input } from '@/components';
import { useNavigate, useLocation } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { login as apiLogin } from '../services/api';
import '../styles/LoginPage.css';

const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPTS_KEY = 'login_attempts';
const LOCKOUT_TIME_KEY = 'lockout_time';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const recaptchaRef = useRef();
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const [formData, setFormData] = useState({
    email: localStorage.getItem('remembered_email') || '',
    password: '',
    rememberMe: localStorage.getItem('remembered_email') ? true : false,
  });

  // Vérifier le lockout au chargement
  useEffect(() => {
    checkLockoutStatus();
  }, []);

  // Timer pour le lockout
  useEffect(() => {
    if (!isLockedOut) return;

    const timer = setInterval(() => {
      const lockoutTime = parseInt(localStorage.getItem(LOCKOUT_TIME_KEY) || '0');
      const timeLeft = Math.max(0, lockoutTime - Date.now());

      if (timeLeft <= 0) {
        setIsLockedOut(false);
        localStorage.removeItem(LOCKOUT_TIME_KEY);
        localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
        clearInterval(timer);
      } else {
        setLockoutTimeLeft(Math.ceil(timeLeft / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLockedOut]);

  // Afficher le message de succès
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const checkLockoutStatus = () => {
    const lockoutTime = localStorage.getItem(LOCKOUT_TIME_KEY);
    if (lockoutTime && parseInt(lockoutTime) > Date.now()) {
      setIsLockedOut(true);
      const timeLeft = parseInt(lockoutTime) - Date.now();
      setLockoutTimeLeft(Math.ceil(timeLeft / 1000));
    }
  };

  const incrementLoginAttempts = () => {
    const attempts = parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0') + 1;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, attempts.toString());

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_DURATION;
      localStorage.setItem(LOCKOUT_TIME_KEY, lockoutTime.toString());
      setIsLockedOut(true);
      setLockoutTimeLeft(Math.ceil(LOCKOUT_DURATION / 1000));
      return true; // Locked out
    }
    return false;
  };

  const resetLoginAttempts = () => {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Vérifier le lockout
    if (isLockedOut) {
      setError(`Compte verrouillé. Réessayez dans ${lockoutTimeLeft}s`);
      return;
    }

    if (!formData.email || !formData.password) {
      setError('Email et mot de passe requis');
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

      const response = await apiLogin({
        email: formData.email,
        mot_de_passe: formData.password,
        captchaToken,
      });

      // Réinitialiser les tentatives
      resetLoginAttempts();

      // Stocker le token JWT et infos utilisateur
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user_id', response.user_id);
      localStorage.setItem('user_email', response.email);
      localStorage.setItem('user_role', response.role);
      localStorage.setItem('user_first_login', response.first_login ? 'true' : 'false');

      // Gestion "Se souvenir de moi"
      if (formData.rememberMe) {
        localStorage.setItem('remembered_email', formData.email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      // Vérifier si email est vérifié
      if (response.email_verified === false) {
        navigate('/verify-email', {
          state: { email: response.email, requiresVerification: true },
        });
      } else if (response.requires_2fa) {
        // Rediriger vers 2FA si nécessaire
        navigate('/verify-2fa', {
          state: { user_id: response.user_id, email: response.email },
        });
      } else {
        // Redirection normale
        navigate('/');
      }
    } catch (err) {
      const isLocked = incrementLoginAttempts();

      if (isLocked) {
        setError(`Trop de tentatives. Compte verrouillé pendant 15 minutes.`);
      } else {
        const attempts = parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0');
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts;

        let errorMsg = err.response?.data?.error || 'Email ou mot de passe incorrect';
        if (remainingAttempts > 0 && remainingAttempts < 3) {
          errorMsg += ` (${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''})`;
        }
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Se connecter</h1>

        {successMessage && (
          <Alert type="success" title="Succès" message={successMessage} />
        )}

        {error && <Alert type="error" title="Erreur" message={error} />}

        {isLockedOut && (
          <Alert type="warning" title="🔒 Compte verrouillé" message={`Votre compte est temporairement verrouillé pour des raisons de sécurité. Réessayez dans ${lockoutTimeLeft}s`} />
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLockedOut}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLockedOut}
              autoComplete="current-password"
            />
          </div>

          <div className="remember-me">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isLockedOut}
            />
            <label htmlFor="rememberMe">Se souvenir de moi</label>
          </div>

          <a href="/forgot-password" className="forgot-password">
            Mot de passe oublié ?
          </a>

          {/* ReCAPTCHA v3 (invisible) */}
          <div className="recaptcha-container">
            <ReCAPTCHA
              ref={recaptchaRef}
              size="invisible"
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
            />
          </div>

          <Button
            fullWidth
            variant="primary"
            size="large"
            disabled={loading || isLockedOut || captchaLoading}
            type="submit"
            className="submit-btn"
          >
            {captchaLoading ? 'Vérification de sécurité...' : loading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>

          <div className="divider"></div>

          <p className="signup-link">
            Pas de compte ? <a href="/register">S'inscrire</a>
          </p>
        </form>

        {/* Infos de sécurité */}
        <div className="security-info">
          <h4>🔐 Sécurité</h4>
          <ul>
            <li>✓ Chiffrement TLS/SSL pour toutes les connexions</li>
            <li>✓ Verrouillage de compte après {MAX_LOGIN_ATTEMPTS} tentatives échouées</li>
            <li>✓ Vérification email obligatoire</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
