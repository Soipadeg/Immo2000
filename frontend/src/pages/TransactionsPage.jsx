/**
 * Page de gestion des transactions notariales
 * Voir l'état des ventes en cours, sélectionner notaire, valider frais, payer
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Alert } from '@/components';
import { transactionsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/TransactionsPage.css';

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

function TransactionRow({ transaction, getActionButton }) {
  return (
    <div className="table-row">
      <div className="table-cell">
        {transaction.annonce?.titre || `Transaction #${transaction.transaction_notaire_id}`}
      </div>
      <div className="table-cell">
        {transaction.prix_compromis?.toLocaleString('fr-FR')} €
      </div>
      <div className="table-cell">
        <span className={`status-badge status-${transaction.statut}`}>
          {statutLabels[transaction.statut] || transaction.statut}
        </span>
      </div>
      <div className="table-cell">
        {transaction.notaire ? (
          <span>{transaction.notaire.etude_notariale}</span>
        ) : (
          <span className="text-secondary">Non sélectionné</span>
        )}
      </div>
      <div className="table-cell actions">
        {getActionButton(transaction)}
      </div>
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
    <TransactionRow transaction={transaction} getActionButton={getActionButton} />
  );

  if (loading) {
    return (
      <div className="transactions-container">
        <div className="loading-spinner">⏳ Chargement...</div>
      </div>
    );
  }

  const renderTable = (data) => {
    if (data.length === 0) {
      return <Alert type="info" title="Info" message="Aucune transaction pour cette catégorie." />;
    }

    return (
      <div className="transactions-table">
        <div className="table-header">
          <div className="table-cell">Bien</div>
          <div className="table-cell">Prix</div>
          <div className="table-cell">Statut</div>
          <div className="table-cell">Notaire</div>
          <div className="table-cell actions">Action</div>
        </div>
        {data.map((transaction) => (
          <TransactionRow key={transaction.transaction_notaire_id} transaction={transaction} />
        ))}
      </div>
    );
  };

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Mes Transactions Notariales</h1>
      </div>

      {error && <Alert type="error" title="Erreur" message={error} />}

      {/* Tabs Navigation */}
      <div className="tabs-nav">
        {[
          { label: `En cours (${activeTransactions.length})`, index: 0 },
          { label: `Finalisées (${completedTransactions.length})`, index: 1 },
          { label: `Échouées (${failedTransactions.length})`, index: 2 },
        ].map((tab) => (
          <button
            key={tab.index}
            className={`tab-btn ${activeTab === tab.index ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 0 && renderTable(activeTransactions)}
        {activeTab === 1 && renderTable(completedTransactions)}
        {activeTab === 2 && renderTable(failedTransactions)}
      </div>
    </div>
  );
}
