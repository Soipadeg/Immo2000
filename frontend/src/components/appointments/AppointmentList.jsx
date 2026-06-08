import React, { useState } from 'react';
import '../../styles/AppointmentList.css';

/**
 * Composant pour afficher la liste des rendez-vous avec filtres
 */
const AppointmentList = ({
  appointments,
  loading,
  updating,
  filters,
  onFilterChange,
  onReschedule,
  onCancel,
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const handleRescheduleSubmit = async () => {
    if (rescheduleModal && newDate && newTime) {
      const success = await onReschedule(rescheduleModal, newDate, newTime);
      if (success) {
        setRescheduleModal(null);
        setNewDate('');
        setNewTime('');
      }
    }
  };

  const handleCancelSubmit = async () => {
    if (cancelModal && cancelReason.trim()) {
      const success = await onCancel(cancelModal, cancelReason);
      if (success) {
        setCancelModal(null);
        setCancelReason('');
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'visite':
        return '🏠';
      case 'consultation':
        return '💬';
      case 'estimation':
        return '💰';
      case 'signature':
        return '✍️';
      default:
        return '📅';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      case 'rescheduled':
        return '#ffc107';
      default:
        return '#007bff';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'cancelled':
        return 'Annulé';
      case 'rescheduled':
        return 'Re-calendrisé';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="appointment-list-loading">Chargement de l'historique...</div>;
  }

  return (
    <div className="appointment-list-container">
      {/* Filtres */}
      <div className="appointment-filters">
        <div className="filter-group">
          <label htmlFor="filter-status">Statut:</label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="completed">Complétés</option>
            <option value="cancelled">Annulés</option>
            <option value="rescheduled">Re-calendrisés</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-type">Type:</label>
          <select
            id="filter-type"
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="visite">Visite</option>
            <option value="consultation">Consultation</option>
            <option value="estimation">Estimation</option>
            <option value="signature">Signature</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-from">Du:</label>
          <input
            id="filter-from"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-to">Au:</label>
          <input
            id="filter-to"
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-search">Recherche:</label>
          <input
            id="filter-search"
            type="text"
            placeholder="Propriété, participant..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Liste */}
      {appointments.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📭</p>
          <p className="empty-message">Aucun rendez-vous trouvé</p>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className={`appointment-item ${expandedId === appointment.id ? 'expanded' : ''}`}
            >
              <div
                className="appointment-header"
                onClick={() => setExpandedId(expandedId === appointment.id ? null : appointment.id)}
              >
                <div className="appointment-summary">
                  <span className="appointment-icon">{getTypeIcon(appointment.type)}</span>
                  <div className="appointment-info">
                    <h3 className="appointment-property">{appointment.property_name}</h3>
                    <p className="appointment-participant">
                      Avec {appointment.participant_name}
                    </p>
                  </div>
                </div>

                <div className="appointment-meta">
                  <span
                    className="appointment-status"
                    style={{ color: getStatusColor(appointment.status) }}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                  <span className="appointment-date">
                    {new Date(appointment.scheduled_date).toLocaleDateString()}
                  </span>
                  <button className="expand-btn">
                    {expandedId === appointment.id ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {expandedId === appointment.id && (
                <div className="appointment-details">
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Date & Heure:</label>
                      <p>{new Date(appointment.scheduled_date).toLocaleString()}</p>
                    </div>
                    <div className="detail-item">
                      <label>Durée:</label>
                      <p>{appointment.duration_minutes} minutes</p>
                    </div>
                    <div className="detail-item">
                      <label>Lieu:</label>
                      <p>{appointment.location}</p>
                    </div>
                    <div className="detail-item">
                      <label>Évaluation:</label>
                      <p>{'⭐'.repeat(appointment.feedback_rating)} ({appointment.feedback_rating}/5)</p>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="detail-notes">
                      <label>Notes:</label>
                      <p>{appointment.notes}</p>
                    </div>
                  )}

                  {appointment.status === 'cancelled' && appointment.cancellation_reason && (
                    <div className="detail-reason">
                      <label>Raison d'annulation:</label>
                      <p>{appointment.cancellation_reason}</p>
                    </div>
                  )}

                  {appointment.status !== 'cancelled' && (
                    <div className="appointment-actions">
                      <button
                        className="btn btn-warning"
                        onClick={() => setRescheduleModal(appointment.id)}
                        disabled={updating}
                      >
                        🔄 Re-calendriser
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setCancelModal(appointment.id)}
                        disabled={updating}
                      >
                        ❌ Annuler
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Re-calendrisation */}
      {rescheduleModal && (
        <div className="modal-overlay" onClick={() => setRescheduleModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Re-calendriser le Rendez-vous</h3>
              <button
                className="modal-close"
                onClick={() => setRescheduleModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="new-date">Nouvelle Date:</label>
                <input
                  id="new-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-time">Nouvelle Heure:</label>
                <input
                  id="new-time"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setRescheduleModal(null)}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRescheduleSubmit}
                disabled={updating}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Annulation */}
      {cancelModal && (
        <div className="modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Annuler le Rendez-vous</h3>
              <button
                className="modal-close"
                onClick={() => setCancelModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="cancel-reason">Raison d'annulation:</label>
                <textarea
                  id="cancel-reason"
                  rows="4"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous annulez ce rendez-vous..."
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setCancelModal(null)}
              >
                Garder
              </button>
              <button
                className="btn btn-danger"
                onClick={handleCancelSubmit}
                disabled={updating}
              >
                Annuler RDV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
