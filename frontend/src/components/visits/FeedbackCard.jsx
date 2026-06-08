import React, { useState } from 'react';
import { Card, Row, Col, Button, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import './FeedbackCard.css';

/**
 * FeedbackCard - Individual feedback card component
 * Displays visitor feedback with rating, comment, and response options
 */
function FeedbackCard({
  feedback,
  onRespond,
  onDelete,
  loading = false,
  isVendor = false,
}) {
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [responseText, setResponseText] = useState(feedback.response || '');

  if (!feedback) return null;

  const handleSendResponse = async () => {
    if (!responseText.trim()) {
      alert('Veuillez entrer une réponse');
      return;
    }
    try {
      await onRespond(feedback.visite_id, responseText);
      setShowResponseModal(false);
      setResponseText('');
    } catch (err) {
      console.error('Error sending response:', err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await onDelete(feedback.visite_id);
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting feedback:', err);
    }
  };

  // Helper: render star rating
  const renderStars = (rating) => {
    return (
      <div className="feedback-card__rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`star ${i <= rating ? 'filled' : 'empty'}`}>
            ★
          </span>
        ))}
        <span className="rating-text">({rating}/5)</span>
      </div>
    );
  };

  // Helper: get rating badge color
  const getRatingBadge = (rating) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'danger';
  };

  return (
    <>
      <Card className="feedback-card border-0 shadow-sm mb-3">
        {/* Header: Visitor Info + Rating */}
        <Card.Header className="feedback-card__header bg-white">
          <Row className="align-items-center">
            <Col md={8}>
              <div className="feedback-card__visitor">
                <div className="visitor-avatar">
                  {feedback.visitor_name?.charAt(0).toUpperCase()}
                </div>
                <div className="visitor-info">
                  <strong>{feedback.visitor_name || 'Visiteur'}</strong>
                  <small className="text-muted d-block">
                    {feedback.visitor_email}
                  </small>
                  <small className="text-muted">
                    Visite le{' '}
                    {new Date(feedback.visit_date).toLocaleDateString('fr-FR')}
                  </small>
                </div>
              </div>
            </Col>
            <Col md={4} className="text-end">
              {renderStars(feedback.rating || 0)}
            </Col>
          </Row>
        </Card.Header>

        {/* Body: Feedback Content */}
        <Card.Body className="feedback-card__body">
          {/* Feedback Message */}
          <div className="feedback-card__comment mb-3">
            <h6>Commentaire</h6>
            <p className="feedback-message">{feedback.comment || 'Aucun commentaire'}</p>
          </div>

          {/* Images (if any) */}
          {feedback.images && feedback.images.length > 0 && (
            <div className="feedback-card__images mb-3">
              <h6>Galerie</h6>
              <div className="images-grid">
                {feedback.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Feedback ${idx}`}
                    className="feedback-image"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Response Status & Response */}
          {feedback.response ? (
            <div className="feedback-card__response">
              <h6>Réponse du vendeur</h6>
              <div className="response-box">
                <div className="response-header">
                  <Badge bg="success" className="me-2">
                    ✓ Répondu
                  </Badge>
                  <small className="text-muted">
                    {new Date(feedback.response_date).toLocaleDateString(
                      'fr-FR'
                    )}
                  </small>
                </div>
                <p className="response-message mt-2">{feedback.response}</p>
              </div>
            </div>
          ) : (
            <Alert variant="info" className="mb-0">
              <i className="bi bi-info-circle me-2"></i>
              Cette offre attend une réponse du vendeur
            </Alert>
          )}
        </Card.Body>

        {/* Footer: Actions */}
        {isVendor && (
          <Card.Footer className="feedback-card__footer bg-white border-top">
            <div className="feedback-actions">
              {!feedback.response ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowResponseModal(true)}
                  disabled={loading}
                  className="me-2"
                >
                  {loading ? (
                    <>
                      <Spinner
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-reply me-2"></i>
                      Répondre
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowResponseModal(true)}
                  className="me-2"
                >
                  <i className="bi bi-pencil me-2"></i>
                  Modifier
                </Button>
              )}

              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                disabled={loading}
              >
                <i className="bi bi-trash me-2"></i>
                Supprimer
              </Button>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Response Modal */}
      <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {feedback.response ? 'Modifier' : 'Répondre'} au feedback
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Votre réponse</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Écrivez votre réponse au visiteur..."
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Merci de fournir une réponse constructive et professionnelle
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowResponseModal(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSendResponse}
            disabled={loading || !responseText.trim()}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Envoi...
              </>
            ) : (
              'Envoyer'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Supprimer ce feedback?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Attention!</strong> Cette action est irréversible.
          </Alert>
          <p>
            Êtes-vous sûr de vouloir supprimer ce feedback de{' '}
            <strong>{feedback.visitor_name}</strong>?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default FeedbackCard;
