import '../styles/VisitesPage.css';
import { Alert,Button,Input } from '@/components';
/**
 * Page de gestion des visites
 * Permettre de planifier une visite et voir l'historique
 */

import React, { useState, useEffect } from 'react';
import { visitesApi } from '../services/api';
import {
  FeedbackSubmitForm,
  FeedbacksList,
} from '../components/FeedbackComponent';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';





const VisitesPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [visites, setVisites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const userRole = localStorage.getItem('user_role');

  // État pour la planification
  const [annonceId, setAnnonceId] = useState('');
  const [dateHeure, setDateHeure] = useState('');
  const [notes, setNotes] = useState('');
  const [planning, setPlanning] = useState(false);

  // État pour l'édition
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVisite, setSelectedVisite] = useState(null);
  const [editDateHeure, setEditDateHeure] = useState('');

  // Charger les visites
  useEffect(() => {
    loadVisites();
  }, []);

  const loadVisites = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await visitesApi.listAll(0, 100);
      setVisites(response.data.visites || response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des visites');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleVisite = async (e) => {
    e.preventDefault();
    if (!annonceId || !dateHeure) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    setPlanning(true);
    try {
      const response = await visitesApi.create({
        annonce_id: parseInt(annonceId),
        date_heure: dateHeure,
        notes: notes || null,
      });

      setSuccess('Visite planifiée avec succès !');
      setAnnonceId('');
      setDateHeure('');
      setNotes('');
      loadVisites();

      // Enlever le message après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la planification');
    } finally {
      setPlanning(false);
    }
  };

  const handleDeleteVisite = async (visiteId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette visite ?')) {
      return;
    }

    try {
      await visitesApi.delete(visiteId);
      setSuccess('Visite annulée avec succès');
      loadVisites();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'annulation');
    }
  };

  const handleUpdateVisite = async () => {
    if (!selectedVisite || !editDateHeure) {
      setError('Veuillez sélectionner une date');
      return;
    }

    try {
      await visitesApi.update(selectedVisite.visite_id, {
        date_heure: editDateHeure,
      });

      setSuccess('Visite modifiée avec succès');
      setEditDialogOpen(false);
      loadVisites();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la modification');
    }
  };

  const handleDownloadICS = (visiteId) => {
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}/visites/${visiteId}/download.ics`;
    link.download = `visite-${visiteId}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatutColor = (statut) => {
    const colors = {
      'planifiée': 'info',
      'complétée': 'success',
      'annulée': 'error',
    };
    return colors[statut] || 'default';
  };

  return (
    <div maxWidth="lg">
      <div>
        📅 Gestion des Visites
      </div>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
        <Tab label="Planifier une visite" />
        <Tab label="Mes visites" />
        <Tab label="Feedbacks" />
      </Tabs>

      {tabValue === 0 && (
        <div>
          <div>
            Planifier une nouvelle visite
          </div>
          <div component="form" onSubmit={handleScheduleVisite}>
            <div container spacing={2}>
              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="ID de l'annonce"
                  type="number"
                  value={annonceId}
                  onChange={(e) => setAnnonceId(e.target.value)}
                  required
                  inputProps={{ min: 1 }}
                />
              </div>
              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="Date et heure"
                  type="datetime-local"
                  value={dateHeure}
                  onChange={(e) => setDateHeure(e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </div>
              <div item xs={12}>
                <Input
                  fullWidth
                  label="Notes (optionnel)"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des notes sur la visite..."
                />
              </div>
              <div item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={planning}
                >
                  {planning ? <div size={24} /> : 'Planifier la visite'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tabValue === 1 && (
        <div>
          {loading ? (
            <div>
              <div />
            </div>
          ) : visites.length === 0 ? (
            <div>
              <div>
                Aucune visite planifiée pour le moment
              </div>
            </div>
          ) : (
            <div container spacing={2}>
              {visites.map((visite) => (
                <div item xs={12} sm={6} md={4} key={visite.visite_id}>
                  <div>
                    <div>
                      <div>
                        Annonce #{visite.annonce_id}
                      </div>
                      <div>
                        📅 {new Date(visite.date_heure).toLocaleString('fr-FR')}
                      </div>
                      <div
                        label={visite.statut}
                        color={getStatutColor(visite.statut)}
                        size="small"
                      />
                      {visite.notes && (
                        <div>
                          <strong>Notes:</strong> {visite.notes}
                        </div>
                      )}
                    </div>
                    <div>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadICS(visite.visite_id)}
                      >
                        ICS
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setSelectedVisite(visite);
                          setEditDateHeure(visite.date_heure);
                          setEditDialogOpen(true);
                        }}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteVisite(visite.visite_id)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet 3: Feedbacks */}
      {tabValue === 2 && (
        <div>
          {userRole === 'vendeur' ? (
            <div>
              <div>
                ⭐ Feedbacks reçus des acheteurs
              </div>
              <FeedbacksList />
            </div>
          ) : (
            <div>
              <div>
                Vos feedbacks
              </div>
              {loading ? (
                <div>
                  <div />
                </div>
              ) : visites.length === 0 ? (
                <div>
                  <div>
                    Aucune visite complétée pour le moment
                  </div>
                </div>
              ) : (
                <div container spacing={2}>
                  {visites
                    .filter((v) => v.statut === 'complétée')
                    .map((visite) => (
                      <div item xs={12} key={visite.visite_id}>
                        <div>
                          <div>
                            <div>
                              Visite - Annonce #{visite.annonce_id}
                            </div>
                            <div>
                              📅 {new Date(visite.date_heure).toLocaleString('fr-FR')}
                            </div>

                            {/* Formulaire de feedback */}
                            <div>
                              <FeedbackSubmitForm
                                visiteId={visite.visite_id}
                                onSuccess={() => {
                                  setSuccess('Feedback soumis avec succès !');
                                  setTimeout(() => setSuccess(''), 3000);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dialog d'édition */}
      <div open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <div>Modifier la date et heure</div>
        <div>
          <Input
            fullWidth
            label="Date et heure"
            type="datetime-local"
            value={editDateHeure}
            onChange={(e) => setEditDateHeure(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </div>
        <div>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleUpdateVisite} color="primary" variant="contained">
            Modifier
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VisitesPage;
