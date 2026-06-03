import '../styles/CreerAnnonceEtape2.css';
import React, { useState } from 'react';
import { Button, Alert, Input } from '@/components';
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ paddingY: '32px' }}>
        {/* Titre */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            👤 Créer un compte
          </h1>
          <p style={{ color: '#999', marginBottom: '16px' }}>
            Étape 2 sur 4 : Création de compte
          </p>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#ddd', marginTop: '16px', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: '50%', backgroundColor: '#1976d2', transition: 'width 0.3s' }}></div>
          </div>
        </div>

        {/* Erreurs */}
        {error && <Alert severity="error" style={{ marginBottom: '24px' }}>{error}</Alert>}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Email */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vous@exemple.com"
                required
              />
            </div>

            {/* Mot de passe */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                fullWidth
                label="Mot de passe"
                name="mot_de_passe"
                type="password"
                value={formData.mot_de_passe}
                onChange={handleChange}
                placeholder="Min 8 caractères"
                required
              />
              {/* Indicateur force */}
              {formData.mot_de_passe && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>Force: {passwordStrength}%</div>
                  <div style={{ height: '6px', backgroundColor: '#ddd', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${passwordStrength}%`,
                        backgroundColor: passwordStrength < 50 ? '#d32f2f' : passwordStrength < 75 ? '#ff9800' : '#4caf50',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirmer mot de passe */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                fullWidth
                label="Confirmer le mot de passe"
                name="mot_de_passe_confirm"
                type="password"
                value={formData.mot_de_passe_confirm}
                onChange={handleChange}
                placeholder="Répéter votre mot de passe"
                required
              />
            </div>

            {/* Nom et Prénom */}
            <div>
              <Input
                fullWidth
                label="Nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Dupont"
                required
              />
            </div>

            <div>
              <Input
                fullWidth
                label="Prénom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Jean"
                required
              />
            </div>

            {/* Téléphone */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                fullWidth
                label="Téléphone"
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="+33612345678"
                required
              />
            </div>

            {/* CGU */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', gap: '8px' }}>
                <input
                  type="checkbox"
                  name="acceptCGU"
                  checked={formData.acceptCGU}
                  onChange={handleChange}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
                />
                <span>
                  J'accepte les <strong>Conditions Générales d'Utilisation</strong> et la <strong>Politique de Confidentialité</strong>
                </span>
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: '12px 24px',
                border: '1px solid #1976d2',
                backgroundColor: '#fff',
                color: '#1976d2',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              {loading ? 'Inscription en cours...' : 'Créer un compte'}
            </button>
          </div>
        </form>

        {/* Info */}
        <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
          <span style={{ color: '#0d47a1' }}>
            💡 <strong>Conseil :</strong> Vous pouvez abandonner à tout moment. Votre brouillon sera sauvegardé
            et vous pourrez le continuer plus tard depuis votre dashboard.
          </span>
        </div>
      </div>
    </div>
  );
}
