import React, { useState, useRef } from 'react';
import { Button, Alert, Input } from '@/components';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { register as apiRegister } from '../services/api';
import '../styles/RegisterPage.css';

const RegisterPage = () => {
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

    if (!formData.email || !formData.password || !formData.nom || !formData.prenom || !formData.telephone) {
      setError('Tous les champs sont requis');
      return;
    }

    if (!formData.acceptCGU) {
      setError('Vous devez accepter les Conditions Générales d\'Utilisation');
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

    const phoneRegex = /^[+]?[0-9\s\-()]{9,}$/;
    if (!phoneRegex.test(formData.telephone.replace(/\s/g, ''))) {
      setError('Numéro de téléphone invalide');
      return;
    }

    setLoading(true);

    try {
      setCaptchaLoading(true);
      const captchaToken = await recaptchaRef.current.executeAsync();
      setCaptchaLoading(false);

      if (!captchaToken) {
        setError('Erreur de vérification de sécurité. Veuillez réessayer.');
        setLoading(false);
        return;
      }

      await apiRegister({
        ...formData,
        captchaToken,
      });

      const searchParams = new URLSearchParams(location.search);
      const from = searchParams.get('from');
      const annonceId = searchParams.get('annonce_id');

      const nextPageUrl = from && annonceId
        ? `/inscription/etape2?from=${from}&annonce_id=${annonceId}`
        : '/inscription/etape2';

      navigate(nextPageUrl, {
        state: { message: 'Profil créé ! Complétez votre profil acheteur.' },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
      setCaptchaLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Créer un compte</h1>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-row">
            <Input
              label="Prénom"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              required
            />
            <Input
              label="Nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Téléphone"
            name="telephone"
            type="tel"
            value={formData.telephone}
            onChange={handleChange}
            placeholder="+33 6 12 34 56 78"
            required
          />

          <Input
            label="Mot de passe"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Input
            label="Confirmer le mot de passe"
            name="passwordConfirm"
            type="password"
            value={formData.passwordConfirm}
            onChange={handleChange}
            required
          />

          <div className="register-checkbox-container">
            <input
              type="checkbox"
              id="acceptCGU"
              name="acceptCGU"
              checked={formData.acceptCGU}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="acceptCGU" className="register-checkbox-label">
              J'accepte les <Link to="/cgu">Conditions Générales d'Utilisation</Link> et la <Link to="/politique-confidentialite">Politique de Confidentialité</Link>
            </label>
          </div>

          <div style={{ display: 'none' }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              size="invisible"
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
            />
          </div>

          <Button
            type="submit"
            isLoading={loading || captchaLoading}
            className="w-full"
          >
            {captchaLoading ? 'Vérification...' : loading ? 'Inscription...' : "S'inscrire"}
          </Button>

          <p className="register-footer">
            Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
