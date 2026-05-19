/**
 * Page de gestion des offres d'achat (Mes offres)
 * Affiche les offres faites par l'acheteur et les offres reçues par le vendeur
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { offresApi } from '../services/api';

/**
 * Composant pour afficher une offre
 */
const OfferCard = ({ offre, isVendor, onUpdate }) => {
  const [openCounterDialog, setOpenCounterDialog] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      await offresApi.accept(offre.offre_id);
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await offresApi.reject(offre.offre_id);
      onUpdate();
    } catch (error) {
      console.error('Erreur lors du refus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCounter = async () => {
    try {
      setLoading(true);
      await offresApi.counter(offre.offre_id, {
        prix_contre_propose: parseFloat(counterPrice),
      });
      setOpenCounterDialog(false);
      setCounterPrice('');
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la contre-offre:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statut) => {
    const colors = {
      proposee: 'info',
      acceptee: 'success',
      refusee: 'error',
      negociation: 'warning',
      retiree: 'default',
      finalisee: 'success',
    };
    return colors[statut] || 'default';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      proposee: 'Proposée',
      acceptee: 'Acceptée',
      refusee: 'Refusée',
      negociation: 'Négociation',
      retiree: 'Retirée',
      finalisee: 'Finalisée',
    };
    return labels[statut] || statut;
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6">
              Offre #{offre.offre_id}
            </Typography>
            <Typography color="textSecondary">
              {isVendor ? `De: ${offre.acheteur_nom}` : `Pour: ${offre.annonce_titre}`}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(offre.statut)}
            color={getStatusColor(offre.statut)}
            variant="outlined"
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">
              Prix proposé
            </Typography>
            <Typography variant="h6">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(offre.prix_propose)}
            </Typography>
          </Grid>
          {offre.prix_contre_propose && (
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="textSecondary">
                Contre-proposition
              </Typography>
              <Typography variant="h6">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(offre.prix_contre_propose)}
              </Typography>
            </Grid>
          )}
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">
              Date
            </Typography>
            <Typography variant="body2">
              {new Date(offre.date_offre).toLocaleDateString('fr-FR')}
            </Typography>
          </Grid>
        </Grid>

        {offre.message && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'background.secondary', borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Message
            </Typography>
            <Typography variant="body2">{offre.message}</Typography>
          </Box>
        )}
      </CardContent>

      {isVendor && offre.statut === 'proposee' && (
        <CardActions>
          <Button
            size="small"
            color="success"
            startIcon={<CheckIcon />}
            onClick={handleAccept}
            disabled={loading}
          >
            Accepter
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<CloseIcon />}
            onClick={handleReject}
            disabled={loading}
          >
            Refuser
          </Button>
          <Button
            size="small"
            color="info"
            startIcon={<ReplyIcon />}
            onClick={() => setOpenCounterDialog(true)}
            disabled={loading}
          >
            Contre-offre
          </Button>
        </CardActions>
      )}

      {!isVendor && offre.statut === 'negociation' && (
        <CardActions>
          <Button
            size="small"
            color="success"
            startIcon={<CheckIcon />}
            onClick={handleAccept}
            disabled={loading}
          >
            Accepter contre-offre
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<CloseIcon />}
            onClick={handleReject}
            disabled={loading}
          >
            Refuser
          </Button>
        </CardActions>
      )}

      {/* Dialog pour contre-offre */}
      <Dialog
        open={openCounterDialog}
        onClose={() => setOpenCounterDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Faire une contre-offre</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Montant actuel : {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            }).format(offre.prix_propose)}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Nouveau prix proposé"
            type="number"
            value={counterPrice}
            onChange={(e) => setCounterPrice(e.target.value)}
            inputProps={{ step: '1000' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCounterDialog(false)}>
            Annuler
          </Button>
          <Button onClick={handleCounter} variant="contained" disabled={loading || !counterPrice}>
            Proposer
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

/**
 * Page principale - Onglets pour Offres faites / Offres reçues
 */
export default function OffresPage() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [buyerOffers, setBuyerOffers] = useState([]);
  const [vendorOffers, setVendorOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOffers = async () => {
    try {
      setLoading(true);
      const [buyerRes, vendorRes] = await Promise.all([
        offresApi.getBuyerOffers().catch(() => ({ data: [] })),
        offresApi.getVendorOffers().catch(() => ({ data: [] })),
      ]);
      setBuyerOffers(buyerRes.data);
      setVendorOffers(vendorRes.data);
    } catch (err) {
      setError('Erreur lors du chargement des offres');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des offres
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Tabs offres"
        >
          <Tab label={`Offres faites (${buyerOffers.length})`} />
          <Tab label={`Offres reçues (${vendorOffers.length})`} />
        </Tabs>
      </Box>

      {/* Onglet: Offres faites */}
      {tabValue === 0 && (
        <Box>
          {buyerOffers.length === 0 ? (
            <Alert severity="info">Vous n'avez pas encore fait d'offre</Alert>
          ) : (
            buyerOffers.map((offre) => (
              <OfferCard
                key={offre.offre_id}
                offre={offre}
                isVendor={false}
                onUpdate={loadOffers}
              />
            ))
          )}
        </Box>
      )}

      {/* Onglet: Offres reçues */}
      {tabValue === 1 && (
        <Box>
          {vendorOffers.length === 0 ? (
            <Alert severity="info">Vous n'avez pas reçu d'offre</Alert>
          ) : (
            vendorOffers.map((offre) => (
              <OfferCard
                key={offre.offre_id}
                offre={offre}
                isVendor={true}
                onUpdate={loadOffers}
              />
            ))
          )}
        </Box>
      )}
    </Container>
  );
}
