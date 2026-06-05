import React, { useState, useCallback } from 'react';
import { Card, Button, Badge, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import './SlotCalendar.scss';

/**
 * SlotCalendar - Calendar component for displaying and managing appointment slots
 * Shows a monthly grid with visual indicators for available/reserved slots
 */
function SlotCalendar({
  slots = [],
  selectedDate = new Date(),
  onSelectDate = () => {},
  onEditSlot = () => {},
  onDeleteSlot = () => {},
  onMarkAvailable = () => {},
  onMarkReserved = () => {},
}) {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [showSlotDetails, setShowSlotDetails] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  /**
   * Get days in month
   */
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  /**
   * Get first day of month (0 = Sunday, 6 = Saturday)
   */
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  /**
   * Get slots for a specific date
   */
  const getSlotsForDate = (date) => {
    return slots.filter((slot) => {
      const slotDate = new Date(slot.debut).toDateString();
      const compareDate = new Date(date).toDateString();
      return slotDate === compareDate;
    });
  };

  /**
   * Navigate to previous month
   */
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  }, [currentDate]);

  /**
   * Navigate to next month
   */
  const handleNextMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  }, [currentDate]);

  /**
   * Handle slot click
   */
  const handleSlotClick = useCallback((slot) => {
    setSelectedSlot(slot);
    setShowSlotDetails(true);
  }, []);

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
   * Format time
   */
  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  // Create array of days to display
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null); // Empty cells for days from previous month
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="slot-calendar">
      {/* Header */}
      <div className="calendar-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h3 className="mb-0">
              {monthNames[month]} {year}
            </h3>
          </div>
          <div className="btn-group" role="group">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handlePrevMonth}
            >
              <i className="bi bi-chevron-left"></i> Précédent
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleNextMonth}
            >
              Suivant <i className="bi bi-chevron-right"></i>
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="btn-group mt-3" role="group">
          <Button
            variant={viewMode === 'month' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Mois
          </Button>
          <Button
            variant={viewMode === 'week' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Semaine
          </Button>
          <Button
            variant={viewMode === 'day' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Jour
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' && (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            {/* Day names header */}
            <div className="calendar-grid">
              {dayNames.map((day) => (
                <div key={day} className="calendar-dayname">
                  <strong>{day}</strong>
                </div>
              ))}

              {/* Days */}
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                }

                const dateObj = new Date(year, month, day);
                const daySlots = getSlotsForDate(dateObj);
                const hasSlots = daySlots.length > 0;
                const availableCount = daySlots.filter((s) => s.status === 'AVAILABLE').length;
                const reservedCount = daySlots.filter((s) => s.status === 'RESERVED').length;

                return (
                  <div
                    key={day}
                    className={`calendar-day ${hasSlots ? 'has-slots' : ''}`}
                    onClick={() => onSelectDate(dateObj)}
                  >
                    <div className="day-number">{day}</div>
                    {hasSlots && (
                      <div className="slot-indicators">
                        {availableCount > 0 && (
                          <Badge bg="success" pill className="me-1">
                            {availableCount}
                          </Badge>
                        )}
                        {reservedCount > 0 && (
                          <Badge bg="warning" pill>
                            {reservedCount}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Slots for selected day */}
      {getSlotsForDate(currentDate).length > 0 && (
        <div className="mt-4">
          <h5 className="mb-3">
            Créneaux du {currentDate.toLocaleDateString('fr-FR')}
          </h5>
          <div className="slots-list">
            {getSlotsForDate(currentDate).map((slot) => (
              <Card key={slot.id} className="mb-2 cursor-pointer slot-card">
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <div>
                      <strong>
                        {formatTime(slot.debut)} - {formatTime(slot.fin)}
                      </strong>
                    </div>
                    <Badge bg={getStatusColor(slot.status)}>
                      {getStatusLabel(slot.status)}
                    </Badge>
                  </div>
                  <div className="slot-actions">
                    <Button
                      variant="sm"
                      outline="true"
                      className="me-2"
                      onClick={() => handleSlotClick(slot)}
                    >
                      <i className="bi bi-eye"></i> Voir
                    </Button>
                    <Button
                      variant="sm"
                      outline="true"
                      className="me-2"
                      onClick={() => onEditSlot(slot)}
                    >
                      <i className="bi bi-pencil"></i> Éditer
                    </Button>
                    <Button
                      variant="sm"
                      outline="true"
                      variant="danger"
                      onClick={() => onDeleteSlot(slot.id)}
                    >
                      <i className="bi bi-trash"></i> Supprimer
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Slot Details Modal */}
      <Modal show={showSlotDetails} onHide={() => setShowSlotDetails(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Détails du Créneau</Modal.Title>
        </Modal.Header>
        {selectedSlot && (
          <Modal.Body>
            <div className="mb-3">
              <label className="form-label">
                <strong>Horaire</strong>
              </label>
              <p>
                {formatTime(selectedSlot.debut)} - {formatTime(selectedSlot.fin)}
              </p>
            </div>
            <div className="mb-3">
              <label className="form-label">
                <strong>Statut</strong>
              </label>
              <p>
                <Badge bg={getStatusColor(selectedSlot.status)}>
                  {getStatusLabel(selectedSlot.status)}
                </Badge>
              </p>
            </div>
            <div className="mb-3">
              <label className="form-label">
                <strong>Date de création</strong>
              </label>
              <p>
                {new Date(selectedSlot.cree_a).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSlotDetails(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default SlotCalendar;
