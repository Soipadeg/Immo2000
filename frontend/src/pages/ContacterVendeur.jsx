import '../styles/ContacterVendeur.css';
/**
 * ContacterVendeur.jsx - Formulaire de demande de visite
 *
 * Permet à un acheteur de:
 * - Sélectionner un créneau disponible du vendeur
 * - Proposer une date/heure alternative
 * - Envoyer un message au vendeur
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert, Input } from '@/components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ContacterVendeur = () => {
  const { annonceId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [annonce, setAnnonce] = useState(null);
  const [creneaux, setCreneaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [selectedType, setSelectedType] = useState('creneau'); // 'creneau' ou 'proposer'
  const [selectedCreneau, setSelectedCreneau] = useState(null);
  const [message, setMessage] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');

  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    chargerDonnees();
  }, [annonceId, user, token]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);

      // Charger l'annonce
      const annonceResponse = await api.get(`/api/annonces/${annonceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnonce(annonceResponse.data.annonce);

      // Charger les créneaux du vendeur
      if (annonceResponse.data.annonce) {
        const creneauxResponse = await api.get(
          `/api/vendeurs/${annonceResponse.data.annonce.utilisateur_id}/creneaux`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCreneaux(creneauxResponse.data.creneaux || []);
      }

      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Annonce non trouvée');
      } else {
        setError('Erreur lors du chargement des données');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const envoyerDemande = async () => {
    try {
      setSending(true);

      const payload = {
        annonce_id: parseInt(annonceId),
        message: message
      };

      if (selectedType === 'creneau' && selectedCreneau) {
        payload.creneau_id = selectedCreneau;
      } else if (selectedType === 'proposer') {
        if (!proposedDate || !proposedTime) {
          setError('Veuillez proposer une date et une heure');
          setSending(false);
          return;
        }
        const dateTime = new Date(`${proposedDate}T${proposedTime}`);
        payload.date_proposée = dateTime.toISOString();
      } else {
        setError('Veuillez sélectionner une option');
        setSending(false);
        return;
      }

      const response = await api.post('/api/rendez-vous', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Demande de RDV envoyée avec succès!');
      setShowConfirm(false);

      setTimeout(() => {
        navigate('/mes-rendez-vous');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi de la demande');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </div>
    );
  }

  if (!annonce) {
    return (
      <div maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Annonce non trouvée</Alert>
      </div>
    );
  }

  return (
    <div maxWidth="md" sx={{ py: 4 }}>
      <div sx={{ mb: 4 }}>
        <Button variant="text" onClick={() => navigate(-1)}>
          ← Retour
        </Button>
        <h1>Demander une visite</h1>
      </div>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <div className="grid-container">
        {/* Détails annonce */}
        <div className="grid-item">
          <div className="card">
            <div className="card"Header
              title={annonce.titre || 'Annonce'}
              subheader={`${annonce.prix}€`}
            />
            <div className="card"Content>
              <p>
                <strong>{annonce.nombre_pieces} pièce(s)</strong> - {annonce.surface}m²
              </p>
              <p>
                {annonce.adresse}
              </p>
              <p>
                {annonce.ville} ({annonce.code_postal})
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire demande */}
        <div className="grid-item">
          <Paper sx={{ p: 3 }}>
            <h2>Sélectionnez votre créneau</h2>

            <div sx={{ mb: 3 }}>
              <RadioGroup
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <FormControlLabel
                  value="creneau"
                  control={<Radio />}
                  label="Choisir un créneau disponible"
                />
                <FormControlLabel
                  value="proposer"
                  control={<Radio />}
                  label="Proposer une date/heure"
                />
              </RadioGroup>
            </div>

            <Divider sx={{ my: 3 }} />

            {/* Option 1: Choisir un créneau */}
            {selectedType === 'creneau' && (
              <div sx={{ mb: 3 }}>
                <h3>Créneaux disponibles</h3>

                {creneaux.length === 0 ? (
                  <Alert severity="info">
                    Le vendeur n'a pas encore de créneaux disponibles.
                    Proposez une date/heure à la place.
                  </Alert>
                ) : (
                  <ul>
                    {creneaux.map(creneau => (
                      <ulItem key={creneau.id} disablePadding>
                        <ulItemButton
                          selected={selectedCreneau === creneau.id}
                          onClick={() => setSelectedCreneau(creneau.id)}
                        >
                          <ulItemText
                            primary={format(
                              new Date(creneau.jour),
                              'dddd dd MMMM',
                              { locale: fr }
                            )}
                            secondary={`${creneau.heure_debut} - ${creneau.heure_fin}`}
                          />
                        </ListItemButton>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Option 2: Proposer une date */}
            {selectedType === 'proposer' && (
              <div sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <Input
                  label="Date proposée"
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
                <Input
                  label="Heure proposée"
                  type="time"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
              </div>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Message */}
            <div sx={{ mb: 3 }}>
              <h3>Votre message</h3>
              <Input
                fullWidth
                multiline
                rows={4}
                placeholder="Présentez-vous et exprimez vos attentes..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Bouton envoyer */}
            <div sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                Annuler
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowConfirm(true)}
                disabled={
                  (selectedType === 'creneau' && !selectedCreneau) ||
                  (selectedType === 'proposer' && (!proposedDate || !proposedTime))
                }
              >
                Envoyer la demande
              </Button>
            </div>
          </Paper>
        </div>
      </div>

      {/* Dialog confirmation */}
      <div className="modal" open={showConfirm} onClose={() => setShowConfirm(false)}>
        <div className="modal"Title>Confirmer votre demande</DialogTitle>
        <div className="modal"Content>
          <p>
            Êtes-vous sûr de vouloir envoyer cette demande de visite au vendeur?
          </p>
        </DialogContent>
        <div className="modal"Actions>
          <Button onClick={() => setShowConfirm(false)}>Annuler</Button>
          <Button
            onClick={envoyerDemande}
            variant="contained"
            color="primary"
            disabled={sending}
          >
            {sending ? 'Envoi...' : 'Confirmer'}
          </Button>
        </DialogActions>
      </div>
    </div>
  );
};

export default ContacterVendeur;
