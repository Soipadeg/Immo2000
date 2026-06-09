import '../styles/FavoritesPage.css';
/**
 * Page Favoris - Biens sauvegardés
 * Affichage et gestion des biens en favoris avec interface harmonisée
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert, Card } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { favorisApi } from '../services/api';

const FavoritesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Charger les favoris au montage
  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await favorisApi.list(0, 100);
      if (response.data && response.data.data) {
        setFavorites(response.data.data);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les favoris');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="favorites-page-container">
        <div className="loading-page">
          <div className="spinner"></div>
          <p>⏳ Chargement des favoris...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      await favorisApi.remove(favoriteId);
      setFavorites(favorites.filter((fav) => fav.favori_id !== favoriteId));
      setSuccess('Bien retiré des favoris');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression du favori');
    }
  };

  return (
    <div className="favorites-page-container">
      {/* Page Header Banner */}
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">⭐</span>
            <h1>Mes Favoris</h1>
          </div>
          <p>Consultez et gérez vos biens sauvegardés</p>
        </div>
      </div>

      {/* Alertes */}
      {error && <Alert type="error" title="Erreur" message={error} />}
      {success && <Alert type="success" title="Succès" message={success} />}

      {/* Contenu */}
      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤍</div>
          <h2>Aucun favori pour le moment</h2>
          <p>Commencez à sauvegarder vos biens préférés en cliquant sur le cœur</p>
          <a href="/search" className="cta-button">
            Découvrir les biens
          </a>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((fav) => (
            <Card key={fav.favori_id} className="favorite-card">
              <div className="card-image">
                <img
                  src={'https://via.placeholder.com/300x200?text=Bien+' + fav.annonce_id}
                  alt={'Annonce ' + fav.annonce_id}
                />
                <div className="card-badge">❤️ Favori</div>
              </div>

              <div className="card-body">
                <div className="card-title">Annonce #{fav.annonce_id}</div>

                {fav.commentaire && (
                  <div className="card-comment">{fav.commentaire}</div>
                )}

                {fav.note && (
                  <div className="card-rating">⭐ {fav.note}/5</div>
                )}

                <div className="card-date">
                  Ajouté le {new Date(fav.date_ajout).toLocaleDateString('fr-FR')}
                </div>
              </div>

              <div className="card-actions">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate(`/annonce/${fav.annonce_id}`)}
                >
                  👁️ Voir l'annonce
                </Button>
                <button
                  className="remove-button"
                  onClick={() => handleRemoveFavorite(fav.favori_id)}
                  title="Retirer des favoris"
                  aria-label="Retirer des favoris"
                >
                  ❌
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
