import '../styles/EstimationsPage.css';
import { Alert,Button,Input } from '@/components';
/**
 * Page des Estimations - Melo API
 * Estimer la valeur d'une propriété via l'API Melo
 */

import React, { useState } from 'react';
import { estimationsApi } from '../services/api';





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
        <div>
          💎 Estimation de Propriété - Melo API
        </div>
        <div>
          Estimez la valeur de votre bien immobilier basée sur les données du marché
        </div>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div container spacing={3}>
        {/* Formulaire d'estimation */}
        <div item xs={12} md={6}>
          <div>
            <div>
              📋 Paramètres de la Propriété
            </div>
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
              <div>
                📊 Résultat de l'Estimation
              </div>
              <hr />

              <div>
                <div>
                  Valeur Estimée
                </div>
                <div>
                  {formatPrice(estimation.prix_estime || estimation.valeur)}
                </div>
              </div>

              {estimation.prix_min && estimation.prix_max && (
                <div>
                  <div>
                    Fourchette de Prix
                  </div>
                  <div>
                    {formatPrice(estimation.prix_min)} à {formatPrice(estimation.prix_max)}
                  </div>
                </div>
              )}

              <div container spacing={1}>
                <div item xs={6}>
                  <div>
                    <div>
                      Surface
                    </div>
                    <div>
                      {formData.surface}m²
                    </div>
                  </div>
                </div>
                <div item xs={6}>
                  <div>
                    <div>
                      Prix par m²
                    </div>
                    <div>
                      {formatPrice((estimation.prix_estime || estimation.valeur) / formData.surface)}
                    </div>
                  </div>
                </div>
                <div item xs={6}>
                  <div>
                    <div>
                      Type de Bien
                    </div>
                    <div>
                      {formData.type_bien}
                    </div>
                  </div>
                </div>
                <div item xs={6}>
                  <div>
                    <div>
                      Source
                    </div>
                    <div>
                      {estimation.source || 'Melo API'}
                    </div>
                  </div>
                </div>
              </div>

              {estimation.details && (
                <div>
                  <div>
                    📌 Détails supplémentaires
                  </div>
                  <div>
                    {estimation.details}
                  </div>
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
            <div>
              ℹ️ À propos de l'Estimation
            </div>
            <div>
              Notre outil utilise l'API Melo pour estimer la valeur de votre propriété en fonction
              des données du marché immobilier français. L'estimation est basée sur :
            </div>
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
            <div>
              Propriété 1
            </div>
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

            <div>
              Propriété 2
            </div>
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
            <div>
              📊 Résultats de la Comparaison
            </div>
            <hr />

            <div container spacing={3}>
              {/* Propriété 1 */}
              <div item xs={12} sm={6}>
                <div variant="outlined">
                  <div>
                    <div>
                      {compareFormData.adresse1}
                    </div>
                    <div>
                      <div label={`${compareFormData.surface1} m²`} size="small" />
                      <div
                        label={compareFormData.type_bien1}
                        size="small"
                        variant="outlined"
                      />
                    </div>
                    {compareResults.propriete1 && (
                      <>
                        <div>
                          Valeur Estimée
                        </div>
                        <div>
                          {formatPrice(
                            compareResults.propriete1.prix_estime ||
                            compareResults.propriete1.valeur
                          )}
                        </div>
                        <div>
                          Prix par m²
                        </div>
                        <div>
                          {formatPrice(
                            (compareResults.propriete1.prix_estime ||
                              compareResults.propriete1.valeur) / compareFormData.surface1
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Propriété 2 */}
              <div item xs={12} sm={6}>
                <div variant="outlined">
                  <div>
                    <div>
                      {compareFormData.adresse2}
                    </div>
                    <div>
                      <div label={`${compareFormData.surface2} m²`} size="small" />
                      <div
                        label={compareFormData.type_bien2}
                        size="small"
                        variant="outlined"
                      />
                    </div>
                    {compareResults.propriete2 && (
                      <>
                        <div>
                          Valeur Estimée
                        </div>
                        <div>
                          {formatPrice(
                            compareResults.propriete2.prix_estime ||
                            compareResults.propriete2.valeur
                          )}
                        </div>
                        <div>
                          Prix par m²
                        </div>
                        <div>
                          {formatPrice(
                            (compareResults.propriete2.prix_estime ||
                              compareResults.propriete2.valeur) / compareFormData.surface2
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {compareResults.difference && (
              <div>
                <div>
                  Différence
                </div>
                <div>
                  Écart de prix: {formatPrice(compareResults.difference)} (
                  {compareResults.pourcentage_difference?.toFixed(1)}%)
                </div>
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
