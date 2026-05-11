/**
 * Page Historique - Biens consultés et annonces contactées
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContactMailIcon from '@mui/icons-material/ContactMail';

const HistoryPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const viewedAnnonces = [
    { id: 1, titre: 'Maison avec jardin', ville: 'Paris', date: '2026-05-11', prix: 450000, type: 'Maison' },
    { id: 2, titre: 'Appartement moderne', ville: 'Lyon', date: '2026-05-10', prix: 350000, type: 'Appartement' },
    { id: 3, titre: 'Studio en centre-ville', ville: 'Marseille', date: '2026-05-09', prix: 150000, type: 'Studio' },
  ];

  const contactedAnnonces = [
    { id: 1, titre: 'Maison avec jardin', ville: 'Paris', dateContact: '2026-05-11', statut: 'En attente', vendeur: 'Jean D.' },
    { id: 2, titre: 'Villa luxe', ville: 'Côte d\'Azur', dateContact: '2026-05-08', statut: 'Répondu', vendeur: 'Marie L.' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        📋 Historique
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`Biens consultés (${viewedAnnonces.length})`} icon={<VisibilityIcon />} iconPosition="start" />
            <Tab label={`Annonces contactées (${contactedAnnonces.length})`} icon={<ContactMailIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Onglet 1: Biens consultés */}
        {tabValue === 0 && (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell>Annonce</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Localité</TableCell>
                  <TableCell>Prix</TableCell>
                  <TableCell>Date de visite</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewedAnnonces.map((annonce) => (
                  <TableRow key={annonce.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {annonce.titre}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={annonce.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{annonce.ville}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {annonce.prix.toLocaleString()}€
                    </TableCell>
                    <TableCell>{new Date(annonce.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <Button size="small" color="primary" href={`/annonce/${annonce.id}`}>
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Onglet 2: Annonces contactées */}
        {tabValue === 1 && (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell>Annonce</TableCell>
                  <TableCell>Localité</TableCell>
                  <TableCell>Vendeur</TableCell>
                  <TableCell>Date de contact</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contactedAnnonces.map((annonce) => (
                  <TableRow key={annonce.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {annonce.titre}
                      </Typography>
                    </TableCell>
                    <TableCell>{annonce.ville}</TableCell>
                    <TableCell>{annonce.vendeur}</TableCell>
                    <TableCell>{new Date(annonce.dateContact).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <Chip
                        label={annonce.statut}
                        size="small"
                        color={annonce.statut === 'Répondu' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" color="primary">
                        Voir messages
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {(tabValue === 0 && viewedAnnonces.length === 0) || (tabValue === 1 && contactedAnnonces.length === 0) ? (
        <Card sx={{ textAlign: 'center', py: 6, mt: 2 }}>
          <Typography variant="h6" color="textSecondary">
            {tabValue === 0 ? 'Aucun bien consulté pour le moment' : 'Aucune annonce contactée pour le moment'}
          </Typography>
          <Button variant="contained" color="primary" href="/search" sx={{ mt: 2 }}>
            Consulter les annonces
          </Button>
        </Card>
      ) : null}
    </Container>
  );
};

export default HistoryPage;
