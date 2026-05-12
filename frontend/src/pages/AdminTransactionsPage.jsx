/**
 * TÂCHE 4: Gestion des Transactions
 */

import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Box, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { transactionsApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminTransactionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [dialog, setDialog] = useState({ open: false, action: null, transactionId: null });
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    loadTransactions();
  }, [status]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await transactionsApi.list(status || null);
      setTransactions(response.data?.data?.offres || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, transactionId) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'accept':
          await transactionsApi.accept(transactionId);
          break;
        case 'decline':
          await transactionsApi.decline(transactionId, reason);
          break;
        case 'cancel':
          await transactionsApi.cancel(transactionId, reason);
          break;
        default:
          break;
      }
      setDialog({ open: false, action: null, transactionId: null });
      setReason('');
      loadTransactions();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'action');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>💳 Gestion des Transactions</Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par statut</InputLabel>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            label="Filtrer par statut"
          >
            <MenuItem value="">Tous les statuts</MenuItem>
            <MenuItem value="proposee">Proposée</MenuItem>
            <MenuItem value="acceptee">Acceptée</MenuItem>
            <MenuItem value="refusee">Refusée</MenuItem>
            <MenuItem value="negociation">En négociation</MenuItem>
            <MenuItem value="retiree">Retirée</MenuItem>
            <MenuItem value="finalisee">Finalisée</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : transactions.length === 0 ? (
        <Alert severity="info">Aucune transaction trouvée</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Annonce ID</strong></TableCell>
                <TableCell><strong>Prix proposé</strong></TableCell>
                <TableCell><strong>Statut</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.offre_id}>
                  <TableCell>{tx.offre_id}</TableCell>
                  <TableCell>{tx.annonce_id}</TableCell>
                  <TableCell>€{(tx.prix_propose || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={tx.statut}
                      size="small"
                      color={tx.statut === 'acceptee' ? 'success' : tx.statut === 'refusee' ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{new Date(tx.date_offre).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {tx.statut === 'proposee' && (
                      <>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setDialog({ open: true, action: 'accept', transactionId: tx.offre_id })}
                        >
                          ✓
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          color="error"
                          onClick={() => setDialog({ open: true, action: 'decline', transactionId: tx.offre_id })}
                        >
                          ✗
                        </Button>
                      </>
                    )}
                    {(tx.statut === 'proposee' || tx.statut === 'negociation') && (
                      <Button
                        size="small"
                        variant="text"
                        color="warning"
                        onClick={() => setDialog({ open: true, action: 'cancel', transactionId: tx.offre_id })}
                      >
                        Annuler
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, action: null, transactionId: null })}>
        <DialogTitle>
          {dialog.action === 'accept' && 'Accepter cette offre?'}
          {dialog.action === 'decline' && 'Refuser cette offre?'}
          {dialog.action === 'cancel' && 'Annuler cette offre?'}
        </DialogTitle>
        <DialogContent>
          {(dialog.action === 'decline' || dialog.action === 'cancel') && (
            <TextField
              label="Raison"
              multiline
              rows={3}
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, action: null, transactionId: null })}>Annuler</Button>
          <Button
            onClick={() => handleAction(dialog.action, dialog.transactionId)}
            disabled={actionLoading || ((dialog.action === 'decline' || dialog.action === 'cancel') && !reason)}
            variant="contained"
            color={dialog.action === 'accept' ? 'success' : 'warning'}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminTransactionsPage;
