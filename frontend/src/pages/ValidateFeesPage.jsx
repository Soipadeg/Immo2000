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
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <div>
        Validation des Frais Notaire
      </div>

      {/* Infos transaction */}
      <div className="card">
        <div className="card">
          <div className="grid-container">
            <div className="grid-item">
              <div>
                Bien
              </div>
              <div>
                {transaction?.annonce?.titre}
              </div>
            </div>

            <div className="grid-item">
              <div>
                Prix de vente
              </div>
              <div>
                {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
              </div>
            </div>

            <div className="grid-item">
              <div>
                Notaire
              </div>
              <div>
                {transaction?.notaire?.etude_notariale || 'Non sélectionné'}
              </div>
            </div>

            <div className="grid-item">
              <div>
                Localité
              </div>
              <div>
                {transaction?.annonce?.code_postal} {transaction?.annonce?.ville}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Divider sx={{ my: 4 }} />

      {/* Détail des frais */}
      <div>
        Détail des Frais
      </div>

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
                    <div>
                      Frais de notaire
                    </div>
                    <div>
                      {fees.pourcentage_frais}% selon tarif légal
                    </div>
                  </div>
                </TableCell>
                <TableCell align="right">
                  <div>
                    {fees.montant_frais?.toLocaleString('fr-FR')} €
                  </div>
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
          <div>
            📊 Récapitulatif
          </div>

          <div className="grid-container">
            <div className="grid-item">
              <div>
                <div>
                  Frais notaire (HT)
                </div>
                <div>
                  {fees?.montant_frais?.toLocaleString('fr-FR')} €
                </div>
              </div>
            </div>

            <div className="grid-item">
              <div>
                <div>
                  Commission Immo2000 (2%)
                </div>
                <div>
                  {fees?.commission_immo2000?.toLocaleString('fr-FR')} €
                </div>
              </div>
            </div>

            <div className="grid-item">
              <div>
                <div>
                  Montant total (frais + commission TTC)
                </div>
                <div>
                  {fees?.montant_total?.toLocaleString('fr-FR')} €
                </div>
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
          {submitting ? <div>Loading...</div> : 'Valider et Continuer'}
        </Button>
      </div>

      {/* Modal de Succès */}
      {successOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>✓ Frais Validés</div>
            </div>
            <div className="modal-body">
              <div>
                Les frais ont été validés avec succès. Vous pouvez maintenant procéder à la signature du compromis.
              </div>
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
