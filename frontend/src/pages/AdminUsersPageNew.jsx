/**
 * TÂCHE 2: Gestion des Utilisateurs
 */

import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Box, CircularProgress, Alert, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Pagination, IconButton, Tooltip,
} from '@mui/material';
import { Edit, Delete, Block, Check, Search } from '@mui/icons-material';
import { usersApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminUsersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialog, setDialog] = useState({ open: false, action: null, userId: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendHours, setSuspendHours] = useState(48);

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && user?.role === 'admin') {
      loadUsers();
    }
  }, [page, searchQuery, user, authLoading]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      let response;
      if (searchQuery) {
        response = await usersApi.search(searchQuery);
      } else {
        response = await usersApi.list(skip, limit);
      }
      setUsers(response.data?.data?.utilisateurs || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, userId) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'changeRole':
          await usersApi.changeRole(userId);
          break;
        case 'suspend':
          await usersApi.suspend(userId, suspendHours);
          break;
        case 'reactivate':
          await usersApi.reactivate(userId);
          break;
        case 'delete':
          await usersApi.delete(userId);
          break;
        default:
          break;
      }
      setDialog({ open: false, action: null, userId: null });
      loadUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'action');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>👥 Gestion des Utilisateurs</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            placeholder="Rechercher (email, nom...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            size="small"
            InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
            sx={{ flex: 1, maxWidth: 300 }}
          />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Nom</strong></TableCell>
                  <TableCell><strong>Rôle</strong></TableCell>
                  <TableCell><strong>Statut</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.utilisateur_id}>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.nom || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role}
                          size="small"
                          color={u.role === 'admin' ? 'error' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.actif ? 'Actif' : 'Suspendu'}
                          size="small"
                          color={u.actif ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Changer rôle">
                          <IconButton
                            size="small"
                            onClick={() => setDialog({ open: true, action: 'changeRole', userId: u.utilisateur_id })}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {u.actif ? (
                          <Tooltip title="Suspendre">
                            <IconButton
                              size="small"
                              onClick={() => setDialog({ open: true, action: 'suspend', userId: u.utilisateur_id })}
                            >
                              <Block fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Réactiver">
                            <IconButton
                              size="small"
                              onClick={() => setDialog({ open: true, action: 'reactivate', userId: u.utilisateur_id })}
                            >
                              <Check fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            onClick={() => setDialog({ open: true, action: 'delete', userId: u.utilisateur_id })}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={10} page={page} onChange={(e, p) => setPage(p)} />
          </Box>
        </>
      )}

      {/* Dialogs */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, action: null, userId: null })}>
        <DialogTitle>
          {dialog.action === 'changeRole' && 'Changer le rôle?'}
          {dialog.action === 'suspend' && 'Suspendre l\'utilisateur?'}
          {dialog.action === 'reactivate' && 'Réactiver l\'utilisateur?'}
          {dialog.action === 'delete' && 'Supprimer l\'utilisateur?'}
        </DialogTitle>
        <DialogContent>
          {dialog.action === 'suspend' && (
            <TextField
              label="Durée de suspension (heures)"
              type="number"
              value={suspendHours}
              onChange={(e) => setSuspendHours(parseInt(e.target.value))}
              fullWidth
              sx={{ mt: 2 }}
            />
          )}
          {dialog.action === 'delete' && (
            <Typography color="error">Cette action est irréversible!</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, action: null, userId: null })}>
            Annuler
          </Button>
          <Button
            onClick={() => handleAction(dialog.action, dialog.userId)}
            disabled={actionLoading}
            variant="contained"
            color={dialog.action === 'delete' ? 'error' : 'primary'}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminUsersPage;
