import '../styles/EstimationPage.css';
import React, { useState, useEffect } from 'react';
import { Button, Alert, Card, Input } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { estimationsApi } from '../services/api/estimations';

const EstimationPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [activeTab, setActiveTab] = useState(0); // 0: Single, 1: Compare
  const [formData, setFormData] = useState({
    adresse: '',
    surface: '',
    type_bien: 'appartement'
  });

  // Compare multiple properties
  const [compareBiens, setCompareBiens] = useState([
    { adresse: '', surface: '', type_bien: 'appartement' },
    { adresse: '', surface: '', type_bien: 'appartement' }
  ]);

  // Results state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [estimation, setEstimation] = useState(null);
  const [comparison, setComparison] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const propertyTypes = [
    { value: 'appartement', label: '🏢 Appartement' },
    { value: 'maison', label: '🏠 Maison' },
    { value: 'terrain', label: '📍 Terrain' },
    { value: 'commercial', label: '🏬 Commercial' }
  ];

  // Handle single estimation form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle compare form
  const handleCompareBienChange = (index, field, value) => {
    const newBiens = [...compareBiens];
    newBiens[index][field] = value;
    setCompareBiens(newBiens);
  };

  // Add another property for comparison
  const addCompareBien = () => {
    setCompareBiens(prev => [
      ...prev,
      { adresse: '', surface: '', type_bien: 'appartement' }
    ]);
  };

  // Remove property from comparison
  const removeCompareBien = (index) => {
    setCompareBiens(prev => prev.filter((_, i) => i !== index));
  };

  // Submit single estimation
  const handleSubmitEstimation = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.adresse.trim() || !formData.surface || !formData.type_bien) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      const result = await estimationsApi.create({
        adresse: formData.adresse,
        surface: parseInt(formData.surface),
        type_bien: formData.type_bien
      });

      setEstimation(result);
      setSuccess('Estimation créée avec succès !');
      setFormData({ adresse: '', surface: '', type_bien: 'appartement' });
    } catch (err) {
      console.error('Error creating estimation:', err);
      setError(err.response?.data?.error || 'Erreur lors de la création de l\'estimation');
    } finally {
      setLoading(false);
    }
  };

  // Submit comparison
  const handleSubmitComparison = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate
    const validBiens = compareBiens.filter(bien => bien.adresse.trim() && bien.surface && bien.type_bien);
    if (validBiens.length < 2) {
      setError('Veuillez remplir au moins 2 propriétés pour la comparaison');
      return;
    }

    try {
      setLoading(true);
      const result = await estimationsApi.compare(
        validBiens.map(bien => ({
          adresse: bien.adresse,
          surface: parseInt(bien.surface),
          type_bien: bien.type_bien
        }))
      );

      setComparison(result);
      setSuccess('Comparaison créée avec succès !');
    } catch (err) {
      console.error('Error comparing estimations:', err);
      setError(err.response?.data?.error || 'Erreur lors de la comparaison');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="estimation-page-container">
        <div className="loading-page">
          <div className="spinner"></div>
          <p>⏳ Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="estimation-page-container">
      {/* Page Header Banner */}
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">💰</span>
            <h1>Estimations Immobilières</h1>
          </div>
          <p>Obtenez une estimation précise de vos biens immobiliers grâce à l'API Melo</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          style={{ marginBottom: '1.5rem' }}
        />
      )}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* Tabs Navigation */}
      <div className="estimation-tabs">
        <button
          className={`estimation-tab-button ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => setActiveTab(0)}
        >
          📊 Estimation Simple
        </button>
        <button
          className={`estimation-tab-button ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => setActiveTab(1)}
        >
          🔄 Comparaison
        </button>
      </div>

      {/* Content */}
      <div className="estimation-content">
        {/* Tab 0: Single Estimation */}
        {activeTab === 0 && (
          <Card className="estimation-form-card">
            <div className="estimation-form-header">
              <h2>Estimer un bien immobilier</h2>
              <p>Remplissez les informations de votre bien pour obtenir une estimation basée sur le marché</p>
            </div>

            <form onSubmit={handleSubmitEstimation} className="estimation-form">
              <div className="form-group">
                <label htmlFor="adresse">Adresse complète *</label>
                <input
                  type="text"
                  id="adresse"
                  name="adresse"
                  placeholder="ex: 123 Rue de Paris, 75001 Paris"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="surface">Surface (m²) *</label>
                  <input
                    type="number"
                    id="surface"
                    name="surface"
                    placeholder="ex: 85"
                    value={formData.surface}
                    onChange={handleInputChange}
                    min="1"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type_bien">Type de bien *</label>
                  <select
                    id="type_bien"
                    name="type_bien"
                    value={formData.type_bien}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    {propertyTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="medium"
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {loading ? '⏳ Chargement...' : '💰 Obtenir l\'estimation'}
              </Button>
            </form>

            {/* Estimation Result */}
            {estimation && (
              <div className="estimation-result">
                <h3>📊 Résultat de l'estimation</h3>
                <div className="result-content">
                  <div className="result-item">
                    <span className="result-label">Adresse</span>
                    <span className="result-value">{estimation.adresse}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Type</span>
                    <span className="result-value">{formData.type_bien}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Surface</span>
                    <span className="result-value">{formData.surface} m²</span>
                  </div>
                  {estimation.estimation && (
                    <>
                      <div className="result-item highlight">
                        <span className="result-label">Estimation</span>
                        <span className="result-value">
                          {estimation.estimation.prix_min ?
                            `${(estimation.estimation.prix_min / 1000).toFixed(0)}k - ${(estimation.estimation.prix_max / 1000).toFixed(0)}k€` :
                            estimation.estimation.prix ? `${(estimation.estimation.prix / 1000).toFixed(0)}k€` : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Prix au m²</span>
                        <span className="result-value">
                          {estimation.estimation.prix_au_m2 ?
                            `${estimation.estimation.prix_au_m2.toFixed(0)}€/m²` : 'N/A'
                          }
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Tab 1: Comparison */}
        {activeTab === 1 && (
          <Card className="estimation-form-card">
            <div className="estimation-form-header">
              <h2>Comparer plusieurs biens</h2>
              <p>Comparez les estimations de plusieurs propriétés pour mieux comprendre le marché</p>
            </div>

            <form onSubmit={handleSubmitComparison} className="estimation-form">
              <div className="compare-properties">
                {compareBiens.map((bien, index) => (
                  <div key={index} className="compare-property-card">
                    <div className="compare-property-header">
                      <h4>Propriété {index + 1}</h4>
                      {compareBiens.length > 2 && (
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => removeCompareBien(index)}
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor={`adresse-${index}`}>Adresse</label>
                      <input
                        type="text"
                        id={`adresse-${index}`}
                        placeholder="ex: 123 Rue de Paris, 75001 Paris"
                        value={bien.adresse}
                        onChange={(e) => handleCompareBienChange(index, 'adresse', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`surface-${index}`}>Surface (m²)</label>
                        <input
                          type="number"
                          id={`surface-${index}`}
                          placeholder="ex: 85"
                          value={bien.surface}
                          onChange={(e) => handleCompareBienChange(index, 'surface', e.target.value)}
                          min="1"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`type-${index}`}>Type de bien</label>
                        <select
                          id={`type-${index}`}
                          value={bien.type_bien}
                          onChange={(e) => handleCompareBienChange(index, 'type_bien', e.target.value)}
                          className="form-select"
                        >
                          {propertyTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={addCompareBien}
                style={{ marginBottom: '1rem' }}
              >
                ➕ Ajouter une propriété
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="medium"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? '⏳ Chargement...' : '🔄 Comparer les estimations'}
              </Button>
            </form>

            {/* Comparison Result */}
            {comparison && (
              <div className="estimation-result">
                <h3>📊 Résultat de la comparaison</h3>
                <div className="comparison-content">
                  {comparison.comparison && (
                    <div className="comparison-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Propriété</th>
                            <th>Estimation</th>
                            <th>Prix/m²</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparison.comparison.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.adresse || `Propriété ${idx + 1}`}</td>
                              <td>
                                {item.prix_min ?
                                  `${(item.prix_min / 1000).toFixed(0)}k - ${(item.prix_max / 1000).toFixed(0)}k€` :
                                  item.prix ? `${(item.prix / 1000).toFixed(0)}k€` : 'N/A'
                                }
                              </td>
                              <td>{item.prix_au_m2 ? `${item.prix_au_m2.toFixed(0)}€/m²` : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Info Box */}
      <Card className="info-box">
        <h4>ℹ️ À propos des estimations</h4>
        <ul>
          <li>Les estimations sont basées sur les données de marché de l'API Melo</li>
          <li>Ces estimations sont à titre informatif et peuvent varier selon les détails spécifiques du bien</li>
          <li>Pour une estimation précise, consultez un professionnel de l'immobilier</li>
          <li>Les prix affichés sont pour le contexte français</li>
        </ul>
      </Card>
    </div>
  );
};

export default EstimationPage;
