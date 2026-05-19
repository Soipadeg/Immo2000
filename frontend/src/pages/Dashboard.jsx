/**
 * Dashboard principal avec 3 onglets : Achat, Vente, Messagerie
 * Route: /dashboard
 * Protégé par JWT (hook useAuth)
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ShoppingBag,
  Home,
  Message,
  Add,
  FavoriteBorder,
  Favorite,
  Edit,
  Delete,
  Eye,
  MoreVert,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getMesAnnonces } from '../services/api';

/**
 * Composant Tab Panel
 */
function TabPanel(props) {
  const { children, value, index } = props;
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * ONGLET 1 : ACHAT - Recherche et favoris
 */
function AchatTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        🔍 Rechercher un bien
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Les fonctionnalités de recherche et de favoris seront bientôt disponibles !
      </Alert>

      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          Cherchez votre bien idéal parmi nos annonces
        </Typography>
        <Button variant="contained" color="primary">
          Consulter les annonces
        </Button>
      </Card>
    </Box>
  );
}

/**
 * ONGLET 2 : VENTE - Gestion des annonces
 */
function VenteTab({ user }) {
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('tous'); // tous, brouillons, publiees

  useEffect(() => {
    loadAnnonces();
  }, [filter]);

  const loadAnnonces = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (filter === 'brouillons') {
        params.statut = 'brouillon';
      } else if (filter === 'publiees') {
        params.statut = 'publiée';
      }

      const response = await getMesAnnonces(params);
      setAnnonces(response.annonces || []);
    } catch (err) {
      setError('Erreur lors du chargement des annonces');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnonce = async (annonceId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      // TODO: Implémenter l'API de suppression
      console.log('Supprimer annonce:', annonceId);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          📝 Mes annonces
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<Add />}
          onClick={() => navigate('/creer-annonce/etape1')}
        >
          Créer une annonce
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Filtres */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant={filter === 'tous' ? 'contained' : 'outlined'}
          onClick={() => setFilter('tous')}
        >
          Toutes ({annonces.length})
        </Button>
        <Button
          variant={filter === 'brouillons' ? 'contained' : 'outlined'}
          onClick={() => setFilter('brouillons')}
        >
          Brouillons
        </Button>
        <Button
          variant={filter === 'publiees' ? 'contained' : 'outlined'}
          onClick={() => setFilter('publiees')}
        >
          Publiées
        </Button>
      </Box>

      {/* Chargement */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Liste des annonces */}
      {!loading && annonces.length === 0 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
            Vous n'avez pas encore d'annonce {filter !== 'tous' ? `en ${filter}` : ''}
          </Typography>
          <Button
            variant="contained"
            color="success"
            startIcon={<Add />}
            onClick={() => navigate('/creer-annonce/etape1')}
          >
            Créer votre première annonce
          </Button>
        </Card>
      )}

      {/* Annonces */}
      {!loading && annonces.length > 0 && (
        <Grid container spacing={3}>
          {annonces.map((annonce) => (
            <Grid item xs={12} sm={6} md={4} key={annonce.annonce_id}>
              <Card sx={{ h: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Image */}
                <Box
                  sx={{
                    height: 200,
                    bgcolor: '#e0e0e0',
                    backgroundImage: annonce.photos_list?.length
                      ? `url(${annonce.photos_list[0]?.url})`
                      : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  <Chip
                    label={annonce.statut.toUpperCase()}
                    color={annonce.statut === 'publiée' ? 'success' : 'default'}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {annonce.titre}
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    📍 {annonce.adresse}, {annonce.code_postal}
                  </Typography>

                  {/* Détails */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {annonce.prix && (
                      <Chip
                        label={`${annonce.prix.toLocaleString('fr-FR')} €`}
                        variant="outlined"
                        color="primary"
                      />
                    )}
                    {annonce.surface && (
                      <Chip
                        label={`${annonce.surface} m²`}
                        variant="outlined"
                      />
                    )}
                    {annonce.nombre_pieces && (
                      <Chip
                        label={`${annonce.nombre_pieces} pièces`}
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {annonce.statut === 'brouillon' && (
                      <Button
                        size="small"
                        variant="contained"
                        fullWidth
                        onClick={() =>
                          navigate(`/creer-annonce/etape4?annonce_id=${annonce.annonce_id}`)
                        }
                      >
                        Continuer
                      </Button>
                    )}
                    {annonce.statut === 'publiée' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="info"
                        fullWidth
                        startIcon={<Eye />}
                      >
                        Voir
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleDeleteAnnonce(annonce.annonce_id)}
                      startIcon={<Delete />}
                    >
                      Supprimer
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Affichage du contrat d'exclusivité */}
      {user?.has_exclusivity_contract && (
        <Alert severity="success" sx={{ mt: 4 }}>
          ✅ <strong>Contrat d'exclusivité signé !</strong> Vous avez accès aux outils IA futurs
          pour optimiser la vente de vos biens. Une section dédiée aux outils IA sera bientôt
          disponible.
        </Alert>
      )}

      {!user?.has_exclusivity_contract && (
        <Alert severity="info" sx={{ mt: 4 }}>
          🤖 <strong>Boostez vos ventes !</strong> Signez un contrat d'exclusivité pour accéder à
          nos outils IA futurs (matching intelligent, estimation automatique, gestion d'agenda, etc.).
          Commission: 1.5% en cas de vente seulement.
        </Alert>
      )}
    </Box>
  );
}

/**
 * ONGLET 3 : MESSAGERIE
 */
function MessagerieTab() {
  const messages = [
    {
      id: 1,
      from: 'Marie Dupont',
      subject: 'Intéressée par votre appartement',
      preview: 'Bonjour, je suis très intéressée par votre appartement à Paris...',
      date: '15 mai 2026',
      unread: true,
    },
    {
      id: 2,
      from: 'Jean Martin',
      subject: 'Questions sur le bien',
      preview: 'Pourriez-vous me donner plus d\'informations sur le chauffage...',
      date: '14 mai 2026',
      unread: false,
    },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        💬 Messages
      </Typography>

      <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
        {messages.map((msg, idx) => (
          <React.Fragment key={msg.id}>
            <ListItemButton
              sx={{
                bgcolor: msg.unread ? 'action.hover' : 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <ListItemText
                primary={
                  <Typography sx={{ fontWeight: msg.unread ? 'bold' : 'normal' }}>
                    {msg.from}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {msg.subject}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {msg.preview}
                    </Typography>
                  </Box>
                }
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>
                {msg.date}
              </Typography>
            </ListItemButton>
            {idx < messages.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      {messages.length === 0 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Aucun message pour le moment
          </Typography>
        </Card>
      )}
    </Box>
  );
}

/**
 * COMPOSANT PRINCIPAL : DASHBOARD
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Récupérer l'onglet depuis l'URL (tab=achat, vente, messagerie)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'achat') setTabValue(0);
    else if (tabParam === 'vente') setTabValue(1);
    else if (tabParam === 'messagerie') setTabValue(2);
  }, [searchParams]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* En-tête */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            👋 Bienvenue, {user?.prenom} !
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Gérez vos annonces, recherches et messages en un seul endroit.
          </Typography>
        </Box>

        {/* Onglets */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontSize: '1rem',
                fontWeight: 500,
                textTransform: 'none',
              },
            }}
          >
            <Tab
              label="🛒 Achat"
              icon={<ShoppingBag />}
              iconPosition="start"
            />
            <Tab
              label="🏠 Vente"
              icon={<Home />}
              iconPosition="start"
            />
            <Tab
              label="💬 Messagerie"
              icon={<Message />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Contenu des onglets */}
        <TabPanel value={tabValue} index={0}>
          <AchatTab />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <VenteTab user={user} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <MessagerieTab />
        </TabPanel>
      </Box>
    </Container>
  );
}
