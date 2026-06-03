import '../styles/PublicAnnonceListPage.css';
import React, { useState, useEffect } from 'react';
import { Button, Alert, Input } from '@/components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAnnonces } from '../services/api';

/**
 * Page publique pour lister les annonces immobilières
 * Accessible sans connexion
 * Les visiteurs peuvent filtrer les annonces et cliquer pour contacter un vendeur
 */
export default function PublicAnnonceListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  // État des filtres
  const [filters, setFilters] = useState({
    ville: searchParams.get('ville') || '',
    type_bien: searchParams.get('type_bien') || '',
    prix_min: searchParams.get('prix_min') || '',
    prix_max: searchParams.get('prix_max') || '',
    surface_min: searchParams.get('surface_min') || '',
    skip: 0,
    limit: 20,
  });

  // Récupérer les annonces au chargement ou au changement de filtres
  useEffect(() => {
    fetchAnnonces();
  }, [filters]);

  const fetchAnnonces = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAnnonces(filters);
      setAnnonces(response.items || response);
      setTotal(response.total || response.length);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Erreur lors du chargement des annonces'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value,
      skip: 0, // Réinitialiser la pagination
    };
    setFilters(newFilters);

    // Mettre à jour les URL params
    const params = new URLSearchParams();
    if (newFilters.ville) params.set('ville', newFilters.ville);
    if (newFilters.type_bien) params.set('type_bien', newFilters.type_bien);
    if (newFilters.prix_min) params.set('prix_min', newFilters.prix_min);
    if (newFilters.prix_max) params.set('prix_max', newFilters.prix_max);
    if (newFilters.surface_min) params.set('surface_min', newFilters.surface_min);
    setSearchParams(params);
  };

  const handleContactClick = (annonceId) => {
    // Rediriger vers l'inscription si pas connecté
    navigate(`/inscription?from=annonce&annonce_id=${annonceId}`);
  };

  const handleResetFilters = () => {
    setFilters({
      ville: '',
      type_bien: '',
      prix_min: '',
      prix_max: '',
      surface_min: '',
      skip: 0,
      limit: 20,
    });
    setSearchParams('');
  };

  return (
    <div maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <div sx={{ mb: 4 }}>
        <div>
          Annonces Immobilières
        </div>
        <div>
          Découvrez nos propriétés disponibles. Connectez-vous pour contacter les propriétaires.
        </div>
      </div>

      {/* Filtres */}
      <div elevation={2} sx={{ p: 3, mb: 4, backgroundColor: '#f5f5f5' }}>
        <div>
          Filtres de recherche
        </div>
        <div container spacing={2}>
          <div item xs={12} sm={6} md={3}>
            <Input
              fullWidth
              label="Ville"
              name="ville"
              value={filters.ville}
              onChange={handleFilterChange}
              placeholder="Ex: Paris"
            />
          </div>

          <div item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type de bien</InputLabel>
              <select
                name="type_bien"
                value={filters.type_bien}
                onChange={handleFilterChange}
                label="Type de bien"
              >
                <option value="">Tous les types</option>
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="terrain">Terrain</option>
                <option value="local commercial">Local commercial</option>
              </select>
            </FormControl>
          </div>

          <div item xs={12} sm={6} md={3}>
            <Input
              fullWidth
              label="Prix min (€)"
              name="prix_min"
              type="number"
              value={filters.prix_min}
              onChange={handleFilterChange}
              inputProps={{ step: 10000 }}
            />
          </div>

          <div item xs={12} sm={6} md={3}>
            <Input
              fullWidth
              label="Prix max (€)"
              name="prix_max"
              type="number"
              value={filters.prix_max}
              onChange={handleFilterChange}
              inputProps={{ step: 10000 }}
            />
          </div>

          <div item xs={12}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleResetFilters}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Résultats */}
      <div sx={{ mb: 2 }}>
        <div>
          {loading ? '' : `${annonces.length} / ${total} annonces trouvées`}
        </div>
      </div>

      {/* Chargement */}
      {loading && (
        <div sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </div>
      )}

      {/* Grille d'annonces */}
      {!loading && annonces.length > 0 && (
        <div container spacing={3}>
          {annonces.map((annonce) => (
            <div item xs={12} sm={6} md={4} key={annonce.annonce_id}>
              <div sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                {/* Image de l'annonce */}
                {annonce.photos && annonce.photos.length > 0 ? (
                  <img
                    src={annonce.photos[0]}
                    alt={annonce.titre}
                    height="200"
                  />
                ) : (
                  <div sx={{
                      height: 200,
                      backgroundColor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div>Pas de photo</div>
                  </div>
                )}

                {/* Contenu */}
                <div sx={{ flexGrow: 1 }}>
                  <div>
                    {annonce.titre}
                  </div>

                  <div>
                    {annonce.ville}
                    {annonce.code_postal && ` (${annonce.code_postal})`}
                  </div>

                  <div sx={{ mb: 2 }}>
                    <div>
                      {annonce.prix?.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }) || 'Prix non disponible'}
                    </div>
                  </div>

                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    {annonce.surface && (
                      <div>
                        📏 {annonce.surface} m²
                      </div>
                    )}
                    {annonce.nombre_pieces && (
                      <div>
                        🚪 {annonce.nombre_pieces} pièces
                      </div>
                    )}
                  </Stack>

                  {annonce.dpe && (
                    <div>
                      DPE: <strong>{annonce.dpe}</strong>
                    </div>
                  )}

                  {/* Description courte */}
                  <div>
                    {annonce.description}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => handleContactClick(annonce.annonce_id)}
                  >
                    Contacter le vendeur
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pas de résultats */}
      {!loading && annonces.length === 0 && (
        <div sx={{ textAlign: 'center', py: 6 }}>
          <div>
            Aucune annonce trouvée
          </div>
          <div>
            Essayez de modifier vos critères de filtrage
          </div>
          <Button
            variant="contained"
            color="primary"
            onClick={handleResetFilters}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
