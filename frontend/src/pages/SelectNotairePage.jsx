/**
 * Page de sélection d'un notaire pour une transaction
 * L'acheteur et vendeur choisissent conjointement le notaire partenaire
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
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Radio,
  FormControlLabel,
  RadioGroup,
  Paper,
  Divider,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { transactionsApi, notairesApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function SelectNotairePage() {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState(null);
  const [notaires, setNotaires] = useState([]);
  const [selectedNotaire, setSelectedNotaire] = useState('');
  const [codePostal, setCodePostal] = useState('');

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  // Charger la transaction
  useEffect(() => {
    const loadTransaction = async () => {
      try {
        const res = await transactionsApi.getById(transactionId);
        setTransaction(res.data);
        // Pré-remplir code postal si disponible
        if (res.data.annonce?.code_postal) {
          setCodePostal(res.data.annonce.code_postal);
        }
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement de la transaction');
        console.error(err);
        setLoading(false);
      }
    };

    loadTransaction();
  }, [transactionId]);

  // Rechercher les notaires
  const handleSearchNotaires = async () => {
    if (!codePostal) {
      setError('Veuillez entrer un code postal');
      return;
    }

    try {
      setSearching(true);
      const res = await notairesApi.searchByLocation(codePostal);
      setNotaires(res.data || []);
      setError('');
    } catch (err) {
      setError('Erreur lors de la recherche de notaires');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectNotaire = async () => {
    if (!selectedNotaire) {
      setError('Veuillez sélectionner un notaire');
      return;
    }

    try {
      setSubmitting(true);
      await transactionsApi.selectNotaire(transactionId, parseInt(selectedNotaire));
      setSuccessOpen(true);
      setTimeout(() => {
        navigate(`/transactions/${transactionId}/validate-fees`);
      }, 1500);
    } catch (err) {
      setError('Erreur lors de la sélection du notaire');
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
        Sélectionner un Notaire
      </Typography>

      {/* Infos transaction */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography color="textSecondary" gutterBottom>
                Bien à vendre
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {transaction?.annonce?.titre}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="textSecondary" gutterBottom>
                Localisation
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {transaction?.annonce?.code_postal} {transaction?.annonce?.ville}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="textSecondary" gutterBottom>
                Prix du compromis
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 4 }} />

      {/* Recherche de notaires */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Rechercher un Notaire
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Code postal"
            type="number"
            value={codePostal}
            onChange={(e) => setCodePostal(e.target.value)}
            placeholder="75001"
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleSearchNotaires}
            disabled={searching || !codePostal}
            sx={{ minWidth: '150px' }}
          >
            {searching ? <CircularProgress size={24} /> : 'Rechercher'}
          </Button>
        </Box>
      </Box>

      {/* Résultats */}
      {notaires.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Notaires Disponibles ({notaires.length})
          </Typography>

          <RadioGroup value={selectedNotaire} onChange={(e) => setSelectedNotaire(e.target.value)}>
            <Grid container spacing={2}>
              {notaires.map((notaire) => (
                <Grid item xs={12} key={notaire.notaire_id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedNotaire === notaire.notaire_id.toString() ? '2px solid' : '1px solid',
                      borderColor:
                        selectedNotaire === notaire.notaire_id.toString() ? 'primary.main' : 'divider',
                      bgcolor:
                        selectedNotaire === notaire.notaire_id.toString() ? 'action.selected' : 'background.paper',
                      transition: 'all 0.3s',
                      '&:hover': { boxShadow: 2 },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <FormControlLabel
                          value={notaire.notaire_id.toString()}
                          control={<Radio />}
                          label=""
                          sx={{ mt: 0 }}
                        />

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {notaire.etude_notariale}
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <LocationOnIcon sx={{ fontSize: '18px', color: 'textSecondary' }} />
                            <Typography variant="body2">
                              {notaire.adresse_etude}, {notaire.code_postal_etude} {notaire.ville_etude}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <PhoneIcon sx={{ fontSize: '18px', color: 'textSecondary' }} />
                            <Typography variant="body2">{notaire.telephone}</Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <EmailIcon sx={{ fontSize: '18px', color: 'textSecondary' }} />
                            <Typography variant="body2">{notaire.email_professionnel}</Typography>
                          </Box>

                          {notaire.zone_geographique?.villes && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="textSecondary">
                                Zones d'intervention:
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                {notaire.zone_geographique.villes.map((ville) => (
                                  <Chip key={ville} label={ville} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>

                        {selectedNotaire === notaire.notaire_id.toString() && (
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: '24px', mt: 1 }} />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </RadioGroup>
        </Box>
      )}

      {notaires.length === 0 && !searching && (
        <Alert severity="info" sx={{ mb: 4 }}>
          Effectuez une recherche pour voir les notaires disponibles dans votre zone
        </Alert>
      )}

      {/* Boutons d'action */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          disabled={submitting}
          fullWidth
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSelectNotaire}
          disabled={submitting || !selectedNotaire}
          fullWidth
        >
          {submitting ? <CircularProgress size={24} /> : 'Confirmer la Sélection'}
        </Button>
      </Box>

      {/* Dialog de succès */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle>Notaire sélectionné</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Le notaire a été sélectionné avec succès. Vous pouvez maintenant valider les frais notaire.
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
