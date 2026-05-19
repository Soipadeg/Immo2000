/**
 * Page de réponse à une offre (accepter/refuser/négocier)
 * Vendeur répond à une offre reçue
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { offersApi, transactionsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function RepondreOffrePage() {
  const navigate = useNavigate();
  const { offerId } = useParams();
  const { user } = useAuth();

  const [offre, setOffre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  const [action, setAction] = useState('accepter'); // accepter | refuser | negocier
  const [contreProposition, setContreProposition] = useState('');

  // Charger l'offre
  useEffect(() => {
    const loadOffre = async () => {
      try {
        // TODO: Récupérer offre via API une fois endpoint disponible
        // Pour l'instant, on simule le chargement
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement de l\'offre');
        console.error(err);
        setLoading(false);
      }
    };

    loadOffre();
  }, [offerId]);

  const handleSubmit = async () => {
    if (!action) {
      setError('Veuillez choisir une action');
      return;
    }

    if (action === 'negocier' && !contreProposition) {
      setError('Veuillez entrer un montant de contre-proposition');
      return;
    }

    try {
      setSubmitting(true);

      const data = { action };
      if (action === 'negocier') {
        data.contre_proposition = parseFloat(contreProposition);
      }

      // Appeler l'API (à adapter avec vrai endpoint)
      // await offresApi.respond(offerId, data);

      setSuccessOpen(true);
      setTimeout(() => {
        navigate('/offres?responded=true');
      }, 1500);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de votre réponse');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Répondre à une offre
      </Typography>

      {/* Résumé de l'offre */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography color="textSecondary" gutterBottom>
                Prix proposé
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {offre?.prix_propose?.toLocaleString('fr-FR')} €
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography color="textSecondary" gutterBottom>
                Votre prix de vente
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {offre?.prix_vente?.toLocaleString('fr-FR')} €
              </Typography>
            </Grid>

            {offre?.conditions_suspensives && (
              <Grid item xs={12}>
                <Typography color="textSecondary" gutterBottom>
                  Conditions suspensives
                </Typography>
                <Typography variant="body2">
                  {offre.conditions_suspensives}
                </Typography>
              </Grid>
            )}

            {offre?.message && (
              <Grid item xs={12}>
                <Typography color="textSecondary" gutterBottom>
                  Message de l'acheteur
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  "{offre.message}"
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 4 }} />

      {/* Choix de l'action */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Votre décision
      </Typography>

      <RadioGroup value={action} onChange={(e) => setAction(e.target.value)}>
        {/* Option 1: Accepter */}
        <Card sx={{ mb: 2, border: action === 'accepter' ? '2px solid' : '1px solid', borderColor: action === 'accepter' ? 'success.main' : 'divider' }}>
          <CardContent sx={{ pb: 2 }}>
            <FormControlLabel
              value="accepter"
              control={<Radio />}
              label={
                <Box sx={{ ml: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                    Accepter l'offre
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    L'offre sera acceptée, une transaction sera créée automatiquement
                  </Typography>
                </Box>
              }
            />
          </CardContent>
        </Card>

        {/* Option 2: Refuser */}
        <Card sx={{ mb: 2, border: action === 'refuser' ? '2px solid' : '1px solid', borderColor: action === 'refuser' ? 'error.main' : 'divider' }}>
          <CardContent sx={{ pb: 2 }}>
            <FormControlLabel
              value="refuser"
              control={<Radio />}
              label={
                <Box sx={{ ml: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <CancelIcon sx={{ mr: 1, color: 'error.main' }} />
                    Refuser l'offre
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    L'offre sera définitivement refusée
                  </Typography>
                </Box>
              }
            />
          </CardContent>
        </Card>

        {/* Option 3: Négocier */}
        <Card sx={{ mb: 2, border: action === 'negocier' ? '2px solid' : '1px solid', borderColor: action === 'negocier' ? 'warning.main' : 'divider' }}>
          <CardContent>
            <FormControlLabel
              value="negocier"
              control={<Radio />}
              label={
                <Box sx={{ ml: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <AttachMoneyIcon sx={{ mr: 1, color: 'warning.main' }} />
                    Faire une contre-proposition
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Proposer un autre montant à l'acheteur
                  </Typography>
                </Box>
              }
            />

            {action === 'negocier' && (
              <TextField
                fullWidth
                label="Montant contre-proposition (€)"
                type="number"
                inputProps={{ step: '100', min: '0' }}
                value={contreProposition}
                onChange={(e) => setContreProposition(e.target.value)}
                sx={{ mt: 2 }}
                placeholder={offre?.prix_propose?.toString()}
              />
            )}
          </CardContent>
        </Card>
      </RadioGroup>

      {/* Boutons d'action */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/offres')}
          disabled={submitting}
          fullWidth
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !action}
          fullWidth
        >
          {submitting ? <CircularProgress size={24} /> : 'Confirmer ma réponse'}
        </Button>
      </Box>

      {/* Dialog de succès */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle>Réponse enregistrée</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            {action === 'accepter' && "L'offre a été acceptée avec succès. Une transaction est créée."}
            {action === 'refuser' && "L'offre a été refusée."}
            {action === 'negocier' && "Votre contre-proposition a été envoyée à l'acheteur."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessOpen(false)} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
