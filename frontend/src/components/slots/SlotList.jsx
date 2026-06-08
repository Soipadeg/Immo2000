import React, { useState, useMemo } from 'react';
import {
  Table,
  Badge,
  Button,
  Form,
  Row,
  Col,
  Pagination,
  Dropdown,
} from 'react-bootstrap';

/**
 * SlotList - List view component for displaying appointment slots
 */
function SlotList({
  slots = [],
  filterStatus = 'all',
  onFilterChange = () => {},
  onEditSlot = () => {},
  onDeleteSlot = () => {},
  onMarkAvailable = () => {},
  onMarkReserved = () => {},
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('debut_asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlots, setSelectedSlots] = useState(new Set());

  const itemsPerPage = 10;

  /**
   * Format date time
   */
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'RESERVED':
        return 'warning';
      case 'EXPIRED':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  /**
   * Get status label
   */
  const getStatusLabel = (status) => {
    const labels = {
      AVAILABLE: 'Disponible',
      RESERVED: 'Réservé',
      EXPIRED: 'Expiré',
    };
    return labels[status] || status;
  };

  /**
   * Get type label
   */
  const getTypeLabel = (type) => {
    const labels = {
      VISIT: 'Visite',
      CONSULTATION: 'Consultation',
      MEETING: 'Réunion',
      OTHER: 'Autre',
    };
    return labels[type] || type;
  };

  /**
   * Filter and sort slots
   */
  const processedSlots = useMemo(() => {
    let filtered = slots;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((s) =>
        s.remarques?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.type_creneau?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aDate = new Date(a.debut);
      const bDate = new Date(b.debut);

      switch (sortBy) {
        case 'debut_asc':
          return aDate - bDate;
        case 'debut_desc':
          return bDate - aDate;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return aDate - bDate;
      }
    });

    return sorted;
  }, [slots, filterStatus, searchQuery, sortBy]);

  /**
   * Pagination
   */
  const totalPages = Math.ceil(processedSlots.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedSlots = processedSlots.slice(startIdx, startIdx + itemsPerPage);

  /**
   * Handle select all
   */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSlots(new Set(paginatedSlots.map((s) => s.id)));
    } else {
      setSelectedSlots(new Set());
    }
  };

  /**
   * Handle select single
   */
  const handleSelectSlot = (slotId) => {
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(slotId)) {
      newSelected.delete(slotId);
    } else {
      newSelected.add(slotId);
    }
    setSelectedSlots(newSelected);
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = () => {
    if (selectedSlots.size === 0) return;
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedSlots.size} créneau(x)?`)) {
      selectedSlots.forEach((slotId) => onDeleteSlot(slotId));
      setSelectedSlots(new Set());
    }
  };

  /**
   * Handle bulk mark available
   */
  const handleBulkMarkAvailable = () => {
    if (selectedSlots.size === 0) return;
    selectedSlots.forEach((slotId) => onMarkAvailable(slotId));
    setSelectedSlots(new Set());
  };

  /**
   * Handle bulk mark reserved
   */
  const handleBulkMarkReserved = () => {
    if (selectedSlots.size === 0) return;
    selectedSlots.forEach((slotId) => onMarkReserved(slotId));
    setSelectedSlots(new Set());
  };

  return (
    <div className="slot-list">
      {/* Search and Filter Bar */}
      <Row className="mb-4 g-3">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Rechercher dans les créneaux..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="debut_asc">Date ascendante</option>
            <option value="debut_desc">Date descendante</option>
            <option value="status">Statut</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => {
              onFilterChange(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Tous les créneaux</option>
            <option value="AVAILABLE">Disponibles</option>
            <option value="RESERVED">Réservés</option>
            <option value="EXPIRED">Expirés</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Bulk Actions */}
      {selectedSlots.size > 0 && (
        <div className="mb-3 p-3 bg-light rounded d-flex justify-content-between align-items-center">
          <span>
            <strong>{selectedSlots.size}</strong> créneau(x) sélectionné(s)
          </span>
          <div>
            <Button
              variant="outline-success"
              size="sm"
              onClick={handleBulkMarkAvailable}
              className="me-2"
            >
              <i className="bi bi-check-circle me-1"></i>
              Marquer Disponible
            </Button>
            <Button
              variant="outline-warning"
              size="sm"
              onClick={handleBulkMarkReserved}
              className="me-2"
            >
              <i className="bi bi-lock me-1"></i>
              Marquer Réservé
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleBulkDelete}
            >
              <i className="bi bi-trash me-1"></i>
              Supprimer
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {paginatedSlots.length > 0 ? (
        <>
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th width="40">
                    <Form.Check
                      type="checkbox"
                      checked={selectedSlots.size === paginatedSlots.length && paginatedSlots.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Remarques</th>
                  <th width="150">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSlots.map((slot) => (
                  <tr key={slot.id}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedSlots.has(slot.id)}
                        onChange={() => handleSelectSlot(slot.id)}
                      />
                    </td>
                    <td>
                      <small>{formatDateTime(slot.debut)}</small>
                    </td>
                    <td>
                      <small>{formatDateTime(slot.fin)}</small>
                    </td>
                    <td>
                      <small>{getTypeLabel(slot.type_creneau)}</small>
                    </td>
                    <td>
                      <Badge bg={getStatusColor(slot.status)}>
                        {getStatusLabel(slot.status)}
                      </Badge>
                    </td>
                    <td>
                      <small>{slot.remarques || '-'}</small>
                    </td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="link" size="sm" className="text-decoration-none">
                          <i className="bi bi-three-dots-vertical"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => onEditSlot(slot)}>
                            <i className="bi bi-pencil me-2"></i>
                            Éditer
                          </Dropdown.Item>
                          {slot.status === 'AVAILABLE' && (
                            <Dropdown.Item onClick={() => onMarkReserved(slot.id)}>
                              <i className="bi bi-lock me-2"></i>
                              Marquer Réservé
                            </Dropdown.Item>
                          )}
                          {slot.status === 'RESERVED' && (
                            <Dropdown.Item onClick={() => onMarkAvailable(slot.id)}>
                              <i className="bi bi-check-circle me-2"></i>
                              Marquer Disponible
                            </Dropdown.Item>
                          )}
                          <Dropdown.Divider />
                          <Dropdown.Item
                            onClick={() => onDeleteSlot(slot.id)}
                            className="text-danger"
                          >
                            <i className="bi bi-trash me-2"></i>
                            Supprimer
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-3 d-flex justify-content-center">
              <Pagination>
                <Pagination.First
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-5">
          <i className="bi bi-inbox display-1 text-muted mb-3"></i>
          <p className="text-muted">Aucun créneau trouvé</p>
        </div>
      )}
    </div>
  );
}

export default SlotList;
