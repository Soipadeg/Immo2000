import './MatchingPage.css';
import { Alert, Button, Input, Card, FormContainer } from '@/components';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const MatchingPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    ville: '',
    budget_max: '',
    surface_min: '',
    type_bien: '',
  });
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const userId = localStorage.getItem('user_id');
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    // Optionnel : charger les matching au montage
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!userId) {
      setError('Vous devez être connecté pour accéder au matching.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/matching`,
        {
          acheteur_id: parseInt(userId),
          ville: filters.ville || undefined,
          budget_max: filters.budget_max ? parseInt(filters.budget_max) : undefined,
          surface_min: filters.surface_min ? parseInt(filters.surface_min) : undefined,
          type_bien: filters.type_bien || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setAnnonces(response.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur lors de la requête de matching:', err);
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Erreur lors de la recherche. Veuillez réessayer.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      ville: '',
      budget_max: '',
      surface_min: '',
      type_bien: '',
    });
    setAnnonces([]);
    setError(null);
  };

  const handleDetailClick = (annonceId) => {
    navigate(`/annonce/${annonceId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      {/* Animated Header - Exact same structure as SearchPage */}
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">❤️</span>
            <h1>Trouvez votre bien idéal</h1>
          </div>
          <p>Utilisez les filtres ci-dessous pour découvrir les annonces les plus adaptées à vos critères</p>
        </div>
      </div>

      <FormContainer maxWidth="full-width">
        {/* Messages d'alerte */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && annonces.length > 0 && (
          <Alert severity="success" onClose={() => setSuccess(false)}>
            Recherche effectuée ! {annonces.length} annonce(s) trouvée(s).
          </Alert>
        )}

        {/* Filters */}
        <div className="search-filters">
          <form onSubmit={handleSubmit}>
            <Input
              label="Ville"
              name="ville"
              value={filters.ville}
              onChange={handleFilterChange}
              placeholder="Ex: Paris, Lyon..."
            />

            <Input
              label="Budget maximum (€)"
              name="budget_max"
              type="number"
              value={filters.budget_max}
              onChange={handleFilterChange}
              placeholder="Ex: 300000"
            />

            <Input
              label="Surface minimum (m²)"
              name="surface_min"
              type="number"
              value={filters.surface_min}
              onChange={handleFilterChange}
              placeholder="Ex: 80"
            />

            <Input
              label="Type de bien"
              name="type_bien"
              value={filters.type_bien}
              onChange={handleFilterChange}
              placeholder="Ex: Appartement, Maison..."
            />

            {/* Action Buttons */}
            <div className="search-filters-actions">
              <Button
                variant="secondary"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Réinitialiser
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                🔍 {loading ? 'Recherche...' : 'Rechercher'}
              </Button>
            </div>
          </form>
        </div>

        {/* Summary */}
        <div className="search-summary">
          <div>
            <strong>{annonces.length} annonce{annonces.length !== 1 ? 's' : ''}</strong>
            {filters.type_bien && ` • ${filters.type_bien}`}
          </div>
        </div>

        {/* Results Grid */}
        {annonces.length === 0 ? (
          <div className="search-empty">
            <div>🏠</div>
            <h3>Aucune annonce ne correspond à vos critères.</h3>
            <p>Essayez d'élargir vos critères de recherche.</p>
          </div>
        ) : (
          <div className="search-grid">
            {annonces.map((annonce) => (
              <Card key={annonce.id} variant="elevated" interactive>
                <div className="annonce-card">
                  {/* Image */}
                  <div className="annonce-image">
                    <img
                      src={
                        annonce.image_url ||
                        annonce.photo ||
                        'https://via.placeholder.com/400x200?text=Pas+d%27image'
                      }
                      alt={annonce.adresse || 'Annonce'}
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/400x200?text=Image+indisponible';
                      }}
                    />
                    <div className="property-type-badge">{annonce.type_bien || 'Bien'}</div>
                  </div>

                  {/* Content */}
                  <div className="annonce-content">
                    <div>{annonce.adresse || 'Adresse non disponible'}</div>
                    <div className="annonce-price">{formatPrice(annonce.prix || 0)}</div>
                    <div className="annonce-description">
                      {annonce.description || 'Pas de description'}
                    </div>

                    {/* Details */}
                    <div className="annonce-details">
                      {annonce.surface && (
                        <div className="detail">
                          <div className="detail-label">Surface</div>
                          <div>{annonce.surface} m²</div>
                        </div>
                      )}
                      {annonce.nombre_pieces && (
                        <div className="detail">
                          <div className="detail-label">Pièces</div>
                          <div>{annonce.nombre_pieces}</div>
                        </div>
                      )}
                      {annonce.nombre_chambres !== undefined && (
                        <div className="detail">
                          <div className="detail-label">Chambres</div>
                          <div>{annonce.nombre_chambres}</div>
                        </div>
                      )}
                      {annonce.ville && (
                        <div className="detail">
                          <div className="detail-label">Localité</div>
                          <div>{annonce.ville}</div>
                        </div>
                      )}
                    </div>

                    {/* Score if available */}
                    {annonce.score !== undefined && (
                      <div className="annonce-score">
                        Score: {annonce.score}/100
                      </div>
                    )}

                    {/* Actions */}
                    <div className="annonce-actions">
                      <Button
                        variant="primary"
                        size="medium"
                        onClick={() => handleDetailClick(annonce.id)}
                      >
                        Voir les détails
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </FormContainer>
    </>
  );
};


export default MatchingPage;
