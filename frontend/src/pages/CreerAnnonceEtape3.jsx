import '../styles/CreerAnnonceEtape3.css';
import React
import { Button, Alert, Input } from '@/components';, { useState } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';





import { signContratExclusivite } from '../services/api';

/**
 * Page ÉTAPE 3 du tunnel : Contrat d'exclusivité
 *
 * Utilisateur peut choisir :
 * - OUI : Signer le contrat d'exclusivité (préparation pour outils IA futurs)
 * - NON : Publier son annonce sans contrat
 */
export default function CreerAnnonceEtape3() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const annonceId = searchParams.get('annonce_id');

  const [accepte, setAccepte] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState(null); // 'yes' ou 'no'

  const handleSignContract = async () => {
    if (!accepte) {
      setError('Vous devez cocher la case pour accepter le contrat');
      return;
    }

    setLoading(true);
    try {
      await signContratExclusivite({ accepte: true });
      // Rediriger vers étape 4
      navigate(`/creer-annonce/etape4?annonce_id=${annonceId}&with_contract=true`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la signature du contrat');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipContract = () => {
    // Passer directement à l'étape 4 sans contrat
    navigate(`/creer-annonce/etape4?annonce_id=${annonceId}&with_contract=false`);
  };

  return (
    <div maxWidth="md">
      <div sx={{ py: 4 }}>
        {/* Titre */}
        <div sx={{ mb: 4, textAlign: 'center' }}>
          <h1  component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            🤖 Outils IA (Bientôt disponibles)
          </h1>
          <p  sx={{ color: 'text.secondary', mb: 2 }}>
            Étape 3 sur 4 : Contrat d'exclusivité
          </h1>
          <LinearProgress variant="determinate" value={75} sx={{ mt: 2 }} />
        </div>

        {/* Erreurs */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Intro */}
        <div sx={{ mb: 4 }}>
          <Alert severity="info">
            Vous pouvez choisir de signer un <strong>contrat d'exclusivité</strong> avec Immo2000 pour avoir accès à
            nos <strong>outils IA futurs</strong> qui accélèreront la vente de votre bien. Sinon, publiez votre annonce
            directement.
          </Alert>
        </div>

        {/* Option 1: Avec contrat */}
        <div
          sx={{
            mb: 3,
            border: selectedOption === 'yes' ? '2px solid' : '1px solid',
            borderColor: selectedOption === 'yes' ? 'primary.main' : 'divider',
            cursor: 'pointer',
            backgroundColor: selectedOption === 'yes' ? 'action.selected' : 'background.paper',
          }}
          onClick={() => setSelectedOption('yes')}
        >
          <div>
            <h3  sx={{ fontWeight: 'bold', mb: 2 }}>
              ✅ Signer le contrat d'exclusivité
            </h1>

            <span  sx={{ mb: 2, color: 'text.secondary' }}>
              En signant, Immo2000 devient votre partenaire exclusif pour la vente. Vous aurez accès à nos outils IA
              avancés pour maximiser vos chances de vente.
            </h1>

            {/* Avantages */}
            <List sx={{ p: 0 }}>
              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <EmojiObjectsIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Matching intelligent"
                  secondary="Notre IA trouve les acheteurs les plus adaptés à votre bien"
                />
              </ListItem>

              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <TrendingUpIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Estimation de prix précise"
                  secondary="IA analyse le marché pour proposer le meilleur prix"
                />
              </ListItem>

              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <CalendarMonthIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Gestion d'agenda IA"
                  secondary="Planifiez automatiquement vos visites et rendez-vous"
                />
              </ListItem>

              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AssessmentIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Analytics détaillés"
                  secondary="Suivez les performances de votre annonce en temps réel"
                />
              </ListItem>

              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <FavoriteBorderIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Support prioritaire"
                  secondary="Accès à notre équipe d'experts immobiliers"
                />
              </ListItem>
            </List>

            {/* Tarif */}
            <div
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: 'success.light',
                borderRadius: 1,
                borderLeft: '4px solid',
                borderColor: 'success.main',
              }}
            >
              <span  sx={{ color: 'success.dark', fontWeight: 'bold' }}>
                💰 Commission: 1.5% du prix de vente (uniquement en cas de transaction réussie)
              </h1>
            </div>
          </div>
        </div>

        {/* Option 2: Sans contrat */}
        <div
          sx={{
            mb: 4,
            border: selectedOption === 'no' ? '2px solid' : '1px solid',
            borderColor: selectedOption === 'no' ? 'primary.main' : 'divider',
            cursor: 'pointer',
            backgroundColor: selectedOption === 'no' ? 'action.selected' : 'background.paper',
          }}
          onClick={() => setSelectedOption('no')}
        >
          <div>
            <h3  sx={{ fontWeight: 'bold', mb: 2 }}>
              ⏭️ Publier sans contrat
            </h1>

            <span  sx={{ mb: 2, color: 'text.secondary' }}>
              Publiez votre annonce directement sans contrat. Vous aurez accès aux fonctionnalités de base.
            </h1>

            {/* Avantages basiques */}
            <List sx={{ p: 0 }}>
              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemText primary="✓ Publier votre annonce gratuitement" />
              </ListItem>

              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemText primary="✓ Recevoir des messages d'acheteurs potentiels" />
              </ListItem>

              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemText primary="✓ Gérer vos annonces depuis votre dashboard" />
              </ListItem>

              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemText primary="⚠️ Pas d'accès aux outils IA (pour l'instant)" />
              </ListItem>
            </List>

            <div sx={{ mt: 2, p: 2, backgroundColor: 'warning.light', borderRadius: 1 }}>
              <span  sx={{ color: 'warning.dark' }}>
                📝 <strong>Vous pouvez toujours signer le contrat plus tard</strong> depuis votre dashboard.
              </h1>
            </div>
          </div>
        </div>

        {/* Formulaire si "Oui" sélectionné */}
        {selectedOption === 'yes' && (
          <div elevation={2} sx={{ p: 3, mb: 3, backgroundColor: 'action.hover' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={accepte}
                  onChange={(e) => setAccepte(e.target.checked)}
                />
              }
              label={
                <span >
                  J'accepte les conditions du contrat d'exclusivité et la commission de 1.5% en cas de vente
                </h1>
              }
            />
          </div>
        )}

        {/* Boutons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={() => navigate(-1)}
          >
            Retour
          </Button>

          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={handleSignContract}
            disabled={selectedOption !== 'yes' || !accepte || loading}
          >
            {loading ? 'Signature en cours...' : 'Signer et continuer'}
          </Button>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSkipContract}
            disabled={selectedOption !== 'no'}
          >
            Publier sans contrat
          </Button>
        </Stack>

        {/* Info */}
        <div sx={{ mt: 4, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
          <span  sx={{ color: 'info.dark' }}>
            💡 <strong>À savoir :</strong> Le contrat d'exclusivité vous engage uniquement pour les ventes conclues
            via Immo2000. Les outils IA vous feront gagner du temps et augmenteront vos chances de vente.
          </h1>
        </div>
      </div>
    </div>
  );
}
