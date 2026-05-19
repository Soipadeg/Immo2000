/**
 * Page de sélection d'un notaire pour une transaction
 * L'acheteur et vendeur choisissent conjointement le notaire partenaire
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transactionsApi, notairesApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Alert, Input } from '@/components';
import '../styles/SelectNotairePage.css';



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
      <div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="container">
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <h4>
        Sélectionner un Notaire
      </p>

      {/* Infos transaction */}
      <div className="card">
        <div className="card">
          <div className="grid-container">
            <div className="grid-item">
              <p>
                Bien à vendre
              </p>
              <p>
                {transaction?.annonce?.titre}
              </p>
            </div>
            <div className="grid-item">
              <p>
                Localisation
              </p>
              <p>
                {transaction?.annonce?.code_postal} {transaction?.annonce?.ville}
              </p>
            </div>
            <div className="grid-item">
              <p>
                Prix du compromis
              </p>
              <p>
                {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
              </p>
            </div>
          </div>
        </div>
      </div>

      <Divider sx={{ my: 4 }} />

      {/* Recherche de notaires */}
      <div>
        <h4>
          Rechercher un Notaire
        </p>

        <div>
          <Input
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
            {searching ? <span>Loading...</span> : 'Rechercher'}
          </Button>
        </div>
      </div>

      {/* Résultats */}
      {notaires.length > 0 && (
        <div>
          <h4>
            Notaires Disponibles ({notaires.length})
          </p>

          <RadioGroup value={selectedNotaire} onChange={(e) => setSelectedNotaire(e.target.value)}>
            <div className="grid-container">
              {notaires.map((notaire) => (
                <div className="grid-item">
                  <div className="card">
                    <div className="card">
                      <div>
                        <FormControlLabel
                          value={notaire.notaire_id.toString()}
                          control={<Radio />}
                          label=""
                          sx={{ mt: 0 }}
                        />

                        <div>
                          <p>
                            {notaire.etude_notariale}
                          </p>

                          <div>
                            <span className="icon-placeholder">LocationOnIcon</span>
                            <span>
                              {notaire.adresse_etude}, {notaire.code_postal_etude} {notaire.ville_etude}
                            </p>
                          </div>

                          <div>
                            <span className="icon-placeholder">PhoneIcon</span>
                            <span>{notaire.telephone}</p>
                          </div>

                          <div>
                            <span className="icon-placeholder">EmailIcon</span>
                            <span>{notaire.email_professionnel}</p>
                          </div>

                          {notaire.zone_geographique?.villes && (
                            <div>
                              <p>
                                Zones d'intervention:
                              </p>
                              <div>
                                {notaire.zone_geographique.villes.map((ville) => (
                                  <Chip key={ville} label={ville} size="small" variant="outlined" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedNotaire === notaire.notaire_id.toString() && (
                          <span className="icon-placeholder">CheckCircleIcon</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      {notaires.length === 0 && !searching && (
        <Alert severity="info" sx={{ mb: 4 }}>
          Effectuez une recherche pour voir les notaires disponibles dans votre zone
        </Alert>
      )}

      {/* Boutons d'action */}
      <div>
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
          {submitting ? <span>Loading...</span> : 'Confirmer la Sélection'}
        </Button>
      </div>

      {/* Dialog de succès */}
      <div className="modal"> setSuccessOpen(false)}>
        <div className="modal">Notaire sélectionné</DialogTitle>
        <div className="modal">
          <p>
            Le notaire a été sélectionné avec succès. Vous pouvez maintenant valider les frais notaire.
          </p>
        </DialogContent>
        <div className="modal">
          <Button onClick={() => setSuccessOpen(false)} variant="contained">
            OK
          </Button>
        </DialogActions>
      </div>
    </div>
  );
}