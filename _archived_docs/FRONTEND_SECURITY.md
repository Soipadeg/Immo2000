# Frontend Security - Task 3

## Vue d'ensemble

Amélioration de la sécurité côté client incluant:
- Validation d'input avant submission
- Protection CSRF
- Gestion des erreurs de sécurité
- Session timeout warnings
- Error logging

---

## 1. Service API Security

### Ajout des Logs d'Audit

```javascript
// src/services/adminApi.js - Ajouter la section audit

const auditApi = {
  // Récupérer les logs d'audit
  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.admin_id) params.append('admin_id', filters.admin_id);
    if (filters.action) params.append('action', filters.action);
    if (filters.days) params.append('days', filters.days);
    if (filters.skip) params.append('skip', filters.skip);
    if (filters.limit) params.append('limit', filters.limit);

    return axiosInstance.get(`/admin/audit-logs?${params.toString()}`);
  },

  // Exporter les logs en CSV
  async exportAuditLogs() {
    return axiosInstance.get('/admin/audit-logs/export', {
      responseType: 'text'
    });
  },

  // Statut de sécurité
  async getSecurityStatus() {
    return axiosInstance.get('/admin/security/status');
  }
};

// Exporter
export { auditApi };
```

---

## 2. Composant Audit Logs Page

```jsx
// src/pages/AdminAuditPage.jsx

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
  Chip
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import { adminApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ skip: 0, limit: 50, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    admin_id: '',
    action: '',
    days: 30
  });

  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [pagination.skip, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.auditApi.getAuditLogs({
        ...filters,
        skip: pagination.skip,
        limit: pagination.limit
      });

      setLogs(response.data.data);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des logs d\'audit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const csv = await adminApi.auditApi.exportAuditLogs();

      // Télécharger le fichier
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      element.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      setError('Erreur lors de l\'export');
    }
  };

  const handlePageChange = (event, page) => {
    setPagination(prev => ({
      ...prev,
      skip: (page - 1) * prev.limit
    }));
  };

  const getActionColor = (action) => {
    const colors = {
      approve: 'success',
      reject: 'error',
      delete: 'error',
      suspend: 'warning',
      reactivate: 'info',
      update: 'default'
    };
    return colors[action] || 'default';
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
              action={
                <Button
                  variant="contained"
                  startIcon={<GetAppIcon />}
                  onClick={handleExport}
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Jours"
                  type="number"
                  value={filters.days}
                  onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) })}
                  inputProps={{ min: 1, max: 365 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Action"
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  select
                >
                  <MenuItem value="">Toutes</MenuItem>
                  <MenuItem value="approve">Approuver</MenuItem>
                  <MenuItem value="reject">Rejeter</MenuItem>
                  <MenuItem value="delete">Supprimer</MenuItem>
                  <MenuItem value="suspend">Suspendre</MenuItem>
                  <MenuItem value="update">Mettre à jour</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={loadLogs}
                  disabled={loading}
                >
                  Filtrer
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Erreur */}
        {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}

        {/* Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Admin</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Ressource</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>IP</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Détails</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Aucun log d'audit
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.log_id} hover>
                      <TableCell>{log.admin_email}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          color={getActionColor(log.action)}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.resource_type} #{log.resource_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${log.status_code}`}
                          color={log.status_code >= 200 && log.status_code < 300 ? 'success' : 'error'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.ip_address}</TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString('fr-FR')}</TableCell>
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
          />
        </Grid>
      </Grid>

      {/* Détails Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails du Log</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <strong>Admin:</strong> {selectedLog.admin_email}
              </Box>
              <Box sx={{ mb: 2 }}>
                <strong>Action:</strong> {selectedLog.action}
              </Box>
              <Box sx={{ mb: 2 }}>
                <strong>Ressource:</strong> {selectedLog.resource_type} #{selectedLog.resource_id}
              </Box>
              <Box sx={{ mb: 2 }}>
                <strong>Raison:</strong> {selectedLog.reason || 'N/A'}
              </Box>
              <Box sx={{ mb: 2 }}>
                <strong>IP:</strong> {selectedLog.ip_address}
              </Box>
              <Box sx={{ mb: 2 }}>
                <strong>Date:</strong> {new Date(selectedLog.timestamp).toLocaleString('fr-FR')}
              </Box>
              {selectedLog.old_value && (
                <Box sx={{ mb: 2 }}>
                  <strong>Avant:</strong>
                  <pre style={{ fontSize: '0.8em', background: '#f5f5f5', padding: '8px' }}>
                    {JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </Box>
              )}
              {selectedLog.new_value && (
                <Box sx={{ mb: 2 }}>
                  <strong>Après:</strong>
                  <pre style={{ fontSize: '0.8em', background: '#f5f5f5', padding: '8px' }}>
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
```

---

## 3. Composant Security Status

```jsx
// src/pages/AdminSecurityPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { adminApi } from '../services/adminApi';

export default function AdminSecurityPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const loadSecurityStatus = async () => {
    try {
      const response = await adminApi.auditApi.getSecurityStatus();
      setStatus(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement du statut de sécurité');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Status */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Statut de Sécurité" />
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip
                  label={`Statut: ${status?.status || 'unknown'}`}
                  color={status?.status === 'ok' ? 'success' : 'error'}
                />
                <Chip
                  label={`Erreurs 24h: ${status?.failed_actions_24h || 0}`}
                  color={status?.failed_actions_24h > 5 ? 'warning' : 'default'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* IPs Suspectes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Adresses IP Suspectes" />
            <CardContent>
              {error && <Alert severity="error">{error}</Alert>}
              {status?.suspicious_ips?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>IP</TableCell>
                        <TableCell align="right">Erreurs</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {status.suspicious_ips.map((ip) => (
                        <TableRow key={ip.ip}>
                          <TableCell>{ip.ip}</TableCell>
                          <TableCell align="right">
                            <Chip label={ip.failed_count} color="error" size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="success">Aucune IP suspecte</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Admins Actifs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Admins les Plus Actifs" />
            <CardContent>
              {status?.top_active_admins?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Admin</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {status.top_active_admins.map((admin) => (
                        <TableRow key={admin.admin_id}>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell align="right">{admin.actions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">Aucun admin actif</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
```

---

## 4. Session Timeout Warning

```jsx
// src/hooks/useSessionTimeout.js

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 heures
const WARNING_TIME_MS = 5 * 60 * 1000; // Avertissement 5 min avant

export function useSessionTimeout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    let loginTime = localStorage.getItem('loginTime');
    if (!loginTime) {
      loginTime = Date.now();
      localStorage.setItem('loginTime', loginTime);
    }

    const timer = setInterval(() => {
      const elapsed = Date.now() - parseInt(loginTime);
      const remaining = SESSION_TIMEOUT_MS - elapsed;

      if (remaining <= 0) {
        // Session expirée
        clearInterval(timer);
        logout();
        navigate('/login');
      } else if (remaining <= WARNING_TIME_MS && !showWarning) {
        // Avertissement
        setShowWarning(true);
        setTimeRemaining(Math.floor(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [showWarning, logout, navigate]);

  return { showWarning, timeRemaining, setShowWarning };
}
```

### Utilisation dans AdminLayout

```jsx
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import SessionTimeoutDialog from '../components/SessionTimeoutDialog';

export default function AdminLayout() {
  const { showWarning, timeRemaining } = useSessionTimeout();

  return (
    <>
      {/* ... Layout */}
      {showWarning && <SessionTimeoutDialog timeRemaining={timeRemaining} />}
    </>
  );
}
```

---

## 5. Error Logging côté Client

```javascript
// src/services/errorLogger.js

export const errorLogger = {
  log(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Envoyer au backend
    fetch('/api/v1/admin/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorInfo)
    }).catch(console.error);

    // Console en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('Frontend Error:', errorInfo);
    }
  }
};
```

---

## 6. Routes Mise à Jour

Ajouter à `App.jsx`:

```jsx
import AdminAuditPage from './pages/AdminAuditPage';
import AdminSecurityPage from './pages/AdminSecurityPage';

// Dans le layout Admin
<Route path="/admin/audit" element={<AdminAuditPage />} />
<Route path="/admin/security" element={<AdminSecurityPage />} />
```

---

## 7. Navigation Mise à Jour

Ajouter au sidebar de `AdminLayout.jsx`:

```jsx
{
  label: 'Audit Trail',
  path: '/admin/audit',
  icon: <HistoryIcon />
},
{
  label: 'Sécurité',
  path: '/admin/security',
  icon: <SecurityIcon />
}
```

---

## Checklist Frontend

- [ ] Service auditApi créé dans adminApi.js
- [ ] AdminAuditPage composant créé
- [ ] AdminSecurityPage composant créé
- [ ] useSessionTimeout hook implémenté
- [ ] SessionTimeoutDialog créé
- [ ] ErrorLogger service créé
- [ ] Routes ajoutées à App.jsx
- [ ] Navigation mise à jour dans AdminLayout
- [ ] Tests de sécurité écrits
- [ ] Validation input côté client implémentée

**Status**: Frontend Task 3 - À implémenter ✍️
