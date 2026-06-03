import '../styles/FavoritesPage.css';
/**
 * Page Favoris - Biens sauvegardés
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { favorisApi } from '../services/api';

const FavoritesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <div className="favorites-container">
        <div className="loading-spinner">⏳ Chargement...</div>
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
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression du favori');
    }
  };

  return (
    <div className="favorites-page">
      <div className="page-header">
        <div>⭐ Mes Favoris</div>
        <div>{favorites.length} bien{favorites.length !== 1 ? 's' : ''} sauvegardé{favorites.length !== 1 ? 's' : ''}</div>
      </div>

      {error && <Alert type="error" title="Erreur" message={error} />}

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤍</div>
          <div>Aucun favori pour le moment</div>
          <div>Commencez à sauvegarder vos biens préférés en cliquant sur le cœur</div>

          <a href="/search" className="link-button">
            Consulter les annonces
          </a>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((fav) => (
            <div key={fav.favori_id} className="favorite-card">
              <div className="card-image">
                <img
                  src={'https://via.placeholder.com/400x250?text=Bien+' + fav.annonce_id}
                  alt={'Annonce ' + fav.annonce_id}
                />
              </div>

              <div className="card-content">
                <div className="card-header">
                  <div className="favorite-badge">❤️ Favori</div>
                  {fav.note && (
                    <div className="rating">⭐ {fav.note}/5</div>
                  )}
                </div>

                <div>Annonce #{fav.annonce_id}</div>

                {fav.commentaire && (
                  <div className="commentaire">{fav.commentaire}</div>

                )}

                <div className="date-ajout">
                  Ajouté le {new Date(fav.date_ajout).toLocaleDateString('fr-FR')}
                </div>
              </div>

              <div className="card-actions">
                <a href={`/annonce/${fav.annonce_id}`} className="action-link">
                  Voir l'annonce
                </a>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveFavorite(fav.favori_id)}
                  title="Retirer des favoris"
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
