import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
} from '@mui/material';
import { KeyboardArrowDown as KeyboardArrowDownIcon, KeyboardArrowUp as KeyboardArrowUpIcon } from '@mui/icons-material';
import axios from 'axios';
import './SimulateurPret.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const SimulateurPret = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    revenu_mensuel_net: '',
    apport: '',
    taux_interet: 3.5,
    duree_ans: 20,
    taux_assurance: 0.3,
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showFullTable, setShowFullTable] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Récupérer le token JWT
  const token = localStorage.getItem('auth_token');

  // Effectuer l'appel API
  const fetchResults = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/simulateur-pret`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setResults(response.data);
      setSuccess('Calcul effectué avec succès !');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setError(err.response?.data?.detail || 'Erreur lors du calcul. Veuillez vérifier vos données.');
      }
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Debounce pour le calcul automatique
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      const revenu = parseFloat(formData.revenu_mensuel_net);
      if (revenu > 0) {
        const payload = {
          revenu_mensuel_net: revenu,
          apport: parseFloat(formData.apport) || 0,
          taux_interet: parseFloat(formData.taux_interet),
          duree_ans: parseInt(formData.duree_ans),
          taux_assurance: parseFloat(formData.taux_assurance),
        };
        fetchResults(payload);
      }
    }, 500);

    setDebounceTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [formData, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleReset = () => {
    setFormData({
      revenu_mensuel_net: '',
      apport: '',
      taux_interet: 3.5,
      duree_ans: 20,
      taux_assurance: 0.3,
    });
    setResults(null);
    setError(null);
    setSuccess(null);
    setShowFullTable(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderAmortissementTable = () => {
    if (!results?.tableau_amortissement || results.tableau_amortissement.length === 0) {
      return null;
    }

    const rows = showFullTable
      ? results.tableau_amortissement
      : results.tableau_amortissement.slice(0, 12);

    return (
      <TableContainer component={Paper} className="amortissement-table-container">
        <h3 className="amortissement-title">📋 Tableau d'amortissement</h3>
        <Table className="amortissement-table">
          <TableHead>
            <TableRow className="table-header">
              <TableCell>Mois</TableCell>
              <TableCell align="right">Capital restant</TableCell>
              <TableCell align="right">Intérêts</TableCell>
              <TableCell align="right">Assurance</TableCell>
              <TableCell align="right">Mensualité</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index} className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                <TableCell>{row.mois}</TableCell>
                <TableCell align="right">{formatCurrency(row.capital_restant)}</TableCell>
                <TableCell align="right">{formatCurrency(row.interets)}</TableCell>
                <TableCell align="right">{formatCurrency(row.assurance)}</TableCell>
                <TableCell align="right">{formatCurrency(row.mensualite)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {results.tableau_amortissement.length > 12 && (
          <Box sx={{ padding: '15px', textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setShowFullTable(!showFullTable)}
              size="small"
            >
              {showFullTable ? 'Voir moins' : `Voir tout le tableau (${results.tableau_amortissement.length} mois)`}
            </Button>
          </Box>
        )}
      </TableContainer>
    );
  };

  return (
    <div className="simulateur-pret-page">
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box className="page-header" sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom className="page-title">
            🏠 Simulateur de Prêt Immobilier
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Estimez votre capacité d'emprunt en fonction de vos revenus et apport
          </Typography>
        </Box>

        {/* Form Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
            📝 Vos informations financières
          </Typography>

          <Grid container spacing={2}>
            {/* Revenu Mensuel Net */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Revenu mensuel net (€) *"
                name="revenu_mensuel_net"
                type="number"
                value={formData.revenu_mensuel_net}
                onChange={handleInputChange}
                inputProps={{ min: 1, step: 100 }}
                placeholder="Ex: 3000"
                variant="outlined"
                required
              />
            </Grid>

            {/* Apport */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apport (€)"
                name="apport"
                type="number"
                value={formData.apport}
                onChange={handleInputChange}
                inputProps={{ min: 0, step: 1000 }}
                placeholder="Ex: 50000"
                variant="outlined"
              />
            </Grid>

            {/* Taux d'intérêt */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Taux d'intérêt (%)"
                name="taux_interet"
                type="number"
                value={formData.taux_interet}
                onChange={handleInputChange}
                inputProps={{ min: 0, max: 15, step: 0.1 }}
                variant="outlined"
              />
            </Grid>

            {/* Durée */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Durée (ans)"
                name="duree_ans"
                type="number"
                value={formData.duree_ans}
                onChange={handleInputChange}
                inputProps={{ min: 1, max: 30, step: 1 }}
                variant="outlined"
              />
            </Grid>

            {/* Taux Assurance */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Taux assurance (%)"
                name="taux_assurance"
                type="number"
                value={formData.taux_assurance}
                onChange={handleInputChange}
                inputProps={{ min: 0, max: 1, step: 0.01 }}
                variant="outlined"
              />
            </Grid>

            {/* Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleReset}
                  size="medium"
                >
                  Réinitialiser
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Results Section */}
        {results && !loading && (
          <Box>
            {/* Results Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {/* Capacité d'emprunt */}
              <Grid item xs={12} sm={6} md={4}>
                <Card className="result-card" elevation={3}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Capacité d'emprunt
                    </Typography>
                    <Typography variant="h5" component="div" className="result-value">
                      💰
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mt: 1 }}>
                      {formatCurrency(results.capacite_emprunt)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Mensualité */}
              <Grid item xs={12} sm={6} md={4}>
                <Card className="result-card" elevation={3}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Mensualité
                    </Typography>
                    <Typography variant="h5" component="div" className="result-value">
                      📅
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mt: 1 }}>
                      {formatCurrency(results.mensualite)}
                      <Typography variant="body2" color="textSecondary">
                        /mois
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Coût total */}
              <Grid item xs={12} sm={6} md={4}>
                <Card className="result-card" elevation={3}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography color="textSecondary" gutterBottom>
                      Coût total du crédit
                    </Typography>
                    <Typography variant="h5" component="div" className="result-value">
                      💵
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mt: 1 }}>
                      {formatCurrency(results.cout_total_credit)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Amortissement Table */}
            {renderAmortissementTable()}
          </Box>
        )}
      </Container>
    </div>
  );
};

export default SimulateurPret;
