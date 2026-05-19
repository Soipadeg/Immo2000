/**
 * Page Modération des Annonces (Admin)
 */

import React, { useState } from 'react';
import '../styles/ModerationPage.css';
import { Button, Alert, Input } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FlagIcon from '@mui/icons-material/Flag';

const ModerationPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [annonces, setAnnonces] = useState([
    {
      id: 1,
      titre: 'Maison suspecte',
      prix: 450000,
      ville: 'Paris',
      image: 'https://via.placeholder.com/300x200?text=Annonce+1',
      statut: 'sous_revue',
      raison: 'Prix anormalement bas',
      signalements: 3,
    },
    {
      id: 2,
      titre: 'Appartement normal',
      prix: 350000,
      ville: 'Lyon',
      image: 'https://via.placeholder.com/300x200?text=Annonce+2',
      statut: 'approuve',
      raison: null,
      signalements: 0,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  if (loading) {
    return (
      div sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleApprove = (id) => {
    setAnnonces(
      annonces.map((a) =>
        a.id === id ? { ...a, statut: 'approuve' } : a
      )
    );
  };

  const handleReject = (id) => {
    setSelectedAnnonce(annonces.find((a) => a.id === id));
    setOpenDialog(true);
  };

  const handleConfirmReject = () => {
    setAnnonces(
      annonces.map((a) =>
        a.id === selectedAnnonce.id ? { ...a, statut: 'rejetee', raison: rejectReason } : a
      )
    );
    setOpenDialog(false);
    setRejectReason('');
  };

  const pendingAnnonces = annonces.filter((a) => a.statut === 'sous_revue');

  return (
    div maxWidth="lg" sx={{ py: 4 }}>
      <div>
        🛡️ Modération des Annonces
      </div>
      <div>
        {pendingAnnonces.length} annonce{pendingAnnonces.length !== 1 ? 's' : ''} en attente de modération
      </div>

      {pendingAnnonces.length === 0 ? (
        div sx={{ textAlign: 'center', py: 8 }}>
          <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
          <div>
            ✅ Toutes les annonces ont été modérées!
          </div>
        </div>
      ) : (
        div container spacing={3}>
          {pendingAnnonces.map((annonce) => (
            div item xs={12} sm={6} lg={4} key={annonce.id}>
              div>
                divMedia
                  component="img"
                  height="200"
                  image={annonce.image}
                  alt={annonce.titre}
                />
                divContent>
                  div sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <div>
                      {annonce.titre}
                    </div>
                    <div
                      icon={<FlagIcon />}
                      label={`${annonce.signalements} signalement${annonce.signalements > 1 ? 's' : ''}`}
                      size="small"
                      color="warning"
                    />
                  </div>

                  <div>
                    📍 {annonce.ville}
                  </div>

                  <div>
                    {annonce.prix.toLocaleString()}€
                  </div>

                  {annonce.raison && (
                    div sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1, mb: 2 }}>
                      <div>
                        ⚠️ {annonce.raison}
                      </div>
                    </div>
                  )}
                </div>
                divActions>
                  <Button
                    size="small"
                    color="success"
                    variant="contained"
                    startIcon={<CheckIcon />}
                    onClick={() => handleApprove(annonce.id)}
                  >
                    Approuver
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={() => handleReject(annonce.id)}
                  >
                    Rejeter
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Rejet */}
      div open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        div>Rejeter l'annonce</div>
        div>
          <div>
            Merci de spécifier la raison du rejet:
          </div>
          <Input
            fullWidth
            multiline
            rows={4}
            placeholder="Raison du rejet (ex: Images de mauvaise qualité, prix anormal, etc.)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
        div>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
            disabled={!rejectReason.trim()}
          >
            Rejeter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModerationPage;
