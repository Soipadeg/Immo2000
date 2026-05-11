/**
 * Page Guides - Guides immobiliers
 */

import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, Chip } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArticleIcon from '@mui/icons-material/Article';
import SchoolIcon from '@mui/icons-material/School';

const GuidesPage = () => {
  const guides = [
    {
      id: 1,
      title: 'Guide complet de l\'achat immobilier',
      description: 'Apprenez les étapes essentielles pour acheter une propriété en France',
      category: 'Achat',
      readTime: '15 min',
      topics: ['Financement', 'Offre d\'achat', 'Notaire', 'Diagnostic'],
    },
    {
      id: 2,
      title: 'Comment vendre votre propriété rapidement',
      description: 'Conseils pratiques pour mettre en vente et trouver l\'acheteur idéal',
      category: 'Vente',
      readTime: '12 min',
      topics: ['Pricing', 'Annonce', 'Visite', 'Négociation'],
    },
    {
      id: 3,
      title: 'Décryptage des diagnostics immobiliers',
      description: 'Comprendre les diagnostics obligatoires et leur importance',
      category: 'Diagnostic',
      readTime: '10 min',
      topics: ['DPE', 'Amiante', 'Plomb', 'Termites'],
    },
    {
      id: 4,
      title: 'Financement immobilier: tous les options',
      description: 'Explorez les différentes façons de financer votre acquisition',
      category: 'Financement',
      readTime: '18 min',
      topics: ['Prêt', 'PTZ', 'Rétro-simulation', 'Taux fixe'],
    },
    {
      id: 5,
      title: 'Les frais de notaire expliqués',
      description: 'Démystifiez le calcul des frais et découvrez comment les économiser',
      category: 'Frais',
      readTime: '8 min',
      topics: ['Calcul', 'Emoluments', 'Décote', 'Transparence'],
    },
    {
      id: 6,
      title: 'Investissement immobilier pour débutants',
      description: 'Stratégies et conseils pour débuter dans l\'investissement locatif',
      category: 'Investissement',
      readTime: '20 min',
      topics: ['ROI', 'Rentabilité', 'Impôts', 'Gestion'],
    },
  ];

  const getCategoryColor = (category) => {
    const colors = {
      Achat: 'primary',
      Vente: 'success',
      Diagnostic: 'warning',
      Financement: 'info',
      Frais: 'error',
      Investissement: 'secondary',
    };
    return colors[category] || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          📚 Guides Immobiliers
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Apprenez tout ce que vous devez savoir sur l'immobilier
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {guides.map((guide) => (
          <Grid item xs={12} sm={6} lg={4} key={guide.id}>
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
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MenuBookIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Chip
                    label={guide.category}
                    color={getCategoryColor(guide.category)}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Typography gutterBottom variant="h6" component="h3">
                  {guide.title}
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                  {guide.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {guide.topics.map((topic) => (
                    <Chip key={topic} label={topic} size="small" variant="outlined" />
                  ))}
                </Box>
                <Typography variant="caption" color="textSecondary">
                  ⏱️ Temps de lecture: {guide.readTime}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  Lire le guide →
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 8, p: 4, bgcolor: 'grey.100', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          📖 Vous voulez apprendre un autre sujet?
        </Typography>
        <Typography color="textSecondary" sx={{ mb: 3 }}>
          Nous ajoutons régulièrement de nouveaux guides pour vous aider
        </Typography>
        <Button variant="contained" color="primary" startIcon={<SchoolIcon />}>
          Suggérer un guide
        </Button>
      </Box>
    </Container>
  );
};

export default GuidesPage;
