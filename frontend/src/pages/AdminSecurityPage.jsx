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
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { auditApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';

export default function AdminSecurityPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSecurityStatus();
    // Recharger toutes les 30 secondes
    const interval = setInterval(loadSecurityStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityStatus = async () => {
    try {
      const response = await auditApi.getSecurityStatus();
      setStatus(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement du statut de sécurité');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const getStatusIcon = (isOk) => {
    return isOk ? (
      <CheckCircleIcon sx={{ color: 'success.main' }} />
    ) : (
      <WarningIcon sx={{ color: 'warning.main' }} />
    );
  };

  const failedActions = status?.failed_actions_24h || 0;
  const suspiciousCount = status?.suspicious_ips?.length || 0;
  const isHealthy = failedActions <= 5 && suspiciousCount === 0;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Statut de Sécurité"
              subheader="Monitoring en temps réel"
              action={
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadSecurityStatus}
                  disabled={loading}
                  size="small"
                >
                  Rafraîchir
                </Button>
              }
            />
          </Card>
        </Grid>

        {/* KPI Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getStatusIcon(isHealthy)}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ fontSize: '0.75rem', color: 'textSecondary' }}>
                    Statut Global
                  </Box>
                  <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {isHealthy ? 'Sûr' : 'Attention'}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getStatusIcon(failedActions <= 5)}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ fontSize: '0.75rem', color: 'textSecondary' }}>
                    Erreurs 24h
                  </Box>
                  <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {failedActions}
                  </Box>
                </Box>
              </Box>
              {failedActions > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={Math.min((failedActions / 10) * 100, 100)}
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getStatusIcon(suspiciousCount === 0)}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ fontSize: '0.75rem', color: 'textSecondary' }}>
                    IPs Suspectes
                  </Box>
                  <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {suspiciousCount}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SecurityIcon sx={{ color: 'primary.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ fontSize: '0.75rem', color: 'textSecondary' }}>
                    Admins Actifs
                  </Box>
                  <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {status?.top_active_admins?.length || 0}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {/* Adresses IP Suspectes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Adresses IP Suspectes"
              subheader="IPs avec >5 erreurs en 24h"
            />
            <CardContent>
              {status?.suspicious_ips && status.suspicious_ips.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell fontWeight="bold">Adresse IP</TableCell>
                        <TableCell fontWeight="bold" align="right">
                          Erreurs
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {status.suspicious_ips.map((ip) => (
                        <TableRow key={ip.ip} hover>
                          <TableCell sx={{ fontFamily: 'monospace' }}>
                            {ip.ip}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={ip.failed_count}
                              color="error"
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="success">
                  ✅ Aucune adresse IP suspecte détectée
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Admins Actifs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Admins les Plus Actifs"
              subheader="Derniers 7 jours"
            />
            <CardContent>
              {status?.top_active_admins && status.top_active_admins.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell fontWeight="bold">Admin</TableCell>
                        <TableCell fontWeight="bold" align="right">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {status.top_active_admins.map((admin) => (
                        <TableRow key={admin.admin_id} hover>
                          <TableCell>
                            <Box>
                              <Box sx={{ fontWeight: 500 }}>{admin.email}</Box>
                              <Box sx={{ fontSize: '0.75rem', color: 'textSecondary' }}>
                                ID: {admin.admin_id}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={admin.actions} size="small" />
                          </TableCell>
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

        {/* Recommandations */}
        {!isHealthy && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#fff3cd' }}>
              <CardHeader
                title="⚠️ Recommandations de Sécurité"
                sx={{ pb: 1 }}
              />
              <CardContent>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {failedActions > 5 && (
                    <Box component="li" sx={{ mb: 1 }}>
                      Nombre élevé d'erreurs détecté. Vérifiez les logs d'audit
                      pour identifier les problèmes.
                    </Box>
                  )}
                  {suspiciousCount > 0 && (
                    <Box component="li" sx={{ mb: 1 }}>
                      Adresses IP suspectes détectées. Envisagez de bloquer ou
                      monitorer ces IPs.
                    </Box>
                  )}
                  <Box component="li">
                    Consultez la page Audit Trail pour des détails complets des
                    actions.
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Info Panel */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
            <Box sx={{ fontSize: '0.85rem', color: 'textSecondary' }}>
              <strong>ℹ️ Informations:</strong>
              <Box sx={{ mt: 1 }}>
                • Les données de sécurité sont rafraîchies automatiquement toutes
                les 30 secondes
              </Box>
              <Box>
                • Les IPs suspectes sont celles avec plus de 5 erreurs dans les
                dernières 24h
              </Box>
              <Box>
                • Consultez l'onglet "Audit Trail" pour voir l'historique complet
                des actions
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
