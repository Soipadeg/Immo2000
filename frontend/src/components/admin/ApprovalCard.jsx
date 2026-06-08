import React, { useState } from 'react';
import { Card, Button, Modal, Form, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import './ApprovalCard.css';

/**
 * ApprovalCard - Carte pour afficher une annonce en attente d'approbation
 */
function ApprovalCard({
  listing,
  onApprove,
  onReject,
  onRemove,
  loading = false,
}) {
  const [showApprovalNotes, setShowApprovalNotes] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [removalReason, setRemovalReason] = useState('');

  if (!listing) return null;

  const handleApprove = async () => {
    try {
      await onApprove?.(listing.id, approvalNotes);
      setShowApprovalNotes(false);
      setApprovalNotes('');
    } catch (err) {
      console.error('Error approving:', err);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      alert('Veuillez sélectionner une raison');
      return;
    }
    try {
      await onReject?.(listing.id, rejectionReason, rejectionMessage);
      setShowRejectionModal(false);
      setRejectionReason('');
      setRejectionMessage('');
    } catch (err) {
      console.error('Error rejecting:', err);
    }
  };

  const handleRemove = async () => {
    if (!removalReason) {
      alert('Veuillez sélectionner une raison');
      return;
    }
    try {
      await onRemove?.(listing.id, removalReason);
      setShowRemovalModal(false);
      setRemovalReason('');
    } catch (err) {
      console.error('Error removing:', err);
    }
  };

  const rejectionReasons = [
    { value: 'INCOMPLETE', label: 'Informations incomplètes' },
    { value: 'LOW_QUALITY', label: 'Photos de mauvaise qualité' },
    { value: 'MISLEADING', label: 'Description trompeuse' },
    { value: 'INAPPROPRIATE', label: 'Contenu inapproprié' },
    { value: 'SPAM', label: 'Contenu similaire en doublon' },
    { value: 'POLICY_VIOLATION', label: 'Violation de politique' },
    { value: 'OTHER', label: 'Autre' },
  ];

  const removalReasons = [
    { value: 'SOLD', label: 'Bien vendu' },
    { value: 'FRAUD', label: 'Suspicion de fraude' },
    { value: 'ILLEGAL', label: 'Contenu illégal' },
    { value: 'ABUSE', label: 'Abus signalé' },
    { value: 'OTHER', label: 'Autre' },
  ];

  return (
    <>
      <Card className="approval-card border-0 shadow-sm mb-4">
        <Card.Body>
          {/* Header with status */}
          <Row className="mb-3 align-items-start">
            <Col md={8}>
              <h5 className="mb-2">{listing.titre || 'Sans titre'}</h5>
              <div className="text-muted mb-2">
                <small>
                  📍 {listing.ville || listing.city} • Soumise le{' '}
                  {new Date(listing.date_creation).toLocaleDateString('fr-FR')}
                </small>
              </div>
              <Badge bg="warning" className="me-2">
                🔍 En attente d'approbation
              </Badge>
              {listing.compliance_status && (
                <Badge bg={listing.compliance_status === 'OK' ? 'success' : 'danger'}>
                  {listing.compliance_status === 'OK' ? '✓' : '✗'} Conformité
                </Badge>
              )}
            </Col>
            <Col md={4} className="text-end">
              <div className="price-badge">
                {listing.prix?.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }) || 'N/A'}
              </div>
            </Col>
          </Row>

          <hr className="my-3" />

          {/* Listing details grid */}
          <Row className="mb-3">
            <Col md={3}>
              <div className="detail-item">
                <small className="text-muted">Surface</small>
                <div className="detail-value">{listing.surface}m²</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="detail-item">
                <small className="text-muted">Pièces</small>
                <div className="detail-value">{listing.nombre_pieces}</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="detail-item">
                <small className="text-muted">Type</small>
                <div className="detail-value">{listing.type_bien || 'N/A'}</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="detail-item">
                <small className="text-muted">DPE</small>
                <div className="detail-value">{listing.dpe || 'N/A'}</div>
              </div>
            </Col>
          </Row>

          {/* Description preview */}
          <div className="description-preview mb-3">
            <small className="text-muted">Description:</small>
            <p className="text-truncate-lines mb-0">
              {listing.description || 'Pas de description'}
            </p>
          </div>

          {/* Seller info */}
          <div className="seller-info bg-light p-2 rounded mb-3">
            <small className="text-muted">Vendeur:</small>
            <div>
              {listing.utilisateur?.prenom} {listing.utilisateur?.nom}
            </div>
            <small className="text-muted">
              Email: {listing.utilisateur?.email}
            </small>
          </div>

          <hr className="my-3" />

          {/* Action buttons */}
          <div className="approval-actions d-flex gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => setShowApprovalNotes(true)}
              disabled={loading}
            >
              {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              ✓ Approuver
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowRejectionModal(true)}
              disabled={loading}
            >
              ✗ Rejeter
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => setShowRemovalModal(true)}
              disabled={loading}
            >
              🗑️ Supprimer
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => window.open(`/annonce/${listing.id}`, '_blank')}
            >
              👁️ Prévisualiser
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Approval Modal */}
      <Modal show={showApprovalNotes} onHide={() => setShowApprovalNotes(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-check-circle me-2 text-success"></i>
            Approuver l'annonce
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Notes d'approbation (optionnel)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Ajoutez des notes pour le vendeur..."
              disabled={loading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowApprovalNotes(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button variant="success" onClick={handleApprove} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Approuver
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Rejection Modal */}
      <Modal show={showRejectionModal} onHide={() => setShowRejectionModal(false)}>
        <Modal.Header closeButton className="bg-danger bg-opacity-10 border-danger">
          <Modal.Title>
            <i className="bi bi-x-circle me-2 text-danger"></i>
            Rejeter l'annonce
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            L'annonce sera rejetée et le vendeur recevra une notification.
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>Raison du rejet *</Form.Label>
            <Form.Select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Sélectionner une raison --</option>
              {rejectionReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Message au vendeur (optionnel)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
              placeholder="Expliquez pourquoi l'annonce a été rejetée..."
              disabled={loading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowRejectionModal(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button variant="danger" onClick={handleReject} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Rejeter
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Removal Modal */}
      <Modal show={showRemovalModal} onHide={() => setShowRemovalModal(false)}>
        <Modal.Header closeButton className="bg-danger bg-opacity-10 border-danger">
          <Modal.Title>
            <i className="bi bi-trash me-2 text-danger"></i>
            Supprimer l'annonce
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>Attention!</strong> Cette action supprimera définitivement l'annonce.
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>Raison de la suppression *</Form.Label>
            <Form.Select
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Sélectionner une raison --</option>
              {removalReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowRemovalModal(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button variant="danger" onClick={handleRemove} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ApprovalCard;
