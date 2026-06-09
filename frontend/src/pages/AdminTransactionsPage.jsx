import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useAdminApprovals } from '../hooks/useAdminApprovals';
import './AdminTransactionsPage.css';

/**
 * AdminTransactionsPage - Page de gestion des transactions pour les administrateurs
 */
function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const {
    loading,
    error,
    fetchPendingTransactions,
    acceptTransaction,
    declineTransaction,
    cancelTransaction,
    getTransaction,
  } = useAdminApprovals();

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'accept', 'decline', 'cancel'
  const [actionReason, setActionReason] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les transactions
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      await fetchPendingTransactions();
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  const handleViewDetails = async (transaction) => {
    try {
      const details = await getTransaction(transaction.id);
      setSelectedTransaction(details);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading transaction details:', err);
    }
  };

  const handleAction = (transaction, type) => {
    setSelectedTransaction(transaction);
    setActionType(type);
    setShowActionModal(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (actionType === 'accept') {
        await acceptTransaction(selectedTransaction.id, actionReason);
      } else if (actionType === 'decline') {
        if (!actionReason) {
          alert('Veuillez sélectionner une raison');
          return;
        }
        await declineTransaction(selectedTransaction.id, actionReason, actionMessage);
      } else if (actionType === 'cancel') {
        if (!actionReason) {
          alert('Veuillez sélectionner une raison');
          return;
        }
        await cancelTransaction(selectedTransaction.id, actionReason);
      }
      setShowActionModal(false);
      setActionReason('');
      setActionMessage('');
      loadTransactions();
    } catch (err) {
      console.error('Error confirming action:', err);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning',
      ACCEPTED: 'success',
      DECLINED: 'danger',
      CANCELLED: 'secondary',
    };
    const labels = {
      PENDING: 'En attente',
      ACCEPTED: 'Acceptée',
      DECLINED: 'Déclinée',
      CANCELLED: 'Annulée',
    };
    return (
      <Badge bg={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchTerm && !t.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <Container fluid className="admin-transactions py-4">
      {/* Page Header */}
      <div className="page-header mb-4">
        <Row className="align-items-center">
          <Col md={8}>
            <h1 className="mb-2">
              <i className="bi bi-receipt me-2"></i>
              Gestion des Transactions
            </h1>
            <p className="text-muted mb-0">
              Gérez les offres et transactions des acheteurs
            </p>
          </Col>
          <Col md={4} className="text-end">
            <Button
              variant="outline-primary"
              onClick={loadTransactions}
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

      {/* Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="stat-icon">📋</div>
              <div className="stat-value">{transactions.filter(t => t.status === 'PENDING').length}</div>
              <div className="stat-label">En attente</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="stat-icon">✓</div>
              <div className="stat-value">{transactions.filter(t => t.status === 'ACCEPTED').length}</div>
              <div className="stat-label">Acceptées</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="stat-icon">✗</div>
              <div className="stat-value">{transactions.filter(t => t.status === 'DECLINED').length}</div>
              <div className="stat-label">Déclinées</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="stat-icon">💰</div>
              <div className="stat-value">--</div>
              <div className="stat-label">Montant total</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <Row className="align-items-center">
            <Col md={6}>
              <Form.Control
                placeholder="Rechercher par acheteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col md={6} className="text-end">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ maxWidth: '200px', display: 'inline-block' }}
              >
                <option value="all">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="ACCEPTED">Acceptées</option>
                <option value="DECLINED">Déclinées</option>
                <option value="CANCELLED">Annulées</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {error && (
            <Alert variant="danger" className="m-3">
              <strong>Erreur:</strong> {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Chargement des transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Alert variant="info" className="m-3">
              <i className="bi bi-info-circle me-2"></i>
              Aucune transaction trouvée
            </Alert>
          ) : (
            <Table striped hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Acheteur</th>
                  <th>Propriété</th>
                  <th>Offre</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <strong>{transaction.buyer_name || 'N/A'}</strong>
                      <br />
                      <small className="text-muted">{transaction.buyer_email}</small>
                    </td>
                    <td>
                      {transaction.property_title || 'N/A'}
                      <br />
                      <small className="text-muted">{transaction.property_city}</small>
                    </td>
                    <td>
                      <strong>
                        {transaction.offer_price?.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </strong>
                      <br />
                      <small className="text-muted">
                        {transaction.offer_date && new Date(transaction.offer_date).toLocaleDateString('fr-FR')}
                      </small>
                    </td>
                    <td>{getStatusBadge(transaction.status)}</td>
                    <td>{new Date(transaction.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleViewDetails(transaction)}
                        className="me-2"
                      >
                        Détails
                      </Button>
                      {transaction.status === 'PENDING' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAction(transaction, 'accept')}
                            className="me-2"
                          >
                            ✓
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleAction(transaction, 'decline')}
                          >
                            ✗
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails de la transaction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <div className="transaction-details">
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Acheteur</h6>
                  <p>{selectedTransaction.buyer_name}</p>
                  <small className="text-muted">{selectedTransaction.buyer_email}</small>
                </Col>
                <Col md={6}>
                  <h6>Propriété</h6>
                  <p>{selectedTransaction.property_title}</p>
                  <small className="text-muted">{selectedTransaction.property_city}</small>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Offre</h6>
                  <p>
                    {selectedTransaction.offer_price?.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Statut</h6>
                  <p>{getStatusBadge(selectedTransaction.status)}</p>
                </Col>
              </Row>
              {selectedTransaction.message && (
                <Row className="mb-3">
                  <Col>
                    <h6>Message</h6>
                    <p className="bg-light p-3 rounded">{selectedTransaction.message}</p>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Action Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === 'accept' && 'Accepter la transaction'}
            {actionType === 'decline' && 'Décliner l\'offre'}
            {actionType === 'cancel' && 'Annuler la transaction'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionType === 'accept' && (
            <Form.Group>
              <Form.Label>Notes (optionnel)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ajoutez des notes..."
              />
            </Form.Group>
          )}
          {actionType === 'decline' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Raison du déclin *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous décinez cette offre..."
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Message à l'acheteur (optionnel)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  placeholder="Message supplémentaire..."
                />
              </Form.Group>
            </>
          )}
          {actionType === 'cancel' && (
            <Form.Group>
              <Form.Label>Raison de l'annulation *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Expliquez pourquoi vous annulez..."
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActionModal(false)}>
            Annuler
          </Button>
          <Button
            variant={actionType === 'decline' || actionType === 'cancel' ? 'danger' : 'success'}
            onClick={handleConfirmAction}
          >
            {actionType === 'accept' && 'Accepter'}
            {actionType === 'decline' && 'Décliner'}
            {actionType === 'cancel' && 'Annuler'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default AdminTransactionsPage;
