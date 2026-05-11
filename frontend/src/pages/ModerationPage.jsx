/**
 * Page Modération des Annonces (Admin)
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FlagIcon from '@mui/icons-material/Flag';

const ModerationPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [annonces, setAnnonces] = useState([
    {
      id: 1,
      titre: 'Maison suspecte',
      prix: 450000,
      ville: 'Paris',
      image: 'https://via.placeholder.com/300x200?text=Annonce+1',
      statut: 'sous_revue',
      raison: 'Prix anormalement bas',
      signalements: 3,
    },
    {
      id: 2,
      titre: 'Appartement normal',
      prix: 350000,
      ville: 'Lyon',
      image: 'https://via.placeholder.com/300x200?text=Annonce+2',
      statut: 'approuve',
      raison: null,
      signalements: 0,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleApprove = (id) => {
    setAnnonces(
      annonces.map((a) =>
        a.id === id ? { ...a, statut: 'approuve' } : a
      )
    );
  };

  const handleReject = (id) => {
    setSelectedAnnonce(annonces.find((a) => a.id === id));
    setOpenDialog(true);
  };

  const handleConfirmReject = () => {
    setAnnonces(
      annonces.map((a) =>
        a.id === selectedAnnonce.id ? { ...a, statut: 'rejetee', raison: rejectReason } : a
      )
    );
    setOpenDialog(false);
    setRejectReason('');
  };

  const pendingAnnonces = annonces.filter((a) => a.statut === 'sous_revue');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        🛡️ Modération des Annonces
      </Typography>
      <Typography color="textSecondary" sx={{ mb: 4 }}>
        {pendingAnnonces.length} annonce{pendingAnnonces.length !== 1 ? 's' : ''} en attente de modération
      </Typography>

      {pendingAnnonces.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            ✅ Toutes les annonces ont été modérées!
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {pendingAnnonces.map((annonce) => (
            <Grid item xs={12} sm={6} lg={4} key={annonce.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={annonce.image}
                  alt={annonce.titre}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {annonce.titre}
                    </Typography>
                    <Chip
                      icon={<FlagIcon />}
                      label={`${annonce.signalements} signalement${annonce.signalements > 1 ? 's' : ''}`}
                      size="small"
                      color="warning"
                    />
                  </Box>

                  <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                    📍 {annonce.ville}
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                    {annonce.prix.toLocaleString()}€
                  </Typography>

                  {annonce.raison && (
                    <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1, mb: 2 }}>
                      <Typography variant="caption" color="error.main">
                        ⚠️ {annonce.raison}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="success"
                    variant="contained"
                    startIcon={<CheckIcon />}
                    onClick={() => handleApprove(annonce.id)}
                  >
                    Approuver
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={() => handleReject(annonce.id)}
                  >
                    Rejeter
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Rejet */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rejeter l'annonce</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Merci de spécifier la raison du rejet:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Raison du rejet (ex: Images de mauvaise qualité, prix anormal, etc.)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
            disabled={!rejectReason.trim()}
          >
            Rejeter
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ModerationPage;
