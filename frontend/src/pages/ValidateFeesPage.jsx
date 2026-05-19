import '../styles/ValidateFeesPage.css';
/**
 * Page de validation des frais notaire
 * Affiche les frais calculés, commission Immo2000, et permet de valider
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transactionsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Alert, Input } from '@/components';



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
      <div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="container">
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <h4>
        Validation des Frais Notaire
      </h4>

      {/* Infos transaction */}
      <div className="card">
        <div className="card">
          <div className="grid-container">
            <div className="grid-item">
              <p>
                Bien
              </p>
              <h4>
                {transaction?.annonce?.titre}
              </h4>
            </div>

            <div className="grid-item">
              <p>
                Prix de vente
              </p>
              <h4>
                {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
              </h4>
            </div>

            <div className="grid-item">
              <p>
                Notaire
              </p>
              <p>
                {transaction?.notaire?.etude_notariale || 'Non sélectionné'}
              </p>
            </div>

            <div className="grid-item">
              <p>
                Localité
              </p>
              <p>
                {transaction?.annonce?.code_postal} {transaction?.annonce?.ville}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Divider sx={{ my: 4 }} />

      {/* Détail des frais */}
      <h4>
        Détail des Frais
      </h4>

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
                  <div>
                    <span>
                      Frais de notaire
                    </span>
                    <p>
                      {fees.pourcentage_frais}% selon tarif légal
                    </p>
                  </div>
                </TableCell>
                <TableCell align="right">
                  <span>
                    {fees.montant_frais?.toLocaleString('fr-FR')} €
                  </span>
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
      <div className="card">
        <div className="card">
          <p>
            📊 Récapitulatif
          </p>

          <div className="grid-container">
            <div className="grid-item">
              <div>
                <p>
                  Frais notaire (HT)
                </p>
                <h4>
                  {fees?.montant_frais?.toLocaleString('fr-FR')} €
                </h4>
              </div>
            </div>

            <div className="grid-item">
              <div>
                <p>
                  Commission Immo2000 (2%)
                </p>
                <h4>
                  {fees?.commission_immo2000?.toLocaleString('fr-FR')} €
                </h4>
              </div>
            </div>

            <div className="grid-item">
              <div>
                <p>
                  Montant total (frais + commission TTC)
                </p>
                <h4>
                  {fees?.montant_total?.toLocaleString('fr-FR')} €
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions */}
      <Alert severity="info" sx={{ mb: 4 }}>
        ℹ️ Ces frais sont <strong>estimés</strong> selon la réglementation. Le notaire confirmera le montant exact lors de
        la signature du compromis.
      </Alert>

      {/* Boutons d'action */}
      <div>
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
          {submitting ? <span>Loading...</span> : 'Valider et Continuer'}
        </Button>
      </div>

      {/* Modal de Succès */}
      {successOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>✓ Frais Validés</h2>
            </div>
            <div className="modal-body">
              <p>
                Les frais ont été validés avec succès. Vous pouvez maintenant procéder à la signature du compromis.
              </p>
            </div>
            <div className="modal-footer">
              <Button onClick={() => setSuccessOpen(false)} variant="contained">
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
