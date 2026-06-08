import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Button,
  Spinner,
  Alert,
} from 'react-bootstrap';
import { useSlots } from '../hooks/useSlots';
import SlotCalendar from '../components/slots/SlotCalendar';
import SlotList from '../components/slots/SlotList';
import SlotForm from '../components/slots/SlotForm';
import { formatDate } from '../utils/slotHelpers';

/**
 * SlotManagementPage - Main page for managing appointment time slots
 * Displays:
 * - Calendar view of available/reserved slots
 * - List view with filtering/sorting
 * - Form to create/edit/delete slots
 */
function SlotManagementPage() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [showForm, setShowForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, available, reserved
  const [selectedDate, setSelectedDate] = useState(new Date());

  const {
    slots,
    loading,
    error,
    createSlot,
    updateSlot,
    deleteSlot,
    markAvailable,
    markReserved,
  } = useSlots();

  /**
   * Handle create/update slot
   */
  const handleSaveSlot = useCallback(
    async (slotData) => {
      try {
        if (selectedSlot) {
          await updateSlot(selectedSlot.id, slotData);
        } else {
          await createSlot(slotData);
        }
        setShowForm(false);
        setSelectedSlot(null);
      } catch (err) {
        console.error('Error saving slot:', err);
      }
    },
    [selectedSlot, createSlot, updateSlot]
  );

  /**
   * Handle delete slot
   */
  const handleDeleteSlot = useCallback(
    async (slotId) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau?')) {
        try {
          await deleteSlot(slotId);
        } catch (err) {
          console.error('Error deleting slot:', err);
        }
      }
    },
    [deleteSlot]
  );

  /**
   * Handle mark as available
   */
  const handleMarkAvailable = useCallback(
    async (slotId) => {
      try {
        await markAvailable(slotId);
      } catch (err) {
        console.error('Error marking slot available:', err);
      }
    },
    [markAvailable]
  );

  /**
   * Handle mark as reserved
   */
  const handleMarkReserved = useCallback(
    async (slotId) => {
      try {
        await markReserved(slotId);
      } catch (err) {
        console.error('Error marking slot reserved:', err);
      }
    },
    [markReserved]
  );

  /**
   * Handle edit slot
   */
  const handleEditSlot = useCallback((slot) => {
    setSelectedSlot(slot);
    setShowForm(true);
  }, []);

  /**
   * Handle new slot
   */
  const handleNewSlot = useCallback(() => {
    setSelectedSlot(null);
    setShowForm(true);
  }, []);

  /**
   * Filter slots by status
   */
  const filteredSlots = slots.filter((slot) => {
    if (filterStatus === 'available') {
      return slot.status === 'AVAILABLE';
    }
    if (filterStatus === 'reserved') {
      return slot.status === 'RESERVED';
    }
    return true;
  });

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement des créneaux...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col md={8}>
          <h1 className="mb-0">
            <i className="bi bi-calendar-event me-2"></i>
            Gestion des Créneaux
          </h1>
          <p className="text-muted mt-2">
            Gérez vos créneaux disponibles pour les rendez-vous
          </p>
        </Col>
        <Col md={4} className="text-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleNewSlot}
            className="me-2"
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nouveau Créneau
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer me-2"></i>
            Imprimer
          </Button>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" onClose={() => {}} dismissible>
          <strong>Erreur:</strong> {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="display-6 text-primary">
                {slots.length}
              </div>
              <p className="text-muted mb-0">Total créneaux</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="display-6 text-success">
                {slots.filter((s) => s.status === 'AVAILABLE').length}
              </div>
              <p className="text-muted mb-0">Disponibles</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="display-6 text-warning">
                {slots.filter((s) => s.status === 'RESERVED').length}
              </div>
              <p className="text-muted mb-0">Réservés</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="display-6 text-danger">
                {slots.filter((s) => new Date(s.fin) < new Date()).length}
              </div>
              <p className="text-muted mb-0">Expirés</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs Content */}
      <Card className="border-0 shadow">
        <Card.Header className="bg-white border-bottom">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="nav-tabs"
          >
            <Tab eventKey="calendar" title="Vue Calendrier">
              <div className="p-3">Calendrier</div>
            </Tab>
            <Tab eventKey="list" title="Vue Liste">
              <div className="p-3">Liste</div>
            </Tab>
          </Tabs>
        </Card.Header>
        <Card.Body>
          {activeTab === 'calendar' && (
            <SlotCalendar
              slots={filteredSlots}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onEditSlot={handleEditSlot}
              onDeleteSlot={handleDeleteSlot}
              onMarkAvailable={handleMarkAvailable}
              onMarkReserved={handleMarkReserved}
            />
          )}

          {activeTab === 'list' && (
            <SlotList
              slots={filteredSlots}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              onEditSlot={handleEditSlot}
              onDeleteSlot={handleDeleteSlot}
              onMarkAvailable={handleMarkAvailable}
              onMarkReserved={handleMarkReserved}
            />
          )}
        </Card.Body>
      </Card>

      {/* Slot Form Modal */}
      {showForm && (
        <SlotForm
          slot={selectedSlot}
          onSave={handleSaveSlot}
          onCancel={() => {
            setShowForm(false);
            setSelectedSlot(null);
          }}
        />
      )}
    </Container>
  );
}

export default SlotManagementPage;
