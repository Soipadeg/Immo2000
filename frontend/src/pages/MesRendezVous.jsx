/**
 * MesRendezVous.jsx - Gestion des rendez-vous de visite
 *
 * Affiche les demandes de RDV selon le rôle:
 * - Vendeur: Voir les demandes, accepter/refuser
 * - Acheteur: Voir ses demandes, historique
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Divider,
  IconButton
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon, Message as MessageIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MesRendezVous = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('tous'); // tous, en_attente, accepte, refuse

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRDV, setSelectedRDV] = useState(null);
  const [reponseData, setReponseData] = useState({
    reponse: 'accepter',
    message: '',
    creneau_id: null
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    chargerRendezVous();
  }, [user, token]);

  const chargerRendezVous = async () => {
    try {
      setLoading(true);

      // Si vendeur: récupérer les demandes pour ses annonces
      // Si acheteur: récupérer ses demandes
      const endpoint = user.role === 'vendeur'
        ? '/api/rendez-vous/demandes-vendeur'
        : '/api/rendez-vous/demandes-acheteur';

      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = user.role === 'vendeur'
        ? response.data.demandes || []
        : response.data.rendez_vous || [];

      setRendezVous(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des rendez-vous');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut) => {
    const colors = {
      'en_attente': 'warning',
      'accepte': 'success',
      'refuse': 'error',
      'annule': 'default'
    };
    return colors[statut] || 'default';
  };

  const getStatutLabel = (statut) => {
    const labels = {
      'en_attente': 'En attente',
      'accepte': 'Accepté',
      'refuse': 'Refusé',
      'annule': 'Annulé'
    };
    return labels[statut] || statut;
  };

  const handleRepondreClick = (rdv) => {
    setSelectedRDV(rdv);
    setReponseData({
      reponse: 'accepter',
      message: '',
      creneau_id: null
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRDV(null);
  };

  const repondreRDV = async () => {
    if (!selectedRDV) return;

    try {
      const payload = {
        reponse: reponseData.reponse,
        message: reponseData.message
      };

      if (reponseData.reponse === 'refuser' && reponseData.creneau_id) {
        payload.creneau_id = reponseData.creneau_id;
      }

      const response = await api.post(
        `/api/rendez-vous/${selectedRDV.rdv_id}/repondre`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRendezVous(prev =>
        prev.map(r => r.rdv_id === selectedRDV.rdv_id ? response.data.rdv : r)
      );

      setSuccess(`RDV ${reponseData.reponse === 'accepter' ? 'accepté' : 'refusé'} avec succès`);
      handleCloseDialog();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réponse');
    }
  };

  const handleConversation = (rdv) => {
    if (rdv.conversation_id) {
      navigate(`/conversations/${rdv.conversation_id}`);
    }
  };

  const filteredRDV = filter === 'tous'
    ? rendezVous
    : rendezVous.filter(r => r.statut === filter);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <h1>Mes Rendez-vous</h1>
        <p>Gérez vos demandes et confirmations de visite</p>
      </Box>

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

      {/* Filtres */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        {['tous', 'en_attente', 'accepte', 'refuse'].map(stat => (
          <Button
            key={stat}
            variant={filter === stat ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setFilter(stat)}
          >
            {getStatutLabel(stat)}
          </Button>
        ))}
      </Box>

      {filteredRDV.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <p>Aucun rendez-vous trouvé</p>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredRDV.map(rdv => (
            <Grid item xs={12} sm={6} md={4} key={rdv.rdv_id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6">
                      Visite #{rdv.rdv_id}
                    </Typography>
                    <Chip
                      label={getStatutLabel(rdv.statut)}
                      color={getStatutColor(rdv.statut)}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Annonce:</strong> #{rdv.annonce_id}
                    </Typography>

                    {rdv.date_proposée && (
                      <Typography variant="body2" color="textSecondary">
                        <strong>Date proposée:</strong>{' '}
                        {format(new Date(rdv.date_proposée), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </Typography>
                    )}

                    {rdv.date_confirmée && (
                      <Typography variant="body2" color="success.main">
                        <strong>Date confirmée:</strong>{' '}
                        {format(new Date(rdv.date_confirmée), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </Typography>
                    )}

                    {rdv.message && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        <strong>Message:</strong> {rdv.message}
                      </Typography>
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between' }}>
                  {/* Si vendeur et RDV en attente: boutons accepter/refuser */}
                  {user.role === 'vendeur' && rdv.statut === 'en_attente' && (
                    <Box>
                      <Button
                        size="small"
                        startIcon={<CheckIcon />}
                        color="success"
                        onClick={() => {
                          setSelectedRDV(rdv);
                          setReponseData({ reponse: 'accepter', message: '', creneau_id: null });
                          setOpenDialog(true);
                        }}
                      >
                        Accepter
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CloseIcon />}
                        color="error"
                        onClick={() => handleRepondreClick(rdv)}
                      >
                        Refuser
                      </Button>
                    </Box>
                  )}

                  {/* Si RDV accepté: lien conversation */}
                  {rdv.statut === 'accepte' && (
                    <Button
                      size="small"
                      startIcon={<MessageIcon />}
                      onClick={() => handleConversation(rdv)}
                    >
                      Message
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Répondre RDV */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Répondre à la demande de RDV
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Réponse"
              name="reponse"
              value={reponseData.reponse}
              onChange={(e) => setReponseData(prev => ({ ...prev, reponse: e.target.value }))}
              fullWidth
              SelectProps={{
                native: true
              }}
            >
              <option value="accepter">Accepter</option>
              <option value="refuser">Refuser</option>
            </TextField>

            <TextField
              label="Message (optionnel)"
              name="message"
              value={reponseData.message}
              onChange={(e) => setReponseData(prev => ({ ...prev, message: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder="Laissez un message à l'acheteur..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={repondreRDV} variant="contained" color="primary">
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MesRendezVous;
