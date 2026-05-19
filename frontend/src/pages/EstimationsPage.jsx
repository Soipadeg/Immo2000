/**
 * Page des Estimations - Melo API
 * Estimer la valeur d'une propriété via l'API Melo
 */

import React, { useState } from 'react';
import { estimationsApi } from '../services/api';
import { Button, Alert, Input } from '@/components';
import '../styles/EstimationsPage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/EstimationsPage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/EstimationsPage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/EstimationsPage.css';





const EstimationsPage = () => {
  const [formData, setFormData] = useState({
    adresse: '',
    surface: '',
    type_bien: 'appartement',
    nombre_pieces: '',
    annee_construction: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estimation, setEstimation] = useState(null);
  const [comparisons, setComparisons] = useState([]);

  // États pour la comparaison
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResults, setCompareResults] = useState(null);
  const [compareFormData, setCompareFormData] = useState({
    adresse1: '',
    surface1: '',
    type_bien1: 'appartement',
    adresse2: '',
    surface2: '',
    type_bien2: 'appartement',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : (isNaN(value) ? value : Number(value)),
    }));
  };

  const handleEstimate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setEstimation(null);

    try {
      // Valider les champs requis
      if (!formData.adresse || !formData.surface || !formData.type_bien) {
        setError('Veuillez remplir tous les champs requis');
        setLoading(false);
        return;
      }

      const response = await estimationsApi.create(formData);
      setEstimation(response.data.estimation || response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'estimation');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareInputChange = (e) => {
    const { name, value } = e.target;
    setCompareFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : (isNaN(value) ? value : Number(value)),
    }));
  };

  const handleCompare = async () => {
    setCompareLoading(true);
    setError('');

    try {
      if (
        !compareFormData.adresse1 ||
        !compareFormData.surface1 ||
        !compareFormData.adresse2 ||
        !compareFormData.surface2
      ) {
        setError('Veuillez remplir tous les champs requis pour la comparaison');
        setCompareLoading(false);
        return;
      }

      const response = await estimationsApi.compare({
        adresse1: compareFormData.adresse1,
        surface1: parseFloat(compareFormData.surface1),
        type_bien1: compareFormData.type_bien1,
        adresse2: compareFormData.adresse2,
        surface2: parseFloat(compareFormData.surface2),
        type_bien2: compareFormData.type_bien2,
      });

      setCompareResults(response.data.comparison || response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la comparaison');
    } finally {
      setCompareLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div maxWidth="lg">
      <div>
        <h4 variant="h4" gutterBottom>
          💎 Estimation de Propriété - Melo API
        </h4>
        <p color="text.secondary">
          Estimez la valeur de votre bien immobilier basée sur les données du marché
        </h4>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div container spacing={3}>
        {/* Formulaire d'estimation */}
        <div item xs={12} md={6}>
          <div>
            <h6 variant="h6" gutterBottom>
              📋 Paramètres de la Propriété
            </h6>
            <hr />

            <div component="form" onSubmit={handleEstimate}>
              <div container spacing={2}>
                <div item xs={12}>
                  <Input
                    fullWidth
                    label="Adresse"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleInputChange}
                    placeholder="Ex: 123 Rue de Paris, 75001 Paris"
                    required
                  />
                </div>

                <div item xs={12} sm={6}>
                  <Input
                    fullWidth
                    label="Type de bien"
                    name="type_bien"
                    select
                    SelectProps={{ native: true }}
                    value={formData.type_bien}
                    onChange={handleInputChange}
                  >
                    <option value="appartement">Appartement</option>
                    <option value="maison">Maison</option>
                    <option value="terrain">Terrain</option>
                    <option value="commerce">Commerce</option>
                    <option value="bureau">Bureau</option>
                  </Input>
                </div>

                <div item xs={12} sm={6}>
                  <Input
                    fullWidth
                    label="Surface (m²)"
                    name="surface"
                    type="number"
                    value={formData.surface}
                    onChange={handleInputChange}
                    inputProps={{ min: 1, step: 0.1 }}
                    required
                  />
                </div>

                <div item xs={12} sm={6}>
                  <Input
                    fullWidth
                    label="Nombre de pièces"
                    name="nombre_pieces"
                    type="number"
                    value={formData.nombre_pieces}
                    onChange={handleInputChange}
                    inputProps={{ min: 0 }}
                  />
                </div>

                <div item xs={12} sm={6}>
                  <Input
                    fullWidth
                    label="Année de construction"
                    name="annee_construction"
                    type="number"
                    value={formData.annee_construction}
                    onChange={handleInputChange}
                    inputProps={{ min: 1800, max: new Date().getFullYear() }}
                  />
                </div>

                <div item xs={12}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    size="large"
                    startIcon={loading ? <div size={24} /> : <TrendingUpIcon />}
                  >
                    {loading ? 'Estimation en cours...' : 'Estimer la valeur'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Résultat d'estimation */}
        {estimation && (
          <div item xs={12} md={6}>
            <div
            >
              <h6 variant="h6" gutterBottom>
                📊 Résultat de l'Estimation
              </h6>
              <hr />

              <div>
                <p variant="body2">
                  Valeur Estimée
                </h6>
                <h4 variant="h4">
                  {formatPrice(estimation.prix_estime || estimation.valeur)}
                </h4>
              </div>

              {estimation.prix_min && estimation.prix_max && (
                <div>
                  <p variant="body2">
                    Fourchette de Prix
                  </h4>
                  <p variant="body1">
                    {formatPrice(estimation.prix_min)} à {formatPrice(estimation.prix_max)}
                  </h4>
                </div>
              )}

              <div container spacing={1}>
                <div item xs={6}>
                  <div>
                    <p variant="caption">
                      Surface
                    </h6>
                    <p variant="body2">
                      {formData.surface}m²
                    </h4>
                  </div>
                </div>
                <div item xs={6}>
                  <div>
                    <p variant="caption">
                      Prix par m²
                    </h6>
                    <p variant="body2">
                      {formatPrice((estimation.prix_estime || estimation.valeur) / formData.surface)}
                    </p>
                  </div>
                </div>
                <div item xs={6}>
                  <div>
                    <p variant="caption">
                      Type de Bien
                    </p>
                    <p variant="body2">
                      {formData.type_bien}
                    </p>
                  </div>
                </div>
                <div item xs={6}>
                  <div>
                    <p variant="caption">
                      Source
                    </p>
                    <p variant="body2">
                      {estimation.source || 'Melo API'}
                    </p>
                  </div>
                </div>
              </div>

              {estimation.details && (
                <div>
                  <p variant="caption">
                    📌 Détails supplémentaires
                  </p>
                  <p variant="body2">
                    {estimation.details}
                  </p>
                </div>
              )}

              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                startIcon={<CompareArrowsIcon />}
                onClick={() => setCompareDialogOpen(true)}
              >
                Comparer avec une autre propriété
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Informations supplémentaires */}
      {!estimation && (
        <div>
          <div>
            <h6 variant="h6" gutterBottom>
              ℹ️ À propos de l'Estimation
            </h6>
            <p variant="body2" color="text.secondary" paragraph>
              Notre outil utilise l'API Melo pour estimer la valeur de votre propriété en fonction
              des données du marché immobilier français. L'estimation est basée sur :
            </h6>
            <ul style={{ color: '#666', marginTop: '10px' }}>
              <li>La localisation de la propriété</li>
              <li>Les caractéristiques du bien (surface, type, nombre de pièces)</li>
              <li>Les données de marché récentes</li>
              <li>Les transactions comparables</li>
            </ul>
          </div>
        </div>
      )}

      {/* Dialog de Comparaison */}
      <div
        open={compareDialogOpen}
        onClose={() => setCompareDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <div>🔀 Comparer deux propriétés</div>
        <div>
          <div>
            <p variant="subtitle2">
              Propriété 1
            </h6>
            <Input
              fullWidth
              label="Adresse 1 *"
              name="adresse1"
              value={compareFormData.adresse1}
              onChange={handleCompareInputChange}
              required
            />
            <Input
              fullWidth
              label="Surface 1 (m²) *"
              name="surface1"
              type="number"
              value={compareFormData.surface1}
              onChange={handleCompareInputChange}
              inputProps={{ step: '0.01', min: '0' }}
              required
            />
            <Input
              fullWidth
              label="Type de bien 1"
              name="type_bien1"
              select
              SelectProps={{ native: true }}
              value={compareFormData.type_bien1}
              onChange={handleCompareInputChange}
            >
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="terrain">Terrain</option>
              <option value="local_commercial">Local commercial</option>
            </Input>

            <hr />

            <p variant="subtitle2">
              Propriété 2
            </h6>
            <Input
              fullWidth
              label="Adresse 2 *"
              name="adresse2"
              value={compareFormData.adresse2}
              onChange={handleCompareInputChange}
              required
            />
            <Input
              fullWidth
              label="Surface 2 (m²) *"
              name="surface2"
              type="number"
              value={compareFormData.surface2}
              onChange={handleCompareInputChange}
              inputProps={{ step: '0.01', min: '0' }}
              required
            />
            <Input
              fullWidth
              label="Type de bien 2"
              name="type_bien2"
              select
              SelectProps={{ native: true }}
              value={compareFormData.type_bien2}
              onChange={handleCompareInputChange}
            >
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="terrain">Terrain</option>
              <option value="local_commercial">Local commercial</option>
            </Input>
          </div>
        </div>
        <div>
          <Button onClick={() => setCompareDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleCompare}
            variant="contained"
            color="primary"
            disabled={compareLoading}
          >
            {compareLoading ? <div size={24} /> : 'Comparer'}
          </Button>
        </div>
      </div>

      {/* Résultats de Comparaison */}
      {compareResults && (
        <div>
          <div>
            <h6 variant="h6" gutterBottom>
              📊 Résultats de la Comparaison
            </h6>
            <hr />

            <div container spacing={3}>
              {/* Propriété 1 */}
              <div item xs={12} sm={6}>
                <div variant="outlined">
                  <div>
                    <p color="primary" variant="subtitle2">
                      {compareFormData.adresse1}
                    </h6>
                    <div>
                      <span label={`${compareFormData.surface1} m²`} size="small" />
                      <span
                        label={compareFormData.type_bien1}
                        size="small"
                        variant="outlined"
                      />
                    </div>
                    {compareResults.propriete1 && (
                      <>
                        <p variant="caption" color="text.secondary">
                          Valeur Estimée
                        </h6>
                        <h6 variant="h6">
                          {formatPrice(
                            compareResults.propriete1.prix_estime ||
                            compareResults.propriete1.valeur
                          )}
                        </h6>
                        <p variant="caption" color="text.secondary">
                          Prix par m²
                        </h6>
                        <p variant="body2">
                          {formatPrice(
                            (compareResults.propriete1.prix_estime ||
                              compareResults.propriete1.valeur) / compareFormData.surface1
                          )}
                        </h6>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Propriété 2 */}
              <div item xs={12} sm={6}>
                <div variant="outlined">
                  <div>
                    <p color="secondary" variant="subtitle2">
                      {compareFormData.adresse2}
                    </h6>
                    <div>
                      <span label={`${compareFormData.surface2} m²`} size="small" />
                      <span
                        label={compareFormData.type_bien2}
                        size="small"
                        variant="outlined"
                      />
                    </div>
                    {compareResults.propriete2 && (
                      <>
                        <p variant="caption" color="text.secondary">
                          Valeur Estimée
                        </p>
                        <h6 variant="h6">
                          {formatPrice(
                            compareResults.propriete2.prix_estime ||
                            compareResults.propriete2.valeur
                          )}
                        </h6>
                        <p variant="caption" color="text.secondary">
                          Prix par m²
                        </h6>
                        <p variant="body2">
                          {formatPrice(
                            (compareResults.propriete2.prix_estime ||
                              compareResults.propriete2.valeur) / compareFormData.surface2
                          )}
                        </h6>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {compareResults.difference && (
              <div>
                <p variant="subtitle2">
                  Différence
                </h6>
                <p variant="body2">
                  Écart de prix: {formatPrice(compareResults.difference)} (
                  {compareResults.pourcentage_difference?.toFixed(1)}%)
                </p>
              </div>
            )}

            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={() => {
                setCompareResults(null);
                setCompareDialogOpen(false);
              }}
            >
              Fermer la comparaison
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimationsPage;
