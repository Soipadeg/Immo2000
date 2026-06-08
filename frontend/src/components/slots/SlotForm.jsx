import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Button,
  Alert,
  Row,
  Col,
  ListGroup,
} from 'react-bootstrap';
import { generateTimeIntervals, checkOverlapHelper } from '../../utils/slotHelpers';

/**
 * SlotForm - Modal form for creating/editing appointment slots
 */
function SlotForm({ slot = null, onSave = () => {}, onCancel = () => {} }) {
  const [formData, setFormData] = useState({
    debut: '',
    fin: '',
    type_creneau: 'VISIT', // VISIT, CONSULTATION, OTHER
    remarques: '',
    recurrence: 'NONE', // NONE, DAILY, WEEKLY, MONTHLY
    recurrence_fin: '',
  });

  const [timeIntervals, setTimeIntervals] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);

  /**
   * Initialize form with slot data if editing
   */
  useEffect(() => {
    if (slot) {
      const debut = new Date(slot.debut);
      const fin = new Date(slot.fin);
      setFormData({
        debut: debut.toISOString().slice(0, 16),
        fin: fin.toISOString().slice(0, 16),
        type_creneau: slot.type_creneau || 'VISIT',
        remarques: slot.remarques || '',
        recurrence: 'NONE',
        recurrence_fin: '',
      });
    } else {
      // Set default times
      const now = new Date();
      const debut = new Date(now);
      debut.setHours(debut.getHours() + 1);
      debut.setMinutes(0);

      const fin = new Date(debut);
      fin.setHours(fin.getHours() + 1);

      setFormData({
        debut: debut.toISOString().slice(0, 16),
        fin: fin.toISOString().slice(0, 16),
        type_creneau: 'VISIT',
        remarques: '',
        recurrence: 'NONE',
        recurrence_fin: '',
      });
    }
  }, [slot]);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.debut) {
      newErrors.debut = 'La date/heure de début est requise';
    }
    if (!formData.fin) {
      newErrors.fin = 'La date/heure de fin est requise';
    }

    if (formData.debut && formData.fin) {
      const debutTime = new Date(formData.debut);
      const finTime = new Date(formData.fin);

      if (debutTime >= finTime) {
        newErrors.fin = 'La fin doit être après le début';
      }

      // Check for minimum duration (15 minutes)
      const diffMs = finTime - debutTime;
      const diffMin = diffMs / 1000 / 60;
      if (diffMin < 15) {
        newErrors.fin = 'La durée minimale est de 15 minutes';
      }
    }

    if (formData.recurrence !== 'NONE' && !formData.recurrence_fin) {
      newErrors.recurrence_fin = 'La date de fin de récurrence est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error('Error saving slot:', err);
      setErrors((prev) => ({
        ...prev,
        submit: err.message || 'Une erreur est survenue',
      }));
    } finally {
      setLoading(false);
    }
  };

  const typeCreneauOptions = [
    { value: 'VISIT', label: 'Visite Propriété' },
    { value: 'CONSULTATION', label: 'Consultation' },
    { value: 'MEETING', label: 'Réunion' },
    { value: 'OTHER', label: 'Autre' },
  ];

  const recurrenceOptions = [
    { value: 'NONE', label: 'Pas de récurrence' },
    { value: 'DAILY', label: 'Quotidiennement' },
    { value: 'WEEKLY', label: 'Hebdomadairement' },
    { value: 'MONTHLY', label: 'Mensuellement' },
  ];

  return (
    <Modal show={true} onHide={onCancel} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {slot ? 'Éditer le Créneau' : 'Créer un Nouveau Créneau'}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Submit Error */}
          {errors.submit && (
            <Alert variant="danger" onClose={() => setErrors((prev) => ({ ...prev, submit: '' }))} dismissible>
              {errors.submit}
            </Alert>
          )}

          <Row>
            {/* Start Date/Time */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Date et Heure de Début</strong>
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="debut"
                  value={formData.debut}
                  onChange={handleChange}
                  isInvalid={!!errors.debut}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.debut}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* End Date/Time */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Date et Heure de Fin</strong>
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fin"
                  value={formData.fin}
                  onChange={handleChange}
                  isInvalid={!!errors.fin}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.fin}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Duration Display */}
          {formData.debut && formData.fin && (
            <div className="mb-3 p-3 bg-light rounded">
              <small className="text-muted">
                <strong>Durée:</strong>{' '}
                {Math.round((new Date(formData.fin) - new Date(formData.debut)) / 1000 / 60)} minutes
              </small>
            </div>
          )}

          {/* Slot Type */}
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Type de Créneau</strong>
            </Form.Label>
            <Form.Select
              name="type_creneau"
              value={formData.type_creneau}
              onChange={handleChange}
            >
              {typeCreneauOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Remarks */}
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Remarques (optionnel)</strong>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="remarques"
              value={formData.remarques}
              onChange={handleChange}
              placeholder="Ajoutez des notes sur ce créneau..."
            />
          </Form.Group>

          {/* Recurrence Section */}
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Récurrence</strong>
            </Form.Label>
            <Form.Select
              name="recurrence"
              value={formData.recurrence}
              onChange={(e) => {
                handleChange(e);
                setShowRecurrence(e.target.value !== 'NONE');
              }}
            >
              {recurrenceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Créer le même créneau de manière récurrente
            </Form.Text>
          </Form.Group>

          {/* Recurrence End Date */}
          {showRecurrence && (
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Fin de Récurrence</strong>
              </Form.Label>
              <Form.Control
                type="date"
                name="recurrence_fin"
                value={formData.recurrence_fin}
                onChange={handleChange}
                isInvalid={!!errors.recurrence_fin}
              />
              <Form.Control.Feedback type="invalid">
                {errors.recurrence_fin}
              </Form.Control.Feedback>
            </Form.Group>
          )}

          {/* Info Box */}
          <div className="alert alert-info mb-0">
            <h6 className="mb-2">
              <i className="bi bi-info-circle me-2"></i>
              Informations Importantes
            </h6>
            <ListGroup variant="flush">
              <ListGroup.Item className="border-0 ps-0 pb-2">
                • Durée minimale: 15 minutes
              </ListGroup.Item>
              <ListGroup.Item className="border-0 ps-0 pb-2">
                • Durée maximale: 4 heures
              </ListGroup.Item>
              <ListGroup.Item className="border-0 ps-0">
                • Les créneaux passés sont automatiquement archivés
              </ListGroup.Item>
            </ListGroup>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Enregistrement...
              </>
            ) : slot ? (
              'Mettre à Jour'
            ) : (
              'Créer'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default SlotForm;
