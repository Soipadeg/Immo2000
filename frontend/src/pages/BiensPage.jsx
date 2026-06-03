import '../styles/BiensPage.css';
/**
 * Page de gestion des biens immobiliers
 * Créer et lister les propriétés
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Card, Modal, Alert, FormContainer } from '@/components';
import { biensApi } from '../services/api';
import ImageUploadComponent from '../components/ImageUpload';
import ImageGalleryComponent from '../components/ImageGallery';

const LIMIT = 10;

const BiensPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);

  // État pour la création
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // État pour l'édition
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBien, setSelectedBien] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    adresse: '',
    ville: '',
    code_postal: '',
    type_bien: 'appartement',
    surface: '',
    nombre_pieces: '',
    prix: '',
    description: '',
    latitude: '',
    longitude: '',
  });

  // État pour l'upload d'images
  const [imageUploadDialogOpen, setImageUploadDialogOpen] = useState(false);
  const [selectedBienId, setSelectedBienId] = useState(null);

  const [formData, setFormData] = useState({
    adresse: '',
    ville: '',
    code_postal: '',
    type_bien: 'appartement',
    surface: '',
    nombre_pieces: '',
    prix: '',
    description: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    if (tabValue === 0) {
      loadMyBiens();
    } else if (tabValue === 1) {
      loadStats();
    }
  }, [tabValue, page]);

  const loadMyBiens = async () => {
    setLoading(true);
    setError('');
    try {
      const skip = (page - 1) * LIMIT;
      const response = await biensApi.listMyBiens(skip, LIMIT);
      setBiens(response.data.biens || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await biensApi.getStats();
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des stats');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateBien = async () => {
    setCreateLoading(true);
    setError('');

    try {
      if (
        !formData.adresse ||
        !formData.ville ||
        !formData.surface ||
        !formData.type_bien
      ) {
        setError('Veuillez remplir tous les champs requis');
        setCreateLoading(false);
        return;
      }

      const payload = {
        ...formData,
        surface: parseFloat(formData.surface),
        nombre_pieces: formData.nombre_pieces
          ? parseInt(formData.nombre_pieces)
          : null,
        prix: formData.prix ? parseFloat(formData.prix) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude
          ? parseFloat(formData.longitude)
          : null,
      };

      await biensApi.create(payload);

      setSuccess('Bien créé avec succès !');
      setCreateDialogOpen(false);
      setFormData({
        adresse: '',
        ville: '',
        code_postal: '',
        type_bien: 'appartement',
        surface: '',
        nombre_pieces: '',
        prix: '',
        description: '',
        latitude: '',
        longitude: '',
      });

      loadMyBiens();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditBien = (bien) => {
    setSelectedBien(bien);
    setEditFormData({
      adresse: bien.adresse || '',
      ville: bien.ville || '',
      code_postal: bien.code_postal || '',
      type_bien: bien.type_bien || 'appartement',
      surface: bien.surface?.toString() || '',
      nombre_pieces: bien.nombre_pieces?.toString() || '',
      prix: bien.prix?.toString() || '',
      description: bien.description || '',
      latitude: bien.latitude?.toString() || '',
      longitude: bien.longitude?.toString() || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveBien = async () => {
    setEditLoading(true);
    setError('');

    try {
      if (!editFormData.adresse || !editFormData.ville || !editFormData.surface) {
        setError('Veuillez remplir tous les champs requis');
        setEditLoading(false);
        return;
      }

      const payload = {
        ...editFormData,
        surface: parseFloat(editFormData.surface),
        nombre_pieces: editFormData.nombre_pieces
          ? parseInt(editFormData.nombre_pieces)
          : null,
        prix: editFormData.prix ? parseFloat(editFormData.prix) : null,
        latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : null,
        longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : null,
      };

      await biensApi.update(selectedBien.bien_id, payload);

      setSuccess('Bien modifié avec succès !');
      setEditDialogOpen(false);
      loadMyBiens();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la modification');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteBien = async (bienId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) {
      return;
    }

    setError('');
    try {
      await biensApi.delete(bienId);
      setSuccess('Bien supprimé avec succès !');
      loadMyBiens();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="biens-page-container">
      <div className="biens-header">
        <div>🏠 Gestion de mes Biens</div>
      </div>

      {error && <Alert type="error" title="Erreur" message={error} />}
      {success && <Alert type="success" title="Succès" message={success} />}

      {/* Tabs */}
      <div className="biens-tabs">
        <button
          className={`tab-button ${tabValue === 0 ? 'active' : ''}`}
          onClick={() => setTabValue(0)}
        >
          Mes propriétés
        </button>
        <button
          className={`tab-button ${tabValue === 1 ? 'active' : ''}`}
          onClick={() => setTabValue(1)}
        >
          Statistiques
        </button>
      </div>

      {/* Onglet 1: Mes propriétés */}
      {tabValue === 0 && (
        <div className="biens-content">
          <Button
            variant="primary"
            onClick={() => setCreateDialogOpen(true)}
            className="create-button"
          >
            ➕ Ajouter une propriété
          </Button>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : biens.length === 0 ? (
            <Card className="empty-state">
              <div>Aucune propriété pour le moment</div>
            </Card>
          ) : (
            <>
              <div className="biens-grid">
                {biens.map((bien) => (
                  <Card key={bien.bien_id} className="bien-card">
                    <div className="bien-image">
                      <ImageGalleryComponent
                        annonceId={bien.bien_id}
                        onDelete={() => loadMyBiens()}
                      />
                    </div>

                    <div className="bien-content">
                      <div>{bien.adresse}</div>
                      <div className="bien-city">
                        {bien.code_postal} {bien.ville}
                      </div>

                      <div className="bien-type-badge">{bien.type_bien}</div>

                      <div className="bien-specs">
                        <strong>{bien.surface}m²</strong>
                        {bien.nombre_pieces && ` • ${bien.nombre_pieces} pièces`}
                      </div>

                      {bien.prix && (
                        <div className="bien-price">
                          {formatPrice(bien.prix)}
                        </div>
                      )}

                      {bien.description && (
                        <div className="bien-description">
                          {bien.description.substring(0, 100)}...
                        </div>
                      )}
                    </div>

                    <div className="bien-actions">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          setSelectedBienId(bien.bien_id);
                          setImageUploadDialogOpen(true);
                        }}
                      >
                        📸 Photos
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => handleEditBien(bien)}
                      >
                        ✏️ Modifier
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => handleDeleteBien(bien.bien_id)}
                      >
                        🗑️ Supprimer
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="pagination-container">
                <div className="pagination">
                  {page > 1 && (
                    <button
                      className="pagination-button"
                      onClick={() => setPage(page - 1)}
                    >
                      ← Précédent
                    </button>
                  )}
                  <div className="pagination-info">Page {page}</div>
                  {biens.length === LIMIT && (
                    <button
                      className="pagination-button"
                      onClick={() => setPage(page + 1)}
                    >
                      Suivant →
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Onglet 2: Statistiques */}
      {tabValue === 1 && (
        <div className="stats-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : stats ? (
            <div className="stats-grid">
              <Card className="stat-card">
                <div className="stat-label">Total de Biens</div>
                <div className="stat-value">{stats.total_biens || 0}</div>
              </Card>
              <Card className="stat-card">
                <div className="stat-label">Surface Totale</div>
                <div className="stat-value">{stats.surface_totale || 0}m²</div>
              </Card>
              <Card className="stat-card">
                <div className="stat-label">Valeur Totale</div>
                <div className="stat-value">{formatPrice(stats.valeur_totale || 0)}</div>
              </Card>
              <Card className="stat-card">
                <div className="stat-label">Prix Moyen/m²</div>
                <div className="stat-value">{formatPrice(stats.prix_moyen_m2 || 0)}</div>
              </Card>
            </div>
          ) : (
            <Card className="empty-state">
              <div>Aucune données statistiques disponibles</div>
            </Card>
          )}
        </div>
      )}

      {/* Modal de création */}
      {createDialogOpen && (
        <Modal onClose={() => setCreateDialogOpen(false)}>
          <div className="dialog-content">
            <div>Créer une nouvelle propriété</div>
            <div className="form-fields">
              <Input
                label="Adresse *"
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Ville *"
                name="ville"
                value={formData.ville}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Code postal"
                name="code_postal"
                value={formData.code_postal}
                onChange={handleInputChange}
              />
              <select
                name="type_bien"
                value={formData.type_bien}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="terrain">Terrain</option>
                <option value="commerce">Commerce</option>
                <option value="bureau">Bureau</option>
              </select>
              <Input
                label="Surface (m²) *"
                name="surface"
                type="number"
                value={formData.surface}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Nombre de pièces"
                name="nombre_pieces"
                type="number"
                value={formData.nombre_pieces}
                onChange={handleInputChange}
              />
              <Input
                label="Prix"
                name="prix"
                type="number"
                value={formData.prix}
                onChange={handleInputChange}
              />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description"
                className="form-textarea"
              />
            </div>
            <div className="dialog-actions">
              <Button onClick={() => setCreateDialogOpen(false)} variant="secondary">
                Annuler
              </Button>
              <Button
                onClick={handleCreateBien}
                variant="primary"
                disabled={createLoading}
              >
                {createLoading ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal d'édition */}
      {editDialogOpen && (
        <Modal onClose={() => setEditDialogOpen(false)}>
          <div className="dialog-content">
            <div>Modifier la propriété</div>
            <div className="form-fields">
              <Input
                label="Adresse *"
                name="adresse"
                value={editFormData.adresse}
                onChange={handleEditInputChange}
                required
              />
              <Input
                label="Ville *"
                name="ville"
                value={editFormData.ville}
                onChange={handleEditInputChange}
                required
              />
              <Input
                label="Code postal"
                name="code_postal"
                value={editFormData.code_postal}
                onChange={handleEditInputChange}
              />
              <select
                name="type_bien"
                value={editFormData.type_bien}
                onChange={handleEditInputChange}
                className="form-select"
              >
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="terrain">Terrain</option>
                <option value="local_commercial">Local commercial</option>
              </select>
              <Input
                label="Surface (m²) *"
                name="surface"
                type="number"
                value={editFormData.surface}
                onChange={handleEditInputChange}
                required
              />
              <Input
                label="Nombre de pièces"
                name="nombre_pieces"
                type="number"
                value={editFormData.nombre_pieces}
                onChange={handleEditInputChange}
              />
              <Input
                label="Prix (€)"
                name="prix"
                type="number"
                value={editFormData.prix}
                onChange={handleEditInputChange}
              />
              <textarea
                name="description"
                value={editFormData.description}
                onChange={handleEditInputChange}
                placeholder="Description"
                className="form-textarea"
              />
            </div>
            <div className="dialog-actions">
              <Button onClick={() => setEditDialogOpen(false)} variant="secondary">
                Annuler
              </Button>
              <Button
                onClick={handleSaveBien}
                variant="primary"
                disabled={editLoading}
              >
                {editLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal pour uploader les images */}
      {imageUploadDialogOpen && (
        <Modal onClose={() => setImageUploadDialogOpen(false)}>
          <div className="dialog-content">
            <div>📸 Ajouter des photos à la propriété</div>
            {selectedBienId && (
              <ImageUploadComponent
                annonceId={selectedBienId}
                onUploadSuccess={() => {
                  setSuccess('Images uploadées avec succès !');
                  setImageUploadDialogOpen(false);
                  loadMyBiens();
                  setTimeout(() => setSuccess(''), 3000);
                }}
              />
            )}
            <div className="dialog-actions">
              <Button
                onClick={() => setImageUploadDialogOpen(false)}
                variant="secondary"
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BiensPage;
