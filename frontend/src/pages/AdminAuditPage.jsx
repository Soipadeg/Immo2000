import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Pagination,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import { auditApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function AdminAuditPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ skip: 0, limit: 50, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    admin_id: '',
    action: '',
    days: 30,
  });

  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && user?.role === 'admin') {
      loadLogs();
    }
  }, [pagination.skip, filters, user, authLoading]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await auditApi.getAuditLogs({
        ...filters,
        skip: pagination.skip,
        limit: pagination.limit,
      });

      if (response.data && response.data.data) {
        setLogs(response.data.data);
        setPagination(response.data.pagination || pagination);
        setError(null);
      }
    } catch (err) {
      setError("Erreur lors du chargement des logs d'audit");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const csv = await auditApi.exportAuditLogs();

      // Télécharger le fichier
      const element = document.createElement('a');
      element.setAttribute(
        'href',
        'data:text/csv;charset=utf-8,' + encodeURIComponent(csv.data)
      );
      element.setAttribute(
        'download',
        `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      );
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      setError("Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, page) => {
    setPagination((prev) => ({
      ...prev,
      skip: (page - 1) * prev.limit,
    }));
  };

  const getActionColor = (action) => {
    const colors = {
      approve: 'success',
      reject: 'error',
      delete: 'error',
      suspend: 'warning',
      reactivate: 'info',
      update: 'default',
      create: 'info',
    };
    return colors[action] || 'default';
  };

  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500) return 'error';
    return 'default';
  };

  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Audit Trail - Actions Administrateur"
              subheader={`Total: ${pagination.total} enregistrements`}
              action={
                <Button
                  variant="contained"
                  startIcon={<GetAppIcon />}
                  onClick={handleExport}
                  disabled={loading || logs.length === 0}
                >
                  Exporter CSV
                </Button>
              }
            />
          </Card>
        </Grid>

        {/* Filtres */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Jours"
                  type="number"
                  value={filters.days}
                  onChange={(e) =>
                    setFilters({ ...filters, days: parseInt(e.target.value) || 30 })
                  }
                  inputProps={{ min: 1, max: 365 }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Action"
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  select
                  size="small"
                >
                  <MenuItem value="">Toutes les actions</MenuItem>
                  <MenuItem value="approve">Approuver</MenuItem>
                  <MenuItem value="reject">Rejeter</MenuItem>
                  <MenuItem value="delete">Supprimer</MenuItem>
                  <MenuItem value="suspend">Suspendre</MenuItem>
                  <MenuItem value="reactivate">Réactiver</MenuItem>
                  <MenuItem value="update">Mettre à jour</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Type ressource"
                  value={filters.resource_type}
                  onChange={(e) =>
                    setFilters({ ...filters, resource_type: e.target.value })
                  }
                  select
                  size="small"
                >
                  <MenuItem value="">Tous les types</MenuItem>
                  <MenuItem value="user">Utilisateur</MenuItem>
                  <MenuItem value="listing">Annonce</MenuItem>
                  <MenuItem value="transaction">Transaction</MenuItem>
                  <MenuItem value="settings">Paramètres</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={loadLogs}
                  disabled={loading}
                >
                  Appliquer
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Message d'erreur */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {/* Tableau */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell fontWeight="bold">Admin</TableCell>
                  <TableCell fontWeight="bold">Action</TableCell>
                  <TableCell fontWeight="bold">Ressource</TableCell>
                  <TableCell fontWeight="bold" align="center">
                    Statut
                  </TableCell>
                  <TableCell fontWeight="bold">IP</TableCell>
                  <TableCell fontWeight="bold">Date</TableCell>
                  <TableCell fontWeight="bold" align="center">
                    Détails
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      Aucun log d'audit
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.log_id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {log.admin_email}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          color={getActionColor(log.action)}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {log.resource_type} #{log.resource_id || 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${log.status_code}`}
                          color={getStatusColor(log.status_code)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {log.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailsOpen(true);
                          }}
                        >
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Pagination */}
        <Grid item xs={12} display="flex" justifyContent="center">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            disabled={loading}
            color="primary"
          />
        </Grid>
      </Grid>

      {/* Dialog - Détails */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails du Log d'Audit</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <strong>ID Log:</strong> {selectedLog.log_id}
              </Box>
              <Box>
                <strong>Admin:</strong> {selectedLog.admin_email} ({selectedLog.admin_id})
              </Box>
              <Box>
                <strong>Action:</strong>{' '}
                <Chip label={selectedLog.action} size="small" />
              </Box>
              <Box>
                <strong>Ressource:</strong> {selectedLog.resource_type} #
                {selectedLog.resource_id || 'N/A'}
              </Box>
              <Box>
                <strong>Raison:</strong> {selectedLog.reason || 'N/A'}
              </Box>
              <Box>
                <strong>IP:</strong> {selectedLog.ip_address}
              </Box>
              <Box>
                <strong>Statut HTTP:</strong>{' '}
                <Chip label={selectedLog.status_code} size="small" />
              </Box>
              <Box>
                <strong>Date:</strong>{' '}
                {new Date(selectedLog.timestamp).toLocaleString('fr-FR')}
              </Box>

              {selectedLog.old_value && (
                <Box>
                  <strong>Avant (old_value):</strong>
                  <pre
                    style={{
                      fontSize: '0.75rem',
                      background: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '150px',
                    }}
                  >
                    {JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </Box>
              )}

              {selectedLog.new_value && (
                <Box>
                  <strong>Après (new_value):</strong>
                  <pre
                    style={{
                      fontSize: '0.75rem',
                      background: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '150px',
                    }}
                  >
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
