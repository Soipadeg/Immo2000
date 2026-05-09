/**
 * Page d'administration - Gestion des utilisateurs
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { adminApi } from '../services/api';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Charger la liste des utilisateurs
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.listUsers(0, 100);
      setUsers(response.data.utilisateurs || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateClick = (user) => {
    setSelectedUser(user);
    setDeactivateDialogOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!selectedUser) return;

    try {
      await adminApi.deactivateUser(selectedUser.utilisateur_id);
      setDeactivateDialogOpen(false);
      // Recharger la liste
      loadUsers();
      setSelectedUser(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la désactivation');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        🔐 Administration - Gestion des Utilisateurs
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Nom</strong></TableCell>
                <TableCell><strong>Prénom</strong></TableCell>
                <TableCell><strong>Rôle Actif</strong></TableCell>
                <TableCell><strong>Statut</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">Aucun utilisateur trouvé</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.utilisateur_id} hover>
                    <TableCell>{user.utilisateur_id}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.nom || '-'}</TableCell>
                    <TableCell>{user.prenom || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role_actif || 'N/A'}
                        color={user.role_actif === 'vendeur' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.actif ? 'Actif' : 'Inactif'}
                        color={user.actif ? 'success' : 'error'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.actif && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeactivateClick(user)}
                        >
                          Désactiver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog de confirmation de désactivation */}
      <Dialog open={deactivateDialogOpen} onClose={() => setDeactivateDialogOpen(false)}>
        <DialogTitle>Désactiver l'utilisateur</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Êtes-vous sûr de vouloir désactiver{' '}
            <strong>{selectedUser?.email}</strong> ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleDeactivateConfirm}
            color="error"
            variant="contained"
          >
            Désactiver
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;
