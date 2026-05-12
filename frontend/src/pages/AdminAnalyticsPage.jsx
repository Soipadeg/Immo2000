/**
 * TÂCHE 6: Analytics - Statistiques Avancées
 */

import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, Grid, Card, CardContent,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { analyticsApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminAnalyticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState(null);
  const [listings, setListings] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (user?.role !== 'admin') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, usersRes, listingsRes, transRes] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getUsers(),
        analyticsApi.getListings(),
        analyticsApi.getTransactions(),
      ]);
      setSummary(sumRes.data?.data);
      setUsers(usersRes.data?.data);
      setListings(listingsRes.data?.data);
      setTransactions(transRes.data?.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#d084d0'];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>📊 Analytics</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* KPIs */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary">👥 Utilisateurs</Typography>
                  <Typography variant="h5">{summary?.utilisateurs?.total || 0}</Typography>
                  <Typography variant="caption">Actifs (30j): {summary?.utilisateurs?.actifs_derniers_30_jours}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary">🏠 Annonces</Typography>
                  <Typography variant="h5">{summary?.annonces?.total || 0}</Typography>
                  <Typography variant="caption">Publiées: {summary?.annonces?.publiees}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary">💰 Offres</Typography>
                  <Typography variant="h5">{summary?.offres?.total || 0}</Typography>
                  <Typography variant="caption">Taux conv: {summary?.offres?.taux_conversion_pct}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary">💵 Revenus</Typography>
                  <Typography variant="h5">€{(summary?.revenus?.valeur_totale_offres || 0).toLocaleString()}</Typography>
                  <Typography variant="caption">Moy: €{(summary?.revenus?.valeur_moyenne_offre || 0).toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Paper>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Utilisateurs" />
              <Tab label="Annonces" />
              <Tab label="Transactions" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Tab 0: Utilisateurs */}
              {tabValue === 0 && users && (
                <>
                  <Grid container spacing={3}>
                    {/* Rôles */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Répartition des rôles</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(users.repartition_roles || {}).map(([role, count]) => ({
                              name: role,
                              value: count,
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {Object.values(users.repartition_roles || {}).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Grid>

                    {/* Croissance */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Croissance</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={users.croissance_derniers_jours || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="nouveaux" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Grid>
                  </Grid>

                  {/* Top vendeurs */}
                  {users.top_vendeurs && users.top_vendeurs.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" gutterBottom>Top vendeurs</Typography>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                              <TableCell><strong>Nom</strong></TableCell>
                              <TableCell><strong>Email</strong></TableCell>
                              <TableCell><strong>Annonces</strong></TableCell>
                              <TableCell><strong>Vendues</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {users.top_vendeurs.map((seller) => (
                              <TableRow key={seller.user_id}>
                                <TableCell>{seller.nom}</TableCell>
                                <TableCell>{seller.email}</TableCell>
                                <TableCell>{seller.nombre_annonces}</TableCell>
                                <TableCell>{seller.annonces_vendues}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </>
              )}

              {/* Tab 1: Annonces */}
              {tabValue === 1 && listings && (
                <>
                  <Grid container spacing={3}>
                    {/* Par statut */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Par statut</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(listings.par_statut || {}).map(([status, count]) => ({
                              name: status,
                              value: count,
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {Object.values(listings.par_statut || {}).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Grid>

                    {/* Par type */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Par type</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={Object.entries(listings.par_type || {}).map(([type, count]) => ({
                          type,
                          count,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Grid>

                    {/* Villes */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>Top 15 villes</Typography>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                              <TableCell><strong>Ville</strong></TableCell>
                              <TableCell><strong>Annonces</strong></TableCell>
                              <TableCell><strong>Prix moyen</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(listings.annonces_par_ville || []).map((city) => (
                              <TableRow key={city.ville}>
                                <TableCell>{city.ville}</TableCell>
                                <TableCell>{city.count}</TableCell>
                                <TableCell>€{city.prix_moyen.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Tab 2: Transactions */}
              {tabValue === 2 && transactions && (
                <Grid container spacing={3}>
                  {/* Par statut */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Par statut</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(transactions.par_statut || {}).map(([status, count]) => ({
                            name: status,
                            value: count,
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {Object.values(transactions.par_statut || {}).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>

                  {/* Statistiques */}
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>📊 Statistiques</Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography>Taux conversion: {transactions.taux_conversion_pct}%</Typography>
                          <Typography>Taux négociation: {transactions.taux_negociation_pct}%</Typography>
                          <Typography>Temps moyen (j): {transactions.temps_moyen_jours}</Typography>
                          <Typography sx={{ mt: 2, fontWeight: 'bold' }}>Prix</Typography>
                          <Typography>Moyen proposé: €{transactions.prix?.moyen_propose?.toLocaleString()}</Typography>
                          <Typography>Total acceptées: €{transactions.prix?.total_acceptees?.toLocaleString()}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default AdminAnalyticsPage;
