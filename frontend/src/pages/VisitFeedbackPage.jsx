import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../hooks/useFeedback';
import { useAuth } from '../hooks/useAuth';
import FeedbackList from '../components/visits/FeedbackList';
import './VisitFeedbackPage.css';

/**
 * VisitFeedbackPage - Main page for managing visit feedback
 * Displays vendor's received feedback with response capabilities
 */
function VisitFeedbackPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    feedback,
    loading,
    error,
    fetchVendorFeedbacks,
    respondToFeedback,
    deleteFeedback,
    markAsResponded,
  } = useFeedback();

  const [activeTab, setActiveTab] = useState('all');

  // Check admin/vendor access
  useEffect(() => {
    if (!authLoading && (!user || (user?.role !== 'vendor' && user?.role !== 'admin'))) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Load feedback on mount
  useEffect(() => {
    if (!authLoading && user) {
      loadFeedback();
    }
  }, [authLoading, user]);

  const loadFeedback = async () => {
    try {
      await fetchVendorFeedbacks();
    } catch (err) {
      console.error('Error loading feedback:', err);
    }
  };

  // Filter feedback by tab
  const getFilteredFeedback = () => {
    if (activeTab === 'responded') {
      return feedback.filter((f) => f.response);
    }
    if (activeTab === 'pending') {
      return feedback.filter((f) => !f.response);
    }
    return feedback;
  };

  const filteredFeedback = getFilteredFeedback();

  // Calculate stats
  const stats = {
    total: feedback.length,
    responded: feedback.filter((f) => f.response).length,
    pending: feedback.filter((f) => !f.response).length,
    avgRating:
      feedback.length > 0
        ? (
            feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length
          ).toFixed(1)
        : 0,
  };

  return (
    <Container fluid className="visit-feedback-page py-4">
      {/* Page Header */}
      <div className="page-header mb-4">
        <Row className="align-items-center">
          <Col md={8}>
            <h1 className="mb-2">
              <i className="bi bi-chat-dots me-2"></i>
              Feedback des Visiteurs
            </h1>
            <p className="text-muted mb-0">
              Consultez et répondez aux commentaires des visiteurs
            </p>
          </Col>
          <Col md={4} className="text-end">
            <Button
              variant="outline-primary"
              onClick={loadFeedback}
              disabled={loading}
              className="me-2"
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Rafraîchir
            </Button>
            <Button variant="outline-secondary" href="/dashboard">
              <i className="bi bi-arrow-left me-2"></i>
              Retour
            </Button>
          </Col>
        </Row>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => {}}>
          <strong>Erreur:</strong> {error}
        </Alert>
      )}

      {/* Statistics */}
      {feedback.length > 0 && (
        <Row className="mb-4">
          <Col md={3} sm={6} className="mb-3">
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Feedbacks Total</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{stats.avgRating}</div>
                <div className="stat-label">Note Moyenne</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="stat-icon">✓</div>
                <div className="stat-value">{stats.responded}</div>
                <div className="stat-label">Répondus</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="stat-icon">⏳</div>
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">En Attente</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tab Navigation */}
      {feedback.length > 0 && (
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-bottom">
            <Nav variant="pills" className="nav-fill">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'all'}
                  onClick={() => setActiveTab('all')}
                  className="cursor-pointer"
                >
                  <i className="bi bi-list me-2"></i>
                  Tous ({feedback.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'pending'}
                  onClick={() => setActiveTab('pending')}
                  className="cursor-pointer"
                >
                  <i className="bi bi-exclamation-circle me-2"></i>
                  En Attente ({stats.pending})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'responded'}
                  onClick={() => setActiveTab('responded')}
                  className="cursor-pointer"
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Répondus ({stats.responded})
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
        </Card>
      )}

      {/* Main Content */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          {loading && feedback.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p>Chargement des feedbacks...</p>
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📝</div>
              <h4>Aucun feedback pour le moment</h4>
              <p className="text-muted">
                Les visiteurs pourront laisser des commentaires après leur visite
              </p>
            </div>
          ) : (
            <FeedbackList
              feedbacks={filteredFeedback}
              loading={loading}
              error={error}
              onRespond={async (visitId, responseText) => {
                try {
                  await respondToFeedback(visitId, responseText);
                  await markAsResponded(visitId);
                  loadFeedback(); // Reload to get updated data
                } catch (err) {
                  console.error('Error responding:', err);
                }
              }}
              onDelete={async (visitId) => {
                try {
                  await deleteFeedback(visitId);
                  loadFeedback(); // Reload to get updated data
                } catch (err) {
                  console.error('Error deleting:', err);
                }
              }}
              isVendor={true}
            />
          )}
        </Card.Body>
      </Card>

      {/* Help Section */}
      {feedback.length > 0 && (
        <Card className="mt-4 border-0 shadow-sm" style={{ background: '#f0f8ff' }}>
          <Card.Body>
            <h5 className="mb-3">
              <i className="bi bi-question-circle me-2"></i>
              Comment ça marche?
            </h5>
            <ul style={{ marginBottom: 0, color: '#555' }}>
              <li>
                Les visiteurs laissent des commentaires et des notes après leur visite
              </li>
              <li>Vous pouvez voir tous les feedbacks reçus ici</li>
              <li>
                Répondez aux visiteurs pour montrer que vous prenez leurs avis au sérieux
              </li>
              <li>
                Les réponses constructives aident à améliorer votre réputation sur la plateforme
              </li>
            </ul>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default VisitFeedbackPage;
