import '../styles/AlertesPage.css';
/**
 * Composant de gestion des alertes d'annonces
 * Permet aux utilisateurs de créer et gérer des alertes pour recevoir des notifications
 */

import React, { useEffect, useState } from 'react';
import { Button, Input, Card, Modal, Alert } from '@/components';
import { alertesApi } from '../services/api';

const AlertesAnnonces = () => {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal de création/édition
  const [openModal, setOpenModal] = useState(false);
  const [editingAlerte, setEditingAlerte] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    ville: '',
    code_postal: '',
    type_bien: '',
    prix_min: '',
    prix_max: '',
    surface_min: '',
    surface_max: '',
    nombre_pieces_min: '',
    nombre_pieces_max: '',
    dpe: '',
    ascenseur: false,
    balcon: false,
    terrasse: false,
    jardin: false,
    piscine: false,
    parking: false,
    frequence: 'quotidienne',
    email_notification: true,
  });

  // Charger les alertes
  const loadAlertes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await alertesApi.list(0, 100);
      setAlertes(response.data.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  // Charger les alertes au montage
  useEffect(() => {
    loadAlertes();
  }, []);

  // Ouvrir modal de création
  const handleOpenModalCreate = () => {
    setEditingAlerte(null);
    setFormData({
      nom: '',
      ville: '',
      code_postal: '',
      type_bien: '',
      prix_min: '',
      prix_max: '',
      surface_min: '',
      surface_max: '',
      nombre_pieces_min: '',
      nombre_pieces_max: '',
      dpe: '',
      ascenseur: false,
      balcon: false,
      terrasse: false,
      jardin: false,
      piscine: false,
      parking: false,
      frequence: 'quotidienne',
      email_notification: true,
    });
    setOpenModal(true);
  };

  // Ouvrir modal d'édition
  const handleOpenModalEdit = (alerte) => {
    setEditingAlerte(alerte);
    setFormData({
      nom: alerte.nom,
      ville: alerte.ville || '',
      code_postal: alerte.code_postal || '',
      type_bien: alerte.type_bien || '',
      prix_min: alerte.prix_min || '',
      prix_max: alerte.prix_max || '',
      surface_min: alerte.surface_min || '',
      surface_max: alerte.surface_max || '',
      nombre_pieces_min: alerte.nombre_pieces_min || '',
      nombre_pieces_max: alerte.nombre_pieces_max || '',
      dpe: alerte.dpe || '',
      ascenseur: alerte.ascenseur,
      balcon: alerte.balcon,
      terrasse: alerte.terrasse,
      jardin: alerte.jardin,
      piscine: alerte.piscine,
      parking: alerte.parking,
      frequence: alerte.frequence,
      email_notification: alerte.email_notification,
    });
    setOpenModal(true);
  };

  // Fermer modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingAlerte(null);
  };

  // Gérer les changements de formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Sauvegarder l'alerte
  const handleSaveAlerte = async () => {
    try {
      setLoading(true);

      if (editingAlerte) {
        // Mise à jour
        await alertesApi.update(editingAlerte.alerte_id, formData);
        setSuccessMessage('Alerte mise à jour avec succès!');
      } else {
        // Création
        await alertesApi.create(formData);
        setSuccessMessage('Alerte créée avec succès!');
      }

      handleCloseModal();
      loadAlertes();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une alerte
  const handleDeleteAlerte = async (alerteId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette alerte?')) return;

    try {
      setLoading(true);
      await alertesApi.delete(alerteId);
      setSuccessMessage('Alerte supprimée avec succès!');
      loadAlertes();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Basculer actif/inactif
  const handleToggleAlerte = async (alerteId) => {
    try {
      await alertesApi.toggle(alerteId);
      loadAlertes();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du basculement');
    }
  };

  return (
    <div className="alertes-page-container">
      {/* En-tête */}
      <div className="alertes-header">
        <div className="header-content">
          <div>🔔 Mes Alertes d'Annonces</div>
          <div className="alertes-subtitle">
            Recevez des notifications quand de nouvelles annonces correspondent à vos critères
          </div>
        </div>
        <Button variant="primary" onClick={handleOpenModalCreate}>
          ➕ Créer une alerte
        </Button>
      </div>

      {/* Messages */}
      {error && <Alert type="error" title="Erreur" message={error} />}
      {successMessage && (
        <Alert type="success" title="Succès" message={successMessage} />
      )}

      {/* Chargement */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      )}

      {/* Aucune alerte */}
      {!loading && alertes.length === 0 && (
        <Card className="empty-state">
          <div className="empty-content">
            <div>Aucune alerte créée</div>
            <div>
              Créez une alerte pour être notifié quand de nouvelles annonces correspondent
              à vos critères
            </div>
            <Button variant="primary" onClick={handleOpenModalCreate}>
              ➕ Créer votre première alerte
            </Button>
          </div>
        </Card>
      )}

      {/* Liste des alertes */}
      {!loading && alertes.length > 0 && (
        <div className="alertes-grid">
          {alertes.map((alerte) => (
            <Card key={alerte.alerte_id} className="alerte-card">
              <div className="alerte-card-header">
                <div>
                  <div>{alerte.nom}</div>
                  <div className={`alerte-status ${alerte.actif ? 'active' : 'inactive'}`}>
                    {alerte.actif ? '✓ Actif' : '✗ Inactif'}
                  </div>
                </div>
              </div>

              <div className="alerte-content">
                {/* Critères principaux */}
                <div className="alerte-criteria">
                  {alerte.type_bien && <div className="badge">{alerte.type_bien}</div>}
                  {alerte.ville && <div className="badge">📍 {alerte.ville}</div>}
                  {(alerte.prix_min || alerte.prix_max) && (
                    <div className="badge">
                      💰 {alerte.prix_min || '0'} - {alerte.prix_max || '∞'} €
                    </div>
                  )}
                  {(alerte.surface_min || alerte.surface_max) && (
                    <div className="badge">
                      📐 {alerte.surface_min || '0'} - {alerte.surface_max || '∞'} m²
                    </div>
                  )}
                </div>

                {/* Équipements */}
                {(alerte.ascenseur ||
                  alerte.balcon ||
                  alerte.terrasse ||
                  alerte.jardin ||
                  alerte.piscine ||
                  alerte.parking) && (
                  <div className="alerte-amenities">
                    <div className="amenities-label">Équipements:</div>
                    <div className="amenities-list">
                      {alerte.ascenseur && <div className="amenity">🛗</div>}
                      {alerte.balcon && <div className="amenity">🏠</div>}
                      {alerte.terrasse && <div className="amenity">🪴</div>}
                      {alerte.jardin && <div className="amenity">🌳</div>}
                      {alerte.piscine && <div className="amenity">🏊</div>}
                      {alerte.parking && <div className="amenity">🚗</div>}
                    </div>
                  </div>
                )}

                {/* Configuration */}
                <div className="alerte-config">
                  <div className="config-item">
                    <div className="config-label">Fréquence:</div>
                    <strong>{alerte.frequence}</strong>
                  </div>
                  {alerte.email_notification ? (
                    <div className="config-email active">✅ Notifications email</div>
                  ) : (
                    <div className="config-email inactive">Notifications email désactivées</div>
                  )}
                </div>
              </div>

              <div className="alerte-actions">
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => handleOpenModalEdit(alerte)}
                >
                  ✏️ Éditer
                </Button>
                <Button
                  size="small"
                  variant={alerte.actif ? 'secondary' : 'primary'}
                  onClick={() => handleToggleAlerte(alerte.alerte_id)}
                >
                  {alerte.actif ? '🔔 Désactiver' : '🔕 Activer'}
                </Button>
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => handleDeleteAlerte(alerte.alerte_id)}
                >
                  🗑️ Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création/édition */}
      {openModal && (
        <Modal onClose={handleCloseModal}>
          <div className="alerte-modal">
            <div>
              {editingAlerte ? '✏️ Modifier l\'alerte' : '🔔 Créer une alerte'}
            </div>

            <div className="modal-form">
              {/* Nom */}
              <Input
                label="Nom de l'alerte"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                placeholder="Ex: Appartement Paris 3p"
              />

              {/* Localisation */}
              <div className="form-row">
                <Input
                  label="Ville (optionnel)"
                  name="ville"
                  value={formData.ville}
                  onChange={handleInputChange}
                />
                <Input
                  label="Code postal (optionnel)"
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleInputChange}
                />
              </div>

              {/* Type */}
              <select
                name="type_bien"
                value={formData.type_bien}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">Type de bien (optionnel)</option>
                <option value="maison">Maison</option>
                <option value="appartement">Appartement</option>
                <option value="terrain">Terrain</option>
                <option value="local commercial">Local commercial</option>
              </select>

              {/* Prix */}
              <div className="form-row">
                <Input
                  type="number"
                  label="Prix min (€)"
                  name="prix_min"
                  value={formData.prix_min}
                  onChange={handleInputChange}
                />
                <Input
                  type="number"
                  label="Prix max (€)"
                  name="prix_max"
                  value={formData.prix_max}
                  onChange={handleInputChange}
                />
              </div>

              {/* Surface */}
              <div className="form-row">
                <Input
                  type="number"
                  label="Surface min (m²)"
                  name="surface_min"
                  value={formData.surface_min}
                  onChange={handleInputChange}
                />
                <Input
                  type="number"
                  label="Surface max (m²)"
                  name="surface_max"
                  value={formData.surface_max}
                  onChange={handleInputChange}
                />
              </div>

              {/* Pièces */}
              <div className="form-row">
                <Input
                  type="number"
                  label="Pièces min"
                  name="nombre_pieces_min"
                  value={formData.nombre_pieces_min}
                  onChange={handleInputChange}
                />
                <Input
                  type="number"
                  label="Pièces max"
                  name="nombre_pieces_max"
                  value={formData.nombre_pieces_max}
                  onChange={handleInputChange}
                />
              </div>

              {/* DPE */}
              <select
                name="dpe"
                value={formData.dpe}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">DPE (optionnel)</option>
                <option value="A">A (Excellent)</option>
                <option value="B">B (Très bon)</option>
                <option value="C">C (Bon)</option>
                <option value="D">D (Moyen)</option>
                <option value="E">E (Médiocre)</option>
                <option value="F">F (Très médiocre)</option>
                <option value="G">G (Très mauvais)</option>
              </select>

              {/* Équipements */}
              <div className="form-section">
                <label className="form-label">Équipements</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="ascenseur"
                      checked={formData.ascenseur}
                      onChange={handleInputChange}
                    />
                    Ascenseur
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="balcon"
                      checked={formData.balcon}
                      onChange={handleInputChange}
                    />
                    Balcon
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="terrasse"
                      checked={formData.terrasse}
                      onChange={handleInputChange}
                    />
                    Terrasse
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="jardin"
                      checked={formData.jardin}
                      onChange={handleInputChange}
                    />
                    Jardin
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="piscine"
                      checked={formData.piscine}
                      onChange={handleInputChange}
                    />
                    Piscine
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="parking"
                      checked={formData.parking}
                      onChange={handleInputChange}
                    />
                    Parking
                  </label>
                </div>
              </div>

              {/* Configuration */}
              <div className="form-row">
                <select
                  name="frequence"
                  value={formData.frequence}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="immediatement">Immédiatement</option>
                  <option value="quotidienne">Quotidienne</option>
                  <option value="hebdomadaire">Hebdomadaire</option>
                </select>

                <label className="checkbox-label full-width">
                  <input
                    type="checkbox"
                    name="email_notification"
                    checked={formData.email_notification}
                    onChange={handleInputChange}
                  />
                  Notifications email
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <Button onClick={handleCloseModal} variant="secondary">
                Annuler
              </Button>
              <Button
                onClick={handleSaveAlerte}
                variant="primary"
                disabled={loading}
              >
                {editingAlerte ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AlertesAnnonces;
