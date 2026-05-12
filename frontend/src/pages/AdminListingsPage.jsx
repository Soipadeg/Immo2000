/**
 * TÂCHE 3: Modération des Annonces
 */

import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Box, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Grid, Card, CardContent,
} from '@mui/material';
import { listingsApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminListingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState({ open: false, action: null, listingId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const response = await listingsApi.getPending();
      setListings(response.data?.data?.brouillons || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, listingId) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'approve':
          await listingsApi.approve(listingId);
          break;
        case 'reject':
          await listingsApi.reject(listingId, rejectReason);
          break;
        case 'remove':
          await listingsApi.remove(listingId);
          break;
        default:
          break;
      }
      setDialog({ open: false, action: null, listingId: null });
      setRejectReason('');
      loadListings();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'action');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>🏠 Modération des Annonces</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {listings.length === 0 ? (
            <Alert severity="success">✅ Toutes les annonces en attente ont été modérées</Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                {listings.length} annonce(s) en attente de modération
              </Alert>

              <Grid container spacing={2}>
                {listings.map((listing) => (
                  <Grid item xs={12} lg={6} key={listing.annonce_id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {listing.titre || 'Sans titre'}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={`${listing.prix || 0} €`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={listing.type_bien || 'N/A'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {listing.description || 'Pas de description'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => setDialog({ open: true, action: 'approve', listingId: listing.annonce_id })}
                          >
                            ✓ Approuver
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            onClick={() => setDialog({ open: true, action: 'reject', listingId: listing.annonce_id })}
                          >
                            ✗ Rejeter
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, action: null, listingId: null })}>
        <DialogTitle>
          {dialog.action === 'approve' && 'Approuver cette annonce?'}
          {dialog.action === 'reject' && 'Rejeter cette annonce?'}
        </DialogTitle>
        <DialogContent>
          {dialog.action === 'reject' && (
            <TextField
              label="Raison du rejet"
              multiline
              rows={3}
              fullWidth
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Ex: Contenu inapproprié, photo manquante, prix anormal..."
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, action: null, listingId: null })}>Annuler</Button>
          <Button
            onClick={() => handleAction(dialog.action, dialog.listingId)}
            disabled={actionLoading || (dialog.action === 'reject' && !rejectReason)}
            variant="contained"
            color={dialog.action === 'approve' ? 'success' : 'warning'}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminListingsPage;
