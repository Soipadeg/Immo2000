import '../styles/SelectNotairePage.css';
/**
 * Page de sélection d'un notaire pour une transaction
 * L'acheteur et vendeur choisissent conjointement le notaire partenaire
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transactionsApi, notairesApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Alert, Input } from '@/components';



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
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <div>
        Sélectionner un Notaire
      </div>

      {/* Infos transaction */}
      <div className="card">
        <div className="card">
          <div className="grid-container">
            <div className="grid-item">
              <div>
                Bien à vendre
              </div>
              <div>
                {transaction?.annonce?.titre}
              </div>
            </div>
            <div className="grid-item">
              <div>
                Localisation
              </div>
              <div>
                {transaction?.annonce?.code_postal} {transaction?.annonce?.ville}
              </div>
            </div>
            <div className="grid-item">
              <div>
                Prix du compromis
              </div>
              <div>
                {transaction?.prix_compromis?.toLocaleString('fr-FR')} €
              </div>
            </div>
          </div>
        </div>
      </div>

      <Divider sx={{ my: 4 }} />

      {/* Recherche de notaires */}
      <div>
        <div>
          Rechercher un Notaire
        </div>

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
            {searching ? <div>Loading...</div> : 'Rechercher'}
          </Button>
        </div>
      </div>

      {/* Résultats */}
      {notaires.length > 0 && (
        <div>
          <div>
            Notaires Disponibles ({notaires.length})
          </div>

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
                          <div>
                            {notaire.etude_notariale}
                          </div>

                          <div>
                            <div className="icon-placeholder">LocationOnIcon</div>
                            <div>
                              {notaire.adresse_etude}, {notaire.code_postal_etude} {notaire.ville_etude}
                            </div>
                          </div>

                          <div>
                            <div className="icon-placeholder">PhoneIcon</div>
                            <div>{notaire.telephone}</div>
                          </div>

                          <div>
                            <div className="icon-placeholder">EmailIcon</div>
                            <div>{notaire.email_professionnel}</div>
                          </div>

                          {notaire.zone_geographique?.villes && (
                            <div>
                              <div>
                                Zones d'intervention:
                              </div>
                              <div>
                                {notaire.zone_geographique.villes.map((ville) => (
                                  <Chip key={ville} label={ville} size="small" variant="outlined" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedNotaire === notaire.notaire_id.toString() && (
                          <div className="icon-placeholder">CheckCircleIcon</div>
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
          {submitting ? <div>Loading...</div> : 'Confirmer la Sélection'}
        </Button>
      </div>

      {/* Dialog de succès */}
      <div className="modal"> setSuccessOpen(false)}>
        <div className="modal">Notaire sélectionné</div>
        <div className="modal">
          <div>
            Le notaire a été sélectionné avec succès. Vous pouvez maintenant valider les frais notaire.
          </div>
        </div>
        <div className="modal">
          <Button onClick={() => setSuccessOpen(false)} variant="contained">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
