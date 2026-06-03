import '../styles/RepondreOffrePage.css';
import { Alert,Button,Input } from '@/components';
/**
 * Page de réponse à une offre (accepter/refuser/négocier)
 * Vendeur répond à une offre reçue
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { offersApi, transactionsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';





export default function RepondreOffrePage() {
  const navigate = useNavigate();
  const { offerId } = useParams();
  const { user } = useAuth();

  const [offre, setOffre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  const [action, setAction] = useState('accepter'); // accepter | refuser | negocier
  const [contreProposition, setContreProposition] = useState('');

  // Charger l'offre
  useEffect(() => {
    const loadOffre = async () => {
      try {
        // TODO: Récupérer offre via API une fois endpoint disponible
        // Pour l'instant, on simule le chargement
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement de l\'offre');
        console.error(err);
        setLoading(false);
      }
    };

    loadOffre();
  }, [offerId]);

  const handleSubmit = async () => {
    if (!action) {
      setError('Veuillez choisir une action');
      return;
    }

    if (action === 'negocier' && !contreProposition) {
      setError('Veuillez entrer un montant de contre-proposition');
      return;
    }

    try {
      setSubmitting(true);

      const data = { action };
      if (action === 'negocier') {
        data.contre_proposition = parseFloat(contreProposition);
      }

      // Appeler l'API (à adapter avec vrai endpoint)
      // await offresApi.respond(offerId, data);

      setSuccessOpen(true);
      setTimeout(() => {
        navigate('/offres?responded=true');
      }, 1500);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de votre réponse');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div />
      </div>
    );
  }

  return (
    <div maxWidth="md">
      {error && <Alert severity="error">{error}</Alert>}

      <div>
        Répondre à une offre
      </div>

      {/* Résumé de l'offre */}
      <div>
        <div>
          <div container spacing={3}>
            <div item xs={12} sm={6}>
              <div>
                Prix proposé
              </div>
              <div>
                {offre?.prix_propose?.toLocaleString('fr-FR')} €
              </div>
            </div>

            <div item xs={12} sm={6}>
              <div>
                Votre prix de vente
              </div>
              <div>
                {offre?.prix_vente?.toLocaleString('fr-FR')} €
              </div>
            </div>

            {offre?.conditions_suspensives && (
              <div item xs={12}>
                <div>
                  Conditions suspensives
                </div>
                <div>
                  {offre.conditions_suspensives}
                </div>
              </div>
            )}

            {offre?.message && (
              <div item xs={12}>
                <div>
                  Message de l'acheteur
                </div>
                <div>
                  "{offre.message}"
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <hr />

      {/* Choix de l'action */}
      <div>
        Votre décision
      </div>

      <RadioGroup value={action} onChange={(e) => setAction(e.target.value)}>
        {/* Option 1: Accepter */}
        <div>
          <div>
            <FormControlLabel
              value="accepter"
              control={<Radio />}
              label={
                <div>
                  <div>
                    <CheckCircleIcon />
                    Accepter l'offre
                  </div>
                  <div>
                    L'offre sera acceptée, une transaction sera créée automatiquement
                  </div>
                </div>
              }
            />
          </div>
        </div>

        {/* Option 2: Refuser */}
        <div>
          <div>
            <FormControlLabel
              value="refuser"
              control={<Radio />}
              label={
                <div>
                  <div>
                    <CancelIcon />
                    Refuser l'offre
                  </div>
                  <div>
                    L'offre sera définitivement refusée
                  </div>
                </div>
              }
            />
          </div>
        </div>

        {/* Option 3: Négocier */}
        <div>
          <div>
            <FormControlLabel
              value="negocier"
              control={<Radio />}
              label={
                <div>
                  <div>
                    <AttachMoneyIcon />
                    Faire une contre-proposition
                  </div>
                  <div>
                    Proposer un autre montant à l'acheteur
                  </div>
                </div>
              }
            />

            {action === 'negocier' && (
              <Input
                fullWidth
                label="Montant contre-proposition (€)"
                type="number"
                inputProps={{ step: '100', min: '0' }}
                value={contreProposition}
                onChange={(e) => setContreProposition(e.target.value)}
                placeholder={offre?.prix_propose?.toString()}
              />
            )}
          </div>
        </div>
      </RadioGroup>

      {/* Boutons d'action */}
      <div>
        <Button
          variant="outlined"
          onClick={() => navigate('/offres')}
          disabled={submitting}
          fullWidth
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !action}
          fullWidth
        >
          {submitting ? <div size={24} /> : 'Confirmer ma réponse'}
        </Button>
      </div>

      {/* Dialog de succès */}
      <div open={successOpen} onClose={() => setSuccessOpen(false)}>
        <div>Réponse enregistrée</div>
        <div>
          <div>
            {action === 'accepter' && "L'offre a été acceptée avec succès. Une transaction est créée."}
            {action === 'refuser' && "L'offre a été refusée."}
            {action === 'negocier' && "Votre contre-proposition a été envoyée à l'acheteur."}
          </div>
        </div>
        <div>
          <Button onClick={() => setSuccessOpen(false)} variant="contained">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
