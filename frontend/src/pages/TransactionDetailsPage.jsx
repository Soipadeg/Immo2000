/**
 * Page de détails d'une transaction
 * Affiche la timeline, les documents, les paiements, les frais
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
  Grid,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorIcon from '@mui/icons-material/Error';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import { transactionsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const getStatusColor = (status) => {
  switch (status) {
    case 'finalisee':
      return 'success';
    case 'en_attente_selection':
    case 'en_attente_frais':
    case 'en_attente_compromis':
    case 'en_attente_paiement':
      return 'warning';
    case 'en_attente_acte':
      return 'info';
    case 'annulee':
    case 'echec':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status) => {
  const labels = {
    en_attente_selection: 'En attente - Sélection notaire',
    en_attente_frais: 'En attente - Validation frais',
    en_attente_compromis: 'En attente - Signature compromis',
    en_attente_paiement: 'En attente - Paiement dépôt',
    en_attente_acte: 'En attente - Signature acte',
    finalisee: 'Finalisée',
    annulee: 'Annulée',
    echec: 'Échouée',
  };
  return labels[status] || status;
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TransactionDetailsPage() {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Charger la transaction
  useEffect(() => {
    const loadTransaction = async () => {
      try {
        const res = await transactionsApi.getById(transactionId);
        setTransaction(res.data);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement de la transaction');
        console.error(err);
        setLoading(false);
      }
    };

    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!transaction) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Transaction introuvable</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
          Détails de la Transaction
        </Typography>
        <Chip
          label={getStatusLabel(transaction?.statut)}
          color={getStatusColor(transaction?.statut)}
          variant="filled"
        />
      </Box>

      {/* Cards résumé */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Bien */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <HomeIcon color="primary" />
                <Typography color="textSecondary" variant="caption">
                  BIEN
                </Typography>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {transaction?.annonce?.titre}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {transaction?.annonce?.code_postal} {transaction?.annonce?.ville}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Prix */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PaymentIcon color="success" />
                <Typography color="textSecondary" variant="caption">
                  PRIX VENTE
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Notaire */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography color="textSecondary" variant="caption">
                  NOTAIRE
                </Typography>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {transaction?.notaire?.etude_notariale || 'À sélectionner'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {transaction?.notaire?.email}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="📅 Timeline" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="💳 Paiements" id="tab-1" aria-controls="tabpanel-1" />
          <Tab label="💰 Frais & Commissions" id="tab-2" aria-controls="tabpanel-2" />
          <Tab label="📄 Documents" id="tab-3" aria-controls="tabpanel-3" />
          <Tab label="👥 Parties" id="tab-4" aria-controls="tabpanel-4" />
        </Tabs>
      </Box>

      {/* Tab 0: Timeline */}
      <TabPanel value={tabValue} index={0}>
        <Timeline position="left">
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot sx={{ bgcolor: 'success.main' }}>
                <CheckCircleIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Offre créée
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Offre acceptée par le vendeur
              </Typography>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot sx={{ bgcolor: transaction?.notaire ? 'success.main' : 'warning.main' }}>
                {transaction?.notaire ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Notaire sélectionné
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {transaction?.notaire?.etude_notariale || 'En attente'}
              </Typography>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot sx={{ bgcolor: transaction?.frais_valides ? 'success.main' : 'warning.main' }}>
                {transaction?.frais_valides ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Frais validés
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {transaction?.frais_valides ? 'Frais et commissions approuvés' : 'En attente'}
              </Typography>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot sx={{ bgcolor: transaction?.compromis_signe ? 'success.main' : 'warning.main' }}>
                {transaction?.compromis_signe ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Compromis signé
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {transaction?.compromis_signe ? 'Signature électronique complétée' : 'En attente'}
              </Typography>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot sx={{ bgcolor: transaction?.depot_paye ? 'success.main' : 'warning.main' }}>
                {transaction?.depot_paye ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Dépôt de garantie payé
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {transaction?.depot_paye ? '15% versé' : 'En attente'}
              </Typography>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot sx={{ bgcolor: transaction?.statut === 'finalisee' ? 'success.main' : 'warning.main' }}>
                {transaction?.statut === 'finalisee' ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              </TimelineDot>
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Acte authentique signé
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {transaction?.statut === 'finalisee' ? 'Vente finalisée ✅' : 'En attente'}
              </Typography>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </TabPanel>

      {/* Tab 1: Paiements */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          Historique des Paiements
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Dépôt de garantie (15%)</TableCell>
                <TableCell align="right">
                  {(transaction?.prix_compromis * 0.15)?.toLocaleString('fr-FR')} €
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={transaction?.depot_paye ? 'Payé' : 'En attente'}
                    color={transaction?.depot_paye ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Solde (85%)</TableCell>
                <TableCell align="right">
                  {(transaction?.prix_compromis * 0.85)?.toLocaleString('fr-FR')} €
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={transaction?.statut === 'finalisee' ? 'Payé' : 'En attente'}
                    color={transaction?.statut === 'finalisee' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={transaction?.statut === 'finalisee' ? 'PAYÉ' : 'PARTIEL'}
                    color={transaction?.statut === 'finalisee' ? 'success' : 'warning'}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Tab 2: Frais & Commissions */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          Décomposition des Frais
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Prix de vente (HT)</TableCell>
                <TableCell align="right">{transaction?.prix_compromis?.toLocaleString('fr-FR')} €</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: 4 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Frais de notaire (~{transaction?.pourcentage_frais || '7.5'}%)
                  </Typography>
                </TableCell>
                <TableCell align="right">{transaction?.montant_frais?.toLocaleString('fr-FR')} €</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: 4 }}>TVA sur frais (20%)</TableCell>
                <TableCell align="right">{transaction?.tva_frais?.toLocaleString('fr-FR')} €</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Commission Immo2000 (2%)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {transaction?.commission_immo2000?.toLocaleString('fr-FR')} €
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#fff3e0' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>TOTAL À PAYER (TTC)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {transaction?.montant_total_frais?.toLocaleString('fr-FR')} €
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Tab 3: Documents */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          Documents et Fichiers
        </Typography>

        <List>
          {[
            { name: 'Compromis de vente (signé)', icon: AssignmentIcon, available: transaction?.compromis_signe },
            { name: 'Acte authentique (signé)', icon: AssignmentIcon, available: transaction?.statut === 'finalisee' },
            {
              name: 'Attestation de frais',
              icon: FileDownloadIcon,
              available: transaction?.frais_valides,
            },
            { name: 'Proof of payment (dépôt)', icon: PaymentIcon, available: transaction?.depot_paye },
          ].map((doc, idx) => (
            <ListItem key={idx} sx={{ bgcolor: idx % 2 === 0 ? '#f5f5f5' : 'white', mb: 1, borderRadius: 1 }}>
              <ListItemIcon>
                <doc.icon color={doc.available ? 'success' : 'disabled'} />
              </ListItemIcon>
              <ListItemText
                primary={doc.name}
                secondary={doc.available ? 'Disponible au téléchargement' : 'Indisponible'}
              />
              {doc.available && (
                <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />}>
                  Télécharger
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </TabPanel>

      {/* Tab 4: Parties */}
      <TabPanel value={tabValue} index={4}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          Informations des Parties
        </Typography>

        <Grid container spacing={3}>
          {/* Vendeur */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  👨 Vendeur
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Nom:</strong> {transaction?.vendeur?.full_name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {transaction?.vendeur?.email}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Téléphone:</strong> {transaction?.vendeur?.phone}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Acheteur */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  👩 Acheteur
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Nom:</strong> {transaction?.acheteur?.full_name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {transaction?.acheteur?.email}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Téléphone:</strong> {transaction?.acheteur?.phone}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Notaire */}
          {transaction?.notaire && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    ⚖️ Notaire
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Étude:</strong> {transaction?.notaire?.etude_notariale}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Email:</strong> {transaction?.notaire?.email}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Téléphone:</strong> {transaction?.notaire?.phone}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Boutons d'action */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Retour
        </Button>
        {transaction?.statut === 'finalisee' && (
          <Button variant="contained" color="success" fullWidth>
            📄 Télécharger les Documents Finaux
          </Button>
        )}
      </Box>
    </Container>
  );
}
