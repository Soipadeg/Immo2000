/**
 * Page de gestion des transactions notariales
 * Voir l'état des ventes en cours, sélectionner notaire, valider frais, payer
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorIcon from '@mui/icons-material/Error';
import { transactionsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const statutColors = {
  en_attente_selection: 'default',
  notaire_selectionne: 'info',
  frais_valides: 'success',
  compromis_signe: 'warning',
  paiement_depot: 'info',
  en_attente_paiement_solde: 'warning',
  finalisee: 'success',
};

const statutLabels = {
  en_attente_selection: 'En attente de sélection notaire',
  notaire_selectionne: 'Notaire sélectionné',
  frais_valides: 'Frais validés',
  compromis_signe: 'Compromis signé',
  paiement_depot: 'Paiement dépôt',
  en_attente_paiement_solde: 'En attente paiement solde',
  finalisee: 'Finalisée',
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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Charger les transactions
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const res = await transactionsApi.list();
        setTransactions(res.data || []);
      } catch (err) {
        setError('Erreur lors du chargement des transactions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // Filtrer par statut
  const activeTransactions = transactions.filter((t) =>
    ['en_attente_selection', 'notaire_selectionne', 'frais_valides', 'compromis_signe'].includes(
      t.statut
    )
  );

  const completedTransactions = transactions.filter((t) => t.statut === 'finalisee');
  const failedTransactions = transactions.filter((t) => t.statut === 'echouee');

  const getActionButton = (transaction) => {
    switch (transaction.statut) {
      case 'en_attente_selection':
        return (
          <Button
            size="small"
            variant="contained"
            onClick={() => navigate(`/transactions/${transaction.transaction_notaire_id}/select-notaire`)}
          >
            Sélectionner Notaire
          </Button>
        );
      case 'notaire_selectionne':
        return (
          <Button
            size="small"
            variant="contained"
            onClick={() => navigate(`/transactions/${transaction.transaction_notaire_id}/validate-fees`)}
          >
            Valider Frais
          </Button>
        );
      case 'frais_valides':
        return (
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => navigate(`/transactions/${transaction.transaction_notaire_id}/sign-compromis`)}
          >
            Signer Compromis
          </Button>
        );
      case 'compromis_signe':
        return (
          <Button
            size="small"
            variant="contained"
            color="warning"
            onClick={() => navigate(`/transactions/${transaction.transaction_notaire_id}/payment`)}
          >
            Effectuer Paiement
          </Button>
        );
      default:
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`/transactions/${transaction.transaction_notaire_id}`)}
          >
            Voir Détails
          </Button>
        );
    }
  };

  const TransactionRow = ({ transaction }) => (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {transaction.annonce?.titre || `Transaction #${transaction.transaction_notaire_id}`}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {transaction.prix_compromis?.toLocaleString('fr-FR')} €
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={statutLabels[transaction.statut] || transaction.statut}
          color={statutColors[transaction.statut]}
          size="small"
        />
      </TableCell>
      <TableCell>
        {transaction.notaire ? (
          <Typography variant="body2">{transaction.notaire.etude_notariale}</Typography>
        ) : (
          <Typography variant="body2" color="textSecondary">
            Non sélectionné
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">{getActionButton(transaction)}</TableCell>
    </TableRow>
  );

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

      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Mes Transactions Notariales
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          aria-label="transaction tabs"
        >
          <Tab label={`En cours (${activeTransactions.length})`} id="tab-0" />
          <Tab label={`Finalisées (${completedTransactions.length})`} id="tab-1" />
          <Tab label={`Échouées (${failedTransactions.length})`} id="tab-2" />
        </Tabs>
      </Box>

      {/* Onglet: En cours */}
      <TabPanel value={activeTab} index={0}>
        {activeTransactions.length === 0 ? (
          <Alert severity="info">
            Aucune transaction en cours. Créez une offre pour démarrer le processus de vente.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.paper' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Bien</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Prix</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Notaire</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeTransactions.map((transaction) => (
                  <TransactionRow key={transaction.transaction_notaire_id} transaction={transaction} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Onglet: Finalisées */}
      <TabPanel value={activeTab} index={1}>
        {completedTransactions.length === 0 ? (
          <Alert severity="info">Aucune transaction finalisée pour le moment.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.paper' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Bien</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Prix</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Notaire</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {completedTransactions.map((transaction) => (
                  <TransactionRow key={transaction.transaction_notaire_id} transaction={transaction} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Onglet: Échouées */}
      <TabPanel value={activeTab} index={2}>
        {failedTransactions.length === 0 ? (
          <Alert severity="info">Aucune transaction échouée.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.paper' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Bien</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Prix</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Notaire</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {failedTransactions.map((transaction) => (
                  <TransactionRow key={transaction.transaction_notaire_id} transaction={transaction} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
    </Container>
  );
}
