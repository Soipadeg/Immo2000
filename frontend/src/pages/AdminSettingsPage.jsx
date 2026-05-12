/**
 * TÂCHE 5: Paramètres Système
 */

import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, CircularProgress, Alert, Button,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Switch, Chip,
} from '@mui/material';
import { settingsApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Edit, Refresh } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

const AdminSettingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState({ open: false, setting: null });
  const [editValue, setEditValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && user?.role === 'admin') {
      loadSettings();
    }
  }, [user, authLoading]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsApi.list();
      setSettings(response.data?.data?.parametres || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting) => {
    setDialog({ open: true, setting });
    setEditValue(String(setting.valeur_parametre));
  };

  const handleSave = async () => {
    if (!dialog.setting) return;
    setActionLoading(true);
    try {
      await settingsApi.update(dialog.setting.cle_parametre, editValue);
      setDialog({ open: false, setting: null });
      setEditValue('');
      loadSettings();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    setActionLoading(true);
    try {
      await settingsApi.reset();
      setResetConfirm(false);
      loadSettings();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réinitialisation');
    } finally {
      setActionLoading(false);
    }
  };

  const formatValue = (type, value) => {
    if (type === 'boolean') return value ? '✓ Activé' : '✗ Désactivé';
    if (type === 'integer') return value.toLocaleString();
    return value;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">⚙️ Paramètres Système</Typography>
        <Box>
          <Tooltip title="Recharger">
            <IconButton onClick={loadSettings} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="warning"
            onClick={() => setResetConfirm(true)}
            sx={{ ml: 1 }}
          >
            Réinitialiser tout
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            {settings.length} paramètre(s) configuré(s)
          </Alert>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Paramètre</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Valeur</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting.cle_parametre}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {setting.cle_parametre}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={setting.type_parametre} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatValue(setting.type_parametre, setting.valeur_parametre)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {setting.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(setting)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Dialog Edit */}
      <Dialog open={dialog.open && !resetConfirm} onClose={() => setDialog({ open: false, setting: null })}>
        <DialogTitle>Modifier: {dialog.setting?.cle_parametre}</DialogTitle>
        <DialogContent>
          {dialog.setting?.type_parametre === 'boolean' ? (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ mr: 2 }}>Valeur:</Typography>
              <Switch
                checked={editValue === 'true' || editValue === true}
                onChange={(e) => setEditValue(e.target.checked ? 'true' : 'false')}
              />
              <Typography sx={{ ml: 2 }}>
                {editValue === 'true' || editValue === true ? '✓ Activé' : '✗ Désactivé'}
              </Typography>
            </Box>
          ) : (
            <TextField
              label="Nouvelle valeur"
              type={dialog.setting?.type_parametre === 'integer' ? 'number' : 'text'}
              fullWidth
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, setting: null })}>Annuler</Button>
          <Button
            onClick={handleSave}
            disabled={actionLoading}
            variant="contained"
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Reset */}
      <Dialog open={resetConfirm}>
        <DialogTitle>⚠️ Réinitialiser tous les paramètres?</DialogTitle>
        <DialogContent>
          <Typography>
            Cette action restaurera tous les paramètres à leurs valeurs par défaut.
            Êtes-vous sûr?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetConfirm(false)}>Annuler</Button>
          <Button
            onClick={handleReset}
            disabled={actionLoading}
            variant="contained"
            color="error"
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminSettingsPage;
