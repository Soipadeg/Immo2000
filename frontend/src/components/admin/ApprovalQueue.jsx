import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, InputGroup } from 'react-bootstrap';
import ApprovalCard from './ApprovalCard';
import './ApprovalQueue.css';

/**
 * ApprovalQueue - File d'attente des annonces en attente d'approbation
 */
function ApprovalQueue({
  listings = [],
  loading = false,
  error = null,
  onApprove = () => {},
  onReject = () => {},
  onRemove = () => {},
  onRefresh = () => {},
}) {
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // date_asc, date_desc, price_asc, price_desc
  const [filterType, setFilterType] = useState('all'); // all, apartment, house, etc.
  const [selectedListings, setSelectedListings] = useState(new Set());

  // Filtrer et trier
  useEffect(() => {
    let filtered = listings;

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (listing) =>
          listing.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          listing.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          listing.utilisateur?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre type
    if (filterType !== 'all') {
      filtered = filtered.filter((listing) => listing.type_bien === filterType);
    }

    // Tri
    switch (sortBy) {
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.date_creation) - new Date(b.date_creation));
        break;
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
        break;
      case 'price_asc':
        filtered.sort((a, b) => (a.prix || 0) - (b.prix || 0));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.prix || 0) - (a.prix || 0));
        break;
      default:
        break;
    }

    setFilteredListings(filtered);
  }, [listings, searchTerm, filterType, sortBy]);

  const handleSelectListing = (listingId) => {
    const updated = new Set(selectedListings);
    if (updated.has(listingId)) {
      updated.delete(listingId);
    } else {
      updated.add(listingId);
    }
    setSelectedListings(updated);
  };

  const handleSelectAll = () => {
    if (selectedListings.size === filteredListings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(filteredListings.map((l) => l.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedListings.size === 0) {
      alert('Aucune annonce sélectionnée');
      return;
    }
    if (window.confirm(`Êtes-vous sûr d'approuver ${selectedListings.size} annonces?`)) {
      // Approuver chaque listing
      for (const listingId of selectedListings) {
        await onApprove(listingId, '');
      }
      setSelectedListings(new Set());
    }
  };

  const handleBulkReject = async () => {
    if (selectedListings.size === 0) {
      alert('Aucune annonce sélectionnée');
      return;
    }
    alert('Rejet en masse: vous devez rejeter une par une pour spécifier les raisons');
  };

  if (loading && listings.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement des annonces en attente...</p>
      </div>
    );
  }

  return (
    <div className="approval-queue">
      {/* Error Alert */}
      {error && (
        <Alert variant="danger" onClose={() => {}} dismissible>
          <strong>Erreur:</strong> {error}
        </Alert>
      )}

      {/* Header */}
      <div className="queue-header mb-4">
        <h4>📋 File d'attente d'approbation</h4>
        <p className="text-muted">
          {filteredListings.length} annonce{filteredListings.length > 1 ? 's' : ''} en attente
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="filter-card mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            {/* Search */}
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher par titre, ville ou vendeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>

            {/* Type Filter */}
            <Col md={3}>
              <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">Tous les types</option>
                <option value="APPARTEMENT">Appartement</option>
                <option value="MAISON">Maison</option>
                <option value="TERRAIN">Terrain</option>
                <option value="BUREAU">Bureau</option>
                <option value="COMMERCE">Commerce</option>
              </Form.Select>
            </Col>

            {/* Sort */}
            <Col md={3}>
              <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date_desc">Plus récentes</option>
                <option value="date_asc">Plus anciennes</option>
                <option value="price_desc">Prix (plus haut)</option>
                <option value="price_asc">Prix (plus bas)</option>
              </Form.Select>
            </Col>

            {/* Refresh */}
            <Col md={1} className="text-end">
              <Button
                variant="outline-secondary"
                onClick={onRefresh}
                disabled={loading}
                title="Rafraîchir"
              >
                {loading ? <Spinner animation="border" size="sm" /> : <i className="bi bi-arrow-clockwise"></i>}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Bulk Actions */}
      {selectedListings.size > 0 && (
        <Card className="bulk-actions-card mb-4 bg-light border-info">
          <Card.Body className="py-3">
            <Row className="align-items-center">
              <Col md={6}>
                <strong>{selectedListings.size} sélectionnée{selectedListings.size > 1 ? 's' : ''}</strong>
              </Col>
              <Col md={6} className="text-end">
                <Button variant="success" size="sm" onClick={handleBulkApprove} className="me-2">
                  ✓ Approuver tout
                </Button>
                <Button variant="outline-danger" size="sm" onClick={handleBulkReject}>
                  ✗ Rejeter
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Select All Checkbox */}
      {filteredListings.length > 0 && (
        <div className="select-all-bar mb-3 p-2 bg-light rounded">
          <Form.Check
            type="checkbox"
            id="selectAll"
            label={`Sélectionner tout (${filteredListings.length})`}
            checked={selectedListings.size === filteredListings.length && filteredListings.length > 0}
            onChange={handleSelectAll}
          />
        </div>
      )}

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          Aucune annonce en attente d'approbation. Bien joué! 🎉
        </Alert>
      ) : (
        <div className="listings-container">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="listing-wrapper mb-3">
              <div className="select-checkbox">
                <Form.Check
                  type="checkbox"
                  id={`select-${listing.id}`}
                  checked={selectedListings.has(listing.id)}
                  onChange={() => handleSelectListing(listing.id)}
                />
              </div>
              <ApprovalCard
                listing={listing}
                onApprove={onApprove}
                onReject={onReject}
                onRemove={onRemove}
                loading={loading}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApprovalQueue;
