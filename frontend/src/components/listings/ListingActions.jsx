import React, { useState } from 'react';
import { Dropdown, Button, Modal, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useListingActions } from '../../hooks/useListingActions';
import './ListingActions.css';

/**
 * ListingActions - Dropdown menu component for listing actions
 * Supports: Publish, Unpublish, Archive, MarkAsSold, Delete
 */
function ListingActions({
  listing,
  onActionComplete,
  size = 'sm',
  variant = 'secondary',
  showLabel = true,
  className = '',
}) {
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [archiveReason, setArchiveReason] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [soldDate, setSoldDate] = useState(new Date().toISOString().slice(0, 10));

  const {
    loading,
    archiveListing,
    markAsSold,
    deleteListing,
    publishListing,
    unpublishListing,
  } = useListingActions();

  if (!listing) return null;

  const isPublished = listing.status === 'PUBLIEE' || listing.statut === 'PUBLIEE';
  const isArchived = listing.status === 'ARCHIVEE' || listing.statut === 'ARCHIVEE';
  const isSold = listing.status === 'VENDUE' || listing.statut === 'VENDUE';

  /**
   * Handle publish action
   */
  const handlePublish = async () => {
    try {
      await publishListing(listing.id);
      onActionComplete?.();
    } catch (err) {
      console.error('Error publishing:', err);
    }
  };

  /**
   * Handle unpublish action
   */
  const handleUnpublish = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir dépublier cette annonce?')) {
      try {
        await unpublishListing(listing.id);
        onActionComplete?.();
      } catch (err) {
        console.error('Error unpublishing:', err);
      }
    }
  };

  /**
   * Handle archive action
   */
  const handleArchive = async () => {
    try {
      await archiveListing(listing.id, archiveReason);
      setShowArchiveModal(false);
      setArchiveReason('');
      onActionComplete?.();
    } catch (err) {
      console.error('Error archiving:', err);
    }
  };

  /**
   * Handle mark as sold action
   */
  const handleSold = async () => {
    if (!soldPrice || !soldDate) {
      alert('Veuillez remplir le prix et la date');
      return;
    }

    try {
      await markAsSold(listing.id, {
        prix_vente: parseFloat(soldPrice),
        date_vente: soldDate,
      });
      setShowSoldModal(false);
      setSoldPrice('');
      setSoldDate(new Date().toISOString().slice(0, 10));
      onActionComplete?.();
    } catch (err) {
      console.error('Error marking as sold:', err);
    }
  };

  /**
   * Handle delete action
   */
  const handleDelete = async () => {
    try {
      await deleteListing(listing.id);
      setShowDeleteModal(false);
      onActionComplete?.();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  return (
    <>
      {/* Actions Dropdown */}
      <Dropdown className={`listing-actions ${className}`}>
        <Dropdown.Toggle
          variant={variant}
          size={size}
          id={`dropdown-actions-${listing.id}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-1" />
              En cours...
            </>
          ) : (
            <>
              {showLabel ? (
                <>
                  <i className="bi bi-three-dots-vertical me-1"></i>
                  Actions
                </>
              ) : (
                <i className="bi bi-three-dots-vertical"></i>
              )}
            </>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu align="end" className="listing-actions-menu">
          {/* Publish / Unpublish Section */}
          <div className="actions-section">
            {!isPublished && !isSold ? (
              <>
                <Dropdown.Item onClick={handlePublish} disabled={loading}>
                  <i className="bi bi-cloud-upload me-2"></i>
                  Publier
                </Dropdown.Item>
              </>
            ) : isPublished ? (
              <>
                <Dropdown.Item onClick={handleUnpublish} disabled={loading}>
                  <i className="bi bi-cloud-download me-2"></i>
                  Dépublier
                </Dropdown.Item>
              </>
            ) : null}
          </div>

          {!isSold && (
            <>
              <Dropdown.Divider />

              {/* Archive Section */}
              <div className="actions-section">
                {!isArchived ? (
                  <Dropdown.Item
                    onClick={() => setShowArchiveModal(true)}
                    disabled={loading}
                  >
                    <i className="bi bi-archive me-2"></i>
                    Archiver
                  </Dropdown.Item>
                ) : (
                  <Dropdown.Item
                    onClick={handlePublish}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Remettre en ligne
                  </Dropdown.Item>
                )}
              </div>

              <Dropdown.Divider />

              {/* Mark as Sold Section */}
              <div className="actions-section">
                <Dropdown.Item
                  onClick={() => setShowSoldModal(true)}
                  disabled={loading}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Marquée comme vendue
                </Dropdown.Item>
              </div>
            </>
          )}

          <Dropdown.Divider />

          {/* Delete Section */}
          <div className="actions-section actions-danger">
            <Dropdown.Item
              onClick={() => setShowDeleteModal(true)}
              disabled={loading}
              className="text-danger"
            >
              <i className="bi bi-trash me-2"></i>
              Supprimer
            </Dropdown.Item>
          </div>
        </Dropdown.Menu>
      </Dropdown>

      {/* Archive Modal */}
      <Modal show={showArchiveModal} onHide={() => setShowArchiveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-archive me-2 text-warning"></i>
            Archiver l'annonce
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            L'annonce sera masquée des recherches publiques mais restera accessible
            depuis votre dashboard.
          </p>
          <Form.Group>
            <Form.Label>Raison de l'archivage (optionnel)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="Décrivez pourquoi vous archivez cette annonce..."
              disabled={loading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowArchiveModal(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="warning" onClick={handleArchive} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Archiver
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Mark as Sold Modal */}
      <Modal show={showSoldModal} onHide={() => setShowSoldModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-check-circle me-2 text-success"></i>
            Marquer comme vendue
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            Vous pouvez sauvegarder les détails de la vente pour votre suivi.
          </Alert>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prix de vente (optionnel)</Form.Label>
                <Form.Control
                  type="number"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                  placeholder="Ex: 250000"
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date de vente</Form.Label>
                <Form.Control
                  type="date"
                  value={soldDate}
                  onChange={(e) => setSoldDate(e.target.value)}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSoldModal(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleSold} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Valider
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton className="bg-danger bg-opacity-10 border-danger">
          <Modal.Title>
            <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
            Supprimer l'annonce
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>Attention!</strong> Cette action est irréversible. L'annonce et toutes
            les données associées seront supprimées définitivement.
          </Alert>
          <p>
            Êtes-vous vraiment sûr de vouloir supprimer l'annonce{' '}
            <strong>"{listing.titre || listing.title || 'sans titre'}"</strong>?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Supprimer définitivement
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ListingActions;
