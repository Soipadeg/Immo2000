/**
 * Page Gestion des Utilisateurs (Admin)
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const AdminUsersPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([
    { id: 1, email: 'jean@example.com', nom: 'Dupont', prenom: 'Jean', role: 'user', statut: 'actif', dateInscription: '2026-01-15' },
    { id: 2, email: 'marie@example.com', nom: 'Martin', prenom: 'Marie', role: 'user', statut: 'actif', dateInscription: '2026-02-20' },
    { id: 3, email: 'admin@immo2000.fr', nom: 'Admin', prenom: 'Super', role: 'admin', statut: 'actif', dateInscription: '2025-12-01' },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

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

  const handleOpenDialog = (userToEdit) => {
    setSelectedUser(userToEdit);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleSuspendUser = (id) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, statut: u.statut === 'actif' ? 'suspendu' : 'actif' } : u
      )
    );
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false;
    if (filterStatut && u.statut !== filterStatut) return false;
    return true;
  });

  const getRoleColor = (role) => {
    return role === 'admin' ? 'error' : 'primary';
  };

  const getStatutColor = (statut) => {
    return statut === 'actif' ? 'success' : 'warning';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        👥 Gestion des Utilisateurs
      </Typography>
      <Typography color="textSecondary" sx={{ mb: 4 }}>
        Total: {users.length} utilisateurs | Actifs: {users.filter((u) => u.statut === 'actif').length}
      </Typography>

      {/* Filtres */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Rôle</InputLabel>
          <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} label="Rôle">
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="user">Utilisateur</MenuItem>
            <MenuItem value="admin">Administrateur</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} label="Statut">
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="actif">Actif</MenuItem>
            <MenuItem value="suspendu">Suspendu</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tableau */}
      <TableContainer component={Card}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date d'inscription</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {u.prenom} {u.nom}
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.role === 'admin' ? 'Admin' : 'Utilisateur'}
                    size="small"
                    color={getRoleColor(u.role)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.statut === 'actif' ? 'Actif' : 'Suspendu'}
                    size="small"
                    color={getStatutColor(u.statut)}
                  />
                </TableCell>
                <TableCell>{new Date(u.dateInscription).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={u.statut === 'actif' ? <BlockIcon /> : <></>}
                    onClick={() => handleSuspendUser(u.id)}
                    color={u.statut === 'actif' ? 'warning' : 'success'}
                  >
                    {u.statut === 'actif' ? 'Suspendre' : 'Activer'}
                  </Button>
                  <Button size="small" startIcon={<DeleteIcon />} onClick={() => handleDeleteUser(u.id)} color="error">
                    Supprimer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default AdminUsersPage;
