import '../styles/PaymentPage.css';
/**
 * Page de paiement via Stripe
 * Acheteur effectue le paiement du dépôt de garantie (15% du prix)
 * Intégration complète avec Stripe Elements
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '../components/StripePaymentForm';
import { stripePromise } from '../config/stripe-config';
import { transactionsApi, paymentsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Alert, Input } from '@/components';



const steps = ['Confirmation', 'Paiement', 'Succès'];

export default function PaymentPage() {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState(null);
  const [paiement, setPaiement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeStep, setActiveStep] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  // Calculs
  const prixVente = transaction?.prix_compromis || 0;
  const pourcentageDépôt = 0.15;
  const montantDépôt = Math.round(prixVente * pourcentageDépôt);
  const montantSolde = prixVente - montantDépôt;

  // Charger la transaction et créer l'intention de paiement
  useEffect(() => {
    const initPayment = async () => {
      try {
        const txRes = await transactionsApi.getById(transactionId);
        setTransaction(txRes.data);

        // Créer le paiement Stripe (PaymentIntent)
        const payRes = await paymentsApi.create({
          transaction_notaire_id: transactionId,
          montant: txRes.data.prix_compromis * pourcentageDépôt,
          type: 'depot_garantie',
          description: `Dépôt de garantie (15% de ${txRes.data.prix_compromis}€)`,
        });

        setPaiement(payRes.data);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors de l\'initialisation du paiement');
        console.error(err);
        setLoading(false);
      }
    };

    if (transactionId) {
      initPayment();
    }
  }, [transactionId]);

  // Confirmer paiement et avancer
  const handlePaymentSuccess = async (paymentData) => {
    try {
      setActiveStep(2);

      // Confirmer le paiement côté serveur
      await paymentsApi.confirm(paiement.paiement_id, {
        payment_intent_id: paymentData.paymentIntentId,
        charge_id: paymentData.chargeId,
      });

      setPaymentResult(paymentData);
      setSuccessOpen(true);

      // Redirection après 2 secondes
      setTimeout(() => {
        navigate(`/transactions/${transactionId}/sign-acte`);
      }, 2000);
    } catch (err) {
      setError('Erreur lors de la confirmation du paiement');
      console.error(err);
      setActiveStep(1);
    }
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
    setActiveStep(1);
  };

  const handleContinueToPayment = () => {
    if (!agreeTerms) {
      setError('Veuillez accepter les conditions');
      return;
    }
    setError('');
    setActiveStep(1);
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
        💳 Paiement du Dépôt de Garantie
      </div>

      {/* Stepper */}
      <div className="stepper">
        {steps.map((label) => (
          <div className="step">
            <div className="step">{label}</div>
          </div>
        ))}
      </div>

      {/* Étape 0: Confirmation */}
      {activeStep === 0 && (
        <>
          {/* Résumé de la transaction */}
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
                    Prix de vente (TTC)
                  </div>
                  <div>
                    {prixVente?.toLocaleString('fr-FR')} €
                  </div>
                </div>

                <div className="grid-item">
                  <div>
                    Dépôt à verser (15%)
                  </div>
                  <div>
                    {montantDépôt?.toLocaleString('fr-FR')} €
                  </div>
                </div>

                <div className="grid-item">
                  <div>
                    Solde futur (85%)
                  </div>
                  <div>
                    {montantSolde?.toLocaleString('fr-FR')} €
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Divider sx={{ my: 3 }} />

          {/* Conditions */}
          <div className="card">
            <div className="card">
              <div>
                ⚠️ Conditions
              </div>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                }
                label={
                  <div>
                    Je confirme que je suis le propriétaire de la carte bancaire utilisée et que j'autorise le
                    prélèvement du montant du dépôt.
                  </div>
                }
              />
            </div>
          </div>

          {/* Boutons */}
          <div>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              fullWidth
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleContinueToPayment}
              disabled={!agreeTerms}
              fullWidth
            >
              Continuer
            </Button>
          </div>
        </>
      )}

      {/* Étape 1: Formulaire de Paiement */}
      {activeStep === 1 && (
        <>
          <div className="card">
            <div className="card">
              <Alert severity="info" sx={{ mb: 3 }}>
                <div>
                  <div className="icon-placeholder">LockIcon</div>
                  <div>
                    Paiement sécurisé par <strong>Stripe</strong>. Vos données bancaires ne sont jamais partagées avec
                    Immo2000.
                  </div>
                </div>
              </Alert>

              {/* Utiliser Stripe Elements via le composant */}
              {!stripePromise ? (
                <Alert severity="warning">
                  Stripe n'est pas chargé. Assurez-vous que REACT_APP_STRIPE_PUBLIC_KEY est configuré.
                </Alert>
              ) : (
                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    clientSecret={paiement?.client_secret}
                    amount={montantDépôt}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              )}
            </div>
          </div>

          {/* Bouton retour */}
          <Button
            variant="outlined"
            onClick={() => setActiveStep(0)}
            fullWidth
          >
            ← Retour
          </Button>
        </>
      )}

      {/* Étape 2: Succès */}
      {activeStep === 2 && (
        <div className="card">
          <div className="card">
            <div className="icon-placeholder">CheckCircleIcon</div>
            <div>
              Paiement Réussi! ✅
            </div>
            <div>
              Votre dépôt de <strong>{montantDépôt?.toLocaleString('fr-FR')} €</strong> a été reçu avec succès.
            </div>
            <div>
              Vous serez redirigé vers la signature de l'acte authentique dans quelques secondes...
            </div>
            <div>
              <div>Loading...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}