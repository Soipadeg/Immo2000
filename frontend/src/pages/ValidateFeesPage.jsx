/**
 * Page de validation des frais notaire
 * Affiche les frais calculés, commission Immo2000, et permet de valider
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { transactionsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function ValidateFeesPage() {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState(null);
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  // Charger la transaction et calculer les frais
  useEffect(() => {
    const loadData = async () => {
      try {
        const txRes = await transactionsApi.getById(transactionId);
        setTransaction(txRes.data);

        // Récupérer les frais calculés
        const feesRes = await transactionsApi.calculateFees(transactionId);
        setFees(feesRes.data);

        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error(err);
        setLoading(false);
      }
    };

    if (transactionId) {
      loadData();
    }
  }, [transactionId]);

  const handleValidateFees = async () => {
    try {
      setSubmitting(true);

      // Valider les frais
      await transactionsApi.validateFees(transactionId, {
        montant_frais: fees?.montant_frais,
        commission_immo2000: fees?.commission_immo2000,
        montant_total: fees?.montant_total,
      });

      setSuccessOpen(true);
      setTimeout(() => {
        navigate(`/transactions/${transactionId}/sign-compromis`);
      }, 1500);
    } catch (err) {
      setError('Erreur lors de la validation des frais');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Validation des Frais Notaire
      </Typography>

      {/* Infos transaction */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography color="textSecondary" gutterBottom>
                Bien
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {transaction?.annonce?.titre}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography color="textSecondary" gutterBottom>
                Prix de vente
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography color="textSecondary" gutterBottom>
                Notaire
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {transaction?.notaire?.etude_notariale || 'Non sélectionné'}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography color="textSecondary" gutterBottom>
                Localité
              </Typography>
              <Typography variant="subtitle1">
                {transaction?.annonce?.code_postal} {transaction?.annonce?.ville}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 4 }} />

      {/* Détail des frais */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Détail des Frais
      </Typography>

      {fees && (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableBody>
              {/* Prix base */}
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Prix de vente (HT)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
                </TableCell>
              </TableRow>

              {/* Frais notaire */}
              <TableRow>
                <TableCell sx={{ pl: 4 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Frais de notaire
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {fees.pourcentage_frais}% selon tarif légal
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {fees.montant_frais?.toLocaleString('fr-FR')} €
                  </Typography>
                </TableCell>
              </TableRow>

              {/* TVA frais */}
              <TableRow>
                <TableCell sx={{ pl: 4 }}>TVA sur frais (20%)</TableCell>
                <TableCell align="right">
                  {fees.tva_frais?.toLocaleString('fr-FR')} €
                </TableCell>
              </TableRow>

              {/* Commission Immo2000 */}
              <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Commission Immo2000 (2%)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {fees.commission_immo2000?.toLocaleString('fr-FR')} €
                </TableCell>
              </TableRow>

              {/* Total */}
              <TableRow sx={{ bgcolor: '#fff3e0' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                  TOTAL À PAYER (TTC)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'warning.main' }}>
                  {fees.montant_total?.toLocaleString('fr-FR')} €
                </TableCell>
              </TableRow>

              {/* Net vendeur */}
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  Net au vendeur après frais
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {(transaction?.prix_compromis - fees.montant_total)?.toLocaleString('fr-FR')} €
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Récapitulatif */}
      <Card sx={{ mb: 4, bgcolor: '#f0f8ff', border: '1px solid #0099ff' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            📊 Récapitulatif
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Frais notaire (HT)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {fees?.montant_frais?.toLocaleString('fr-FR')} €
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Commission Immo2000 (2%)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {fees?.commission_immo2000?.toLocaleString('fr-FR')} €
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '2px solid #0099ff' }}>
                <Typography variant="caption" color="textSecondary">
                  Montant total (frais + commission TTC)
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0099ff' }}>
                  {fees?.montant_total?.toLocaleString('fr-FR')} €
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Alert severity="info" sx={{ mb: 4 }}>
        ℹ️ Ces frais sont <strong>estimés</strong> selon la réglementation. Le notaire confirmera le montant exact lors de
        la signature du compromis.
      </Alert>

      {/* Boutons d'action */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          disabled={submitting}
          fullWidth
        >
          Retour
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleValidateFees}
          disabled={submitting || !fees}
          fullWidth
        >
          {submitting ? <CircularProgress size={24} /> : 'Valider et Continuer'}
        </Button>
      </Box>

      {/* Dialog Succès */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: 'success.main' }} />
          Frais Validés
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Les frais ont été validés avec succès. Vous pouvez maintenant procéder à la signature du compromis.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessOpen(false)} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
