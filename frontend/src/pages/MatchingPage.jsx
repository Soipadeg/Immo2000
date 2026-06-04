import '../styles/MatchingPage.css';
import './MatchingPage.css';
import { Alert,Button,Input } from '@/components';
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

  // Récupérer l'acheteur_id depuis le localStorage
  const userId = localStorage.getItem('user_id');
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    // Optionnel : charger les matching au montage si souhaité
    // handleSubmit();
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
      // Fermer le message de succès après 3 secondes
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

  const renderScoreStars = (score) => {
    // Convertir le score 0-100 en étoiles 0-5
    const stars = (score / 100) * 5;
    return stars;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="matching-page">
      <div className="page-header">
        <div className="page-header__content">
          <span className="page-header__icon">❤️</span>
          <div>
            <h1>Trouvez votre bien idéal</h1>
            <p>
              Utilisez les filtres ci-dessous pour découvrir les annonces les plus adaptées à vos
              critères.
            </p>
          </div>
        </div>
      </div>

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

      {/* Formulaire de filtres */}
      <div className="filters-card">
        <form onSubmit={handleSubmit}>
          <div className="filters-grid">
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
          </div>

          {/* Boutons d'action */}
          <div className="filters-actions">
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

      {/* Résultats */}
      <div className="results-section">
        <h2 className="results-title">Résultats ({annonces.length})</h2>

        {annonces.length === 0 && !loading ? (
          <div className="no-results-card">
            <div className="no-results-icon">🏠</div>
            <h3>Aucune annonce ne correspond à vos critères.</h3>
            <p>
              Essayez d'élargir vos critères de recherche.
            </p>
          </div>
        ) : (
          <div className="annonces-grid">
            {annonces.map((annonce) => (
              <div item xs={12} sm={6} md={4} key={annonce.id}>
                <div className="annonce-card" elevation={2}>
                  {/* Image */}
                  <CardMedia
                    component="img"
                    height="200"
                    image={
                      annonce.image_url ||
                      annonce.photo ||
                      'https://via.placeholder.com/400x200?text=Pas+d%27image'
                    }
                    alt={annonce.adresse || 'Annonce immobilière'}
                    onError={(e) => {
                      e.target.src =
                        'https://via.placeholder.com/400x200?text=Image+indisponible';
                    }}
                  />

                  {/* Contenu principal */}
                  <div>
                    <div>
                      <div>
                        {annonce.adresse || 'Adresse non disponible'}
                      </div>

                      {/* Prix et caractéristiques */}
                      <div>
                        <div
                          label={`${formatPrice(annonce.prix || 0)}`}
                          color="primary"
                          variant="outlined"
                        />
                        {annonce.surface && (
                          <div label={`${annonce.surface} m²`} variant="outlined" />
                        )}
                        {annonce.type_bien && (
                          <div label={annonce.type_bien} variant="outlined" />
                        )}
                      </div>

                      {/* Score */}
                      {annonce.score !== undefined && (
                        <div>
                          <Rating
                            value={renderScoreStars(annonce.score)}
                            readOnly
                            precision={0.5}
                            size="small"
                          />
                          <div>
                            ({annonce.score}/100)
                          </div>
                        </div>
                      )}

                      {/* Détails supplémentaires */}
                      {annonce.description && (
                        <div>
                          {annonce.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={() => navigate(`/annonces/${annonce.id}`)}
                    >
                      Voir l'annonce
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate(`/visites?annonce_id=${annonce.id}`)}
                    >
                      Prendre RDV
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchingPage;
