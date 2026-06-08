import React, { useState } from 'react';
import { Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import FeedbackCard from './FeedbackCard';
import './FeedbackList.css';

/**
 * FeedbackList - Container for displaying list of feedback with filtering
 * Displays cards with search, filter, and sort capabilities
 */
function FeedbackList({
  feedbacks = [],
  loading = false,
  error = null,
  onRespond,
  onDelete,
  isVendor = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  // Filter feedbacks
  const filteredFeedbacks = feedbacks
    .filter((f) => {
      // Search filter
      if (
        searchTerm &&
        !f.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      // Rating filter
      if (filterRating !== 'all') {
        const rating = parseInt(filterRating);
        if (rating === 1 && f.rating < 2) return true;
        if (rating === 2 && (f.rating < 3 && f.rating >= 2)) return true;
        if (rating === 3 && (f.rating < 4 && f.rating >= 3)) return true;
        if (rating === 4 && (f.rating < 5 && f.rating >= 4)) return true;
        if (rating === 5 && f.rating === 5) return true;
        if (rating === 1 && f.rating >= 2) return false;
        if (rating === 2 && f.rating < 2) return false;
        if (rating === 3 && f.rating < 3) return false;
        if (rating === 4 && f.rating < 4) return false;
        if (rating === 5 && f.rating !== 5) return false;
      }
      // Status filter
      if (filterStatus === 'responded' && !f.response) return false;
      if (filterStatus === 'pending' && f.response) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.visit_date) - new Date(a.visit_date);
      }
      if (sortBy === 'date_asc') {
        return new Date(a.visit_date) - new Date(b.visit_date);
      }
      if (sortBy === 'rating_high') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'rating_low') {
        return (a.rating || 0) - (b.rating || 0);
      }
      return 0;
    });

  // Helper: render stats
  const stats = {
    total: feedbacks.length,
    responded: feedbacks.filter((f) => f.response).length,
    pending: feedbacks.filter((f) => !f.response).length,
    avgRating:
      feedbacks.length > 0
        ? (
            feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) /
            feedbacks.length
          ).toFixed(1)
        : 0,
  };

  if (error) {
    return (
      <div className="feedback-list__error">
        <div className="error-message">
          <strong>Erreur:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-list">
      {/* Statistics Cards */}
      {feedbacks.length > 0 && (
        <div className="feedback-list__stats mb-4">
          <Row>
            <Col md={3} sm={6} className="mb-3">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total</div>
              </div>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{stats.avgRating}</div>
                <div className="stat-label">Note moyenne</div>
              </div>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <div className="stat-card">
                <div className="stat-icon">✓</div>
                <div className="stat-value">{stats.responded}</div>
                <div className="stat-label">Répondus</div>
              </div>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">En attente</div>
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* Filters & Search */}
      {feedbacks.length > 0 && (
        <div className="feedback-list__filters mb-4">
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher par visiteur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="responded">Répondus</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
              >
                <option value="all">Toutes les notes</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 étoiles)</option>
                <option value="4">⭐⭐⭐⭐ (4 étoiles)</option>
                <option value="3">⭐⭐⭐ (3 étoiles)</option>
                <option value="2">⭐⭐ (2 étoiles)</option>
                <option value="1">⭐ (1 étoile)</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date_desc">Plus récent</option>
                <option value="date_asc">Plus ancien</option>
                <option value="rating_high">Note ↓</option>
                <option value="rating_low">Note ↑</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterRating('all');
                  setSortBy('date_desc');
                }}
                className="w-100"
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </div>
      )}

      {/* Empty State */}
      {!loading && feedbacks.length === 0 && (
        <div className="feedback-list__empty">
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>Aucun feedback pour le moment</h3>
            <p>Les visiteurs pourront laisser des commentaires après leur visite</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && feedbacks.length === 0 && (
        <div className="feedback-list__loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement des feedbacks...</p>
          </div>
        </div>
      )}

      {/* Feedback Cards */}
      {!loading && filteredFeedbacks.length > 0 && (
        <div className="feedback-list__items">
          <div className="results-info">
            Affichage de {filteredFeedbacks.length} résultat
            {filteredFeedbacks.length > 1 ? 's' : ''} sur {feedbacks.length}
          </div>
          {filteredFeedbacks.map((feedback) => (
            <FeedbackCard
              key={feedback.visite_id}
              feedback={feedback}
              onRespond={onRespond}
              onDelete={onDelete}
              loading={loading}
              isVendor={isVendor}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && feedbacks.length > 0 && filteredFeedbacks.length === 0 && (
        <div className="feedback-list__no-results">
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h4>Aucun résultat trouvé</h4>
            <p>Essayez de modifier vos critères de recherche</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedbackList;
