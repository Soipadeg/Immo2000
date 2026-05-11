/**
 * Page Modèles - Modèles de documents immobiliers
 */

import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const ModelesPage = () => {
  const [openDialog, setOpenDialog] = useState(null);

  const modeles = [
    {
      id: 1,
      title: 'Offre d\'achat',
      description: 'Modèle d\'offre d\'achat simple et complet pour formuler votre proposition',
      format: 'PDF/Word',
      downloads: 2543,
      category: 'Achat',
      preview: 'Contient tous les éléments essentiels pour une offre valide',
    },
    {
      id: 2,
      title: 'Contrat de promesse de vente',
      description: 'Contrat de promesse unilatérale adaptable à votre situation',
      format: 'Word',
      downloads: 1834,
      category: 'Vente',
      preview: 'Document juridique à adapter avec l\'aide d\'un professionnel',
    },
    {
      id: 3,
      title: 'Checklist acheteur',
      description: 'Liste complète de vérifications avant d\'acheter un bien',
      format: 'PDF',
      downloads: 3120,
      category: 'Achat',
      preview: '50+ points à vérifier pour une achat en toute confiance',
    },
    {
      id: 4,
      title: 'Checklist vendeur',
      description: 'Préparation complète pour vendre votre propriété',
      format: 'PDF',
      downloads: 2856,
      category: 'Vente',
      preview: 'Tout ce qu\'il faut faire avant de mettre en vente',
    },
    {
      id: 5,
      title: 'Descriptif du bien',
      description: 'Modèle détaillé pour décrire votre propriété',
      format: 'Word',
      downloads: 1920,
      category: 'Vente',
      preview: 'Template pour rédiger une belle annonce',
    },
    {
      id: 6,
      title: 'Tableau d\'amortissement',
      description: 'Simulateur Excel pour calculer votre prêt',
      format: 'Excel',
      downloads: 2210,
      category: 'Financement',
      preview: 'Visualisez votre prêt mois par mois',
    },
  ];

  const handleOpenDialog = (modele) => {
    setOpenDialog(modele);
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
  };

  const getCategoryColor = (category) => {
    const colors = { Achat: 'primary', Vente: 'success', Financement: 'info' };
    return colors[category] || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          📄 Modèles de Documents
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Téléchargez les modèles de documents dont vous avez besoin
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {modeles.map((modele) => (
          <Grid item xs={12} sm={6} lg={4} key={modele.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DescriptionIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
                </Box>
                <Typography gutterBottom variant="h6" component="h3">
                  {modele.title}
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                  {modele.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip label={modele.format} size="small" variant="outlined" />
                  <Chip
                    label={modele.category}
                    size="small"
                    color={getCategoryColor(modele.category)}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="caption" color="textSecondary">
                  ⬇️ {modele.downloads.toLocaleString()} téléchargements
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleOpenDialog(modele)}
                  startIcon={<DownloadIcon />}
                >
                  Télécharger
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 8, p: 4, bgcolor: 'primary.light', borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          ⚖️ Avis légal important
        </Typography>
        <Typography color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Ces modèles sont fournis à titre informatif. Pour une transaction immobilière, nous
          recommandons de consulter un notaire ou un avocat spécialisé en droit immobilier.
        </Typography>
      </Box>

      {/* Dialog pour téléchargement */}
      <Dialog open={!!openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>📥 {openDialog?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Vous êtes sur le point de télécharger:
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, my: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {openDialog?.title}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Format: {openDialog?.format}
            </Typography>
          </Box>
          <Typography variant="body2">
            ℹ️ {openDialog?.preview}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button variant="contained" color="primary" startIcon={<FileDownloadIcon />}>
            Télécharger
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ModelesPage;
