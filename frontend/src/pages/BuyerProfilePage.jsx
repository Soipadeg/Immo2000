import React, { useState, useEffect } from 'react';
import { Button, Alert, Input } from '@/components';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateBuyerProfile } from '../services/api';
import '../styles/BuyerProfilePage.css';

export default function BuyerProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || ''
  );

  const [formData, setFormData] = useState({
    type_bien_recherche: 'appartement',
    nombre_pieces_min: 2,
    surface_min: 50,
    budget_max: 300000,
    ville_recherchee: '',
    dpe_ideale: 'C',
  });

  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('from');
  const annonceId = searchParams.get('annonce_id');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : (
        ['nombre_pieces_min', 'surface_min', 'budget_max'].includes(name)
          ? Number(value)
          : value
      ),
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.type_bien_recherche || !formData.budget_max) {
      setError('Type de bien et budget maximum sont requis');
      return;
    }

    if (formData.budget_max < 0) {
      setError('Le budget ne peut pas être négatif');
      return;
    }

    setLoading(true);

    try {
      await updateBuyerProfile(formData);
      setSuccessMessage('Profil acheteur mis à jour avec succès !');

      if (from === 'annonce' && annonceId) {
        navigate(`/contacter-vendeur?annonce_id=${annonceId}`);
      } else if (from === 'simulateur') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Erreur lors de la mise à jour du profil'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="buyer-profile-page-container">
      <div className="buyer-profile-content">
        <h1 className="page-title">Complétez votre profil acheteur</h1>
        <p className="page-subtitle">
          Étape 2 sur 2 : Ces informations nous aideront à vous proposer les meilleures annonces.
        </p>

        {error && <Alert type="error" title="Erreur" message={error} />}
        {successMessage && <Alert type="success" title="Succès" message={successMessage} />}

        <form onSubmit={handleSubmit} className="buyer-profile-form">
          {/* Type de bien */}
          <div className="form-group">
            <label className="form-label">Type de bien recherché *</label>
            <select
              name="type_bien_recherche"
              value={formData.type_bien_recherche}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="terrain">Terrain</option>
              <option value="local commercial">Local commercial</option>
            </select>
            <p className="form-help">Quel type de bien vous intéresse ?</p>
          </div>

          {/* Pièces et Surface */}
          <div className="form-row">
            <div className="form-group">
              <Input
                type="number"
                label="Nombre de pièces minimum"
                name="nombre_pieces_min"
                value={formData.nombre_pieces_min}
                onChange={handleChange}
                inputProps={{ min: 1, max: 20 }}
                required
              />
            </div>
            <div className="form-group">
              <Input
                type="number"
                label="Surface minimum (m²)"
                name="surface_min"
                value={formData.surface_min}
                onChange={handleChange}
                inputProps={{ min: 1, max: 10000 }}
                required
              />
            </div>
          </div>

          {/* Budget */}
          <div className="form-group">
            <Input
              type="number"
              label="Budget maximum (€)"
              name="budget_max"
              value={formData.budget_max}
              onChange={handleChange}
              inputProps={{ min: 0, step: 10000 }}
              required
            />
            <p className="form-help">Montant maximum que vous êtes prêt à investir</p>
          </div>

          {/* Ville */}
          <div className="form-group">
            <Input
              type="text"
              label="Ville recherchée (optionnel)"
              name="ville_recherchee"
              value={formData.ville_recherchee}
              onChange={handleChange}
              placeholder="Ex: Paris, Lyon, Marseille"
            />
            <p className="form-help">Vous pouvez en laisser vide ou en spécifier plusieurs plus tard</p>
          </div>

          {/* DPE */}
          <div className="form-group">
            <label className="form-label">Performance énergétique (optionnel)</label>
            <select
              name="dpe_ideale"
              value={formData.dpe_ideale}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Indifférent</option>
              <option value="A">A - Très performant</option>
              <option value="B">B - Performant</option>
              <option value="C">C - Moyen (standard)</option>
              <option value="D">D - Passable</option>
              <option value="E">E - Mauvais</option>
              <option value="F">F - Très mauvais</option>
              <option value="G">G - À rénover</option>
            </select>
            <p className="form-help">Classe énergétique minimale souhaitée</p>
          </div>

          {/* Boutons */}
          <div className="form-actions">
            <Button
              variant="secondary"
              size="medium"
              onClick={() => navigate(-1)}
            >
              ← Retour
            </Button>
            <Button
              variant="primary"
              size="medium"
              disabled={loading}
              type="submit"
            >
              {loading ? '⏳ Mise à jour...' : '✓ Terminer l\'inscription'}
            </Button>
          </div>

          {/* Lien */}
          <div className="form-info">
            <p>
              Vous pouvez modifier votre profil à tout moment depuis votre{' '}
              <a href="/dashboard" className="link">dashboard</a>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
