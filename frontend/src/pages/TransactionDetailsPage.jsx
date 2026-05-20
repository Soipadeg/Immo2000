import '../styles/TransactionDetailsPage.css';
import { Alert,Button,Input } from '@/components';
/**
 * Page de détails d'une transaction
 * Affiche la timeline, les documents, les paiements, les frais
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
      {value === index && <div>{children}</div>}
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
      <div>
        <div />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div maxWidth="lg">
        <Alert severity="error">Transaction introuvable</Alert>
      </div>
    );
  }

  return (
    <div maxWidth="lg">
      {error && <Alert severity="error">{error}</Alert>}

      {/* En-tête */}
      <div>
        <h4>
          Détails de la Transaction
        </h4>
        <span
          label={getStatusLabel(transaction?.statut)}
          color={getStatusColor(transaction?.statut)}
          variant="filled"
        />
      </div>

      {/* Cards résumé */}
      <div container spacing={3}>
        {/* Bien */}
        <div item xs={12} sm={6} md={4}>
          <div>
            <div>
              <div>
                <HomeIcon color="primary" />
                <p variant="caption">
                  BIEN
                </h4>
              </div>
              <p>
                {transaction?.annonce?.titre}
              </h4>
              <p>
                {transaction?.annonce?.code_postal} {transaction?.annonce?.ville}
              </h4>
            </div>
          </div>
        </div>

        {/* Prix */}
        <div item xs={12} sm={6} md={4}>
          <div>
            <div>
              <div>
                <PaymentIcon color="success" />
                <p variant="caption">
                  PRIX VENTE
                </p>
              </div>
              <h5>
                {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
              </h5>
            </div>
          </div>
        </div>

        {/* Notaire */}
        <div item xs={12} sm={6} md={4}>
          <div>
            <div>
              <div>
                <PersonIcon color="primary" />
                <p variant="caption">
                  NOTAIRE
                </h5>
              </div>
              <p>
                {transaction?.notaire?.etude_notariale || 'À sélectionner'}
              </h5>
              <p>
                {transaction?.notaire?.email}
              </h5>
            </div>
          </div>
        </div>
      </div>

      <hr />

      {/* Tabs */}
      <div>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="📅 Timeline" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="💳 Paiements" id="tab-1" aria-controls="tabpanel-1" />
          <Tab label="💰 Frais & Commissions" id="tab-2" aria-controls="tabpanel-2" />
          <Tab label="📄 Documents" id="tab-3" aria-controls="tabpanel-3" />
          <Tab label="👥 Parties" id="tab-4" aria-controls="tabpanel-4" />
        </Tabs>
      </div>

      {/* Tab 0: Timeline */}
      <TabPanel value={tabValue} index={0}>
        <Timeline position="left">
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot>
                <CheckCircleIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <p>
                Offre créée
              </p>
              <p>
                Offre acceptée par le vendeur
              </p>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot>
                {transaction?.notaire ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <p>
                Notaire sélectionné
              </p>
              <p>
                {transaction?.notaire?.etude_notariale || 'En attente'}
              </p>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot>
                {transaction?.frais_valides ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <p>
                Frais validés
              </p>
              <p>
                {transaction?.frais_valides ? 'Frais et commissions approuvés' : 'En attente'}
              </p>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot>
                {transaction?.compromis_signe ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <p>
                Compromis signé
              </p>
              <p>
                {transaction?.compromis_signe ? 'Signature électronique complétée' : 'En attente'}
              </p>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot>
                {transaction?.depot_paye ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <p>
                Dépôt de garantie payé
              </p>
              <p>
                {transaction?.depot_paye ? '15% versé' : 'En attente'}
              </p>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot>
                {transaction?.statut === 'finalisee' ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
              </TimelineDot>
            </TimelineSeparator>
            <TimelineContent>
              <p>
                Acte authentique signé
              </p>
              <p>
                {transaction?.statut === 'finalisee' ? 'Vente finalisée ✅' : 'En attente'}
              </p>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </TabPanel>

      {/* Tab 1: Paiements */}
      <TabPanel value={tabValue} index={1}>
        <h6>
          Historique des Paiements
        </h6>

        <div component={Paper}>
          <table>
            <tbody>
              <tr>
                <td>Dépôt de garantie (15%)</td>
                <td align="right">
                  {(transaction?.prix_compromis * 0.15)?.toLocaleString('fr-FR')} €
                </td>
                <td align="right">
                  <span
                    label={transaction?.depot_paye ? 'Payé' : 'En attente'}
                    color={transaction?.depot_paye ? 'success' : 'warning'}
                    size="small"
                  />
                </td>
              </tr>
              <tr>
                <td>Solde (85%)</td>
                <td align="right">
                  {(transaction?.prix_compromis * 0.85)?.toLocaleString('fr-FR')} €
                </td>
                <td align="right">
                  <span
                    label={transaction?.statut === 'finalisee' ? 'Payé' : 'En attente'}
                    color={transaction?.statut === 'finalisee' ? 'success' : 'warning'}
                    size="small"
                  />
                </td>
              </tr>
              <tr>
                <td>TOTAL</td>
                <td align="right">
                  {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
                </td>
                <td align="right">
                  <span
                    label={transaction?.statut === 'finalisee' ? 'PAYÉ' : 'PARTIEL'}
                    color={transaction?.statut === 'finalisee' ? 'success' : 'warning'}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </TabPanel>

      {/* Tab 2: Frais & Commissions */}
      <TabPanel value={tabValue} index={2}>
        <h6>
          Décomposition des Frais
        </h6>

        <div component={Paper}>
          <table>
            <tbody>
              <tr>
                <td>Prix de vente (HT)</td>
                <td align="right">{transaction?.prix_compromis?.toLocaleString('fr-FR')} €</td>
              </tr>
              <tr>
                <td>
                  <p>
                    Frais de notaire (~{transaction?.pourcentage_frais || '7.5'}%)
                  </h6>
                </td>
                <td align="right">{transaction?.montant_frais?.toLocaleString('fr-FR')} €</td>
              </tr>
              <tr>
                <td>TVA sur frais (20%)</td>
                <td align="right">{transaction?.tva_frais?.toLocaleString('fr-FR')} €</td>
              </tr>
              <tr>
                <td>Commission Immo2000 (2%)</td>
                <td align="right">
                  {transaction?.commission_immo2000?.toLocaleString('fr-FR')} €
                </td>
              </tr>
              <tr>
                <td>TOTAL À PAYER (TTC)</td>
                <td align="right">
                  {transaction?.montant_total_frais?.toLocaleString('fr-FR')} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </TabPanel>

      {/* Tab 3: Documents */}
      <TabPanel value={tabValue} index={3}>
        <h6>
          Documents et Fichiers
        </h6>

        <ul>
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
            <li key={idx}>
              <span>
                <doc.icon color={doc.available ? 'success' : 'disabled'} />
              </span>
              <span
                primary={doc.name}
                secondary={doc.available ? 'Disponible au téléchargement' : 'Indisponible'}
              />
              {doc.available && (
                <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />}>
                  Télécharger
                </Button>
              )}
            </li>
          ))}
        </ul>
      </TabPanel>

      {/* Tab 4: Parties */}
      <TabPanel value={tabValue} index={4}>
        <h6>
          Informations des Parties
        </h6>

        <div container spacing={3}>
          {/* Vendeur */}
          <div item xs={12} md={6}>
            <div>
              <div>
                <p>
                  👨 Vendeur
                </h6>
                <p>
                  <strong>Nom:</strong> {transaction?.vendeur?.full_name}
                </h6>
                <p>
                  <strong>Email:</strong> {transaction?.vendeur?.email}
                </h6>
                <p>
                  <strong>Téléphone:</strong> {transaction?.vendeur?.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Acheteur */}
          <div item xs={12} md={6}>
            <div>
              <div>
                <p>
                  👩 Acheteur
                </p>
                <p>
                  <strong>Nom:</strong> {transaction?.acheteur?.full_name}
                </p>
                <p>
                  <strong>Email:</strong> {transaction?.acheteur?.email}
                </p>
                <p>
                  <strong>Téléphone:</strong> {transaction?.acheteur?.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Notaire */}
          {transaction?.notaire && (
            <div item xs={12} md={6}>
              <div>
                <div>
                  <p>
                    ⚖️ Notaire
                  </p>
                  <p>
                    <strong>Étude:</strong> {transaction?.notaire?.etude_notariale}
                  </p>
                  <p>
                    <strong>Email:</strong> {transaction?.notaire?.email}
                  </p>
                  <p>
                    <strong>Téléphone:</strong> {transaction?.notaire?.phone}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </TabPanel>

      {/* Boutons d'action */}
      <div>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Retour
        </Button>
        {transaction?.statut === 'finalisee' && (
          <Button variant="contained" color="success" fullWidth>
            📄 Télécharger les Documents Finaux
          </Button>
        )}
      </div>
    </div>
  );
}
