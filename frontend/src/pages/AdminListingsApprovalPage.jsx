import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Spinner, Alert, Button } from 'react-bootstrap';
import { useAdminApprovals } from '../hooks/useAdminApprovals';
import ApprovalQueue from '../components/admin/ApprovalQueue';
import './AdminListingsApprovalPage.css';

/**
 * AdminListingsApprovalPage - Page d'approbation des annonces pour les administrateurs
 * Affiche la file d'attente des annonces en attente d'approbation
 */
function AdminListingsApprovalPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const {
    pendingListings,
    loading,
    error,
    fetchPendingListings,
    approveListing,
    rejectListing,
    removeListing,
  } = useAdminApprovals();

  // Charger les annonces en attente au montage
  useEffect(() => {
    fetchPendingListings();
  }, []);

  const handleRefresh = () => {
    fetchPendingListings();
  };

  return (
    <Container fluid className="admin-listings-approval py-4">
      {/* Page Header */}
      <div className="page-header mb-4">
        <Row className="align-items-center">
          <Col md={8}>
            <h1 className="mb-2">
              <i className="bi bi-check-circle me-2"></i>
              Approbation des Annonces
            </h1>
            <p className="text-muted mb-0">
              Gérez l'approbation et la modération des annonces soumises par les vendeurs
            </p>
          </Col>
          <Col md={4} className="text-end">
            <Button
              variant="outline-primary"
              onClick={handleRefresh}
              disabled={loading}
              className="me-2"
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Rafraîchir
            </Button>
            <Button variant="outline-secondary" href="/admin">
              <i className="bi bi-arrow-left me-2"></i>
              Retour
            </Button>
          </Col>
        </Row>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="stat-icon">📋</div>
              <div className="stat-value">{pendingListings.length}</div>
              <div className="stat-label">En attente</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="stat-icon">✓</div>
              <div className="stat-value">--</div>
              <div className="stat-label">Approuvées (mois)</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="stat-icon">✗</div>
              <div className="stat-value">--</div>
              <div className="stat-label">Rejetées (mois)</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="stat-icon">⏱️</div>
              <div className="stat-value">--h</div>
              <div className="stat-label">Temps moyen</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card className="main-card border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="nav-tabs">
            <Tab eventKey="pending" title={`📋 En attente (${pendingListings.length})`}>
              <div className="py-3">Annonces en attente d'approbation</div>
            </Tab>
            <Tab eventKey="approved" title="✓ Approuvées">
              <div className="py-3">Annonces approuvées</div>
            </Tab>
            <Tab eventKey="rejected" title="✗ Rejetées">
              <div className="py-3">Annonces rejetées</div>
            </Tab>
          </Tabs>
        </Card.Header>

        <Card.Body>
          {/* Error Alert */}
          {error && (
            <Alert variant="danger" onClose={() => {}} dismissible>
              <strong>Erreur:</strong> {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && pendingListings.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Chargement des annonces...</p>
            </div>
          ) : (
            <>
              {activeTab === 'pending' && (
                <ApprovalQueue
                  listings={pendingListings}
                  loading={loading}
                  error={error}
                  onApprove={approveListing}
                  onReject={rejectListing}
                  onRemove={removeListing}
                  onRefresh={handleRefresh}
                />
              )}

              {activeTab === 'approved' && (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  Les annonces approuvées seront affichées ici
                </Alert>
              )}

              {activeTab === 'rejected' && (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  Les annonces rejetées seront affichées ici
                </Alert>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Help Section */}
      <div className="help-section mt-4">
        <Card className="border-0 shadow-sm bg-light">
          <Card.Body>
            <h5 className="mb-3">
              <i className="bi bi-question-circle me-2"></i>
              Aide
            </h5>
            <ul className="mb-0">
              <li>
                <strong>Approuver:</strong> L'annonce sera publiée et visible par les acheteurs
              </li>
              <li>
                <strong>Rejeter:</strong> L'annonce sera rejetée et le vendeur recevra une notification
              </li>
              <li>
                <strong>Supprimer:</strong> L'annonce sera supprimée définitivement (rarement utilisé)
              </li>
              <li>
                <strong>Sélection multiple:</strong> Sélectionnez plusieurs annonces pour des actions en masse
              </li>
            </ul>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}

export default AdminListingsApprovalPage;
