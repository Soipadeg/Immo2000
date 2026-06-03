import '../styles/GuidesPage.css';
import { Alert,Button,Input } from '@/components';
/**
 * Page Guides - Guides immobiliers
 */

import React, { useState } from 'react';





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
    <div maxWidth="lg">
      <div>
        <div>
          📚 Guides Immobiliers
        </div>
        <div>
          Apprenez tout ce que vous devez savoir sur l'immobilier
        </div>
      </div>

      <div container spacing={3}>
        {guides.map((guide) => (
          <div item xs={12} sm={6} lg={4} key={guide.id}>
            <div
            >
              <div>
                <div>
                  <MenuBookIcon />
                  <div
                    label={guide.category}
                    color={getCategoryColor(guide.category)}
                    size="small"
                    variant="outlined"
                  />
                </div>
                <div>
                  {guide.title}
                </div>
                <div>
                  {guide.description}
                </div>
                <div>
                  {guide.topics.map((topic) => (
                    <div key={topic} label={topic} size="small" variant="outlined" />
                  ))}
                </div>
                <div>
                  ⏱️ Temps de lecture: {guide.readTime}
                </div>
              </div>
              <div>
                <Button size="small" color="primary">
                  Lire le guide →
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div>
          📖 Vous voulez apprendre un autre sujet?
        </div>
        <div>
          Nous ajoutons régulièrement de nouveaux guides pour vous aider
        </div>
        <Button variant="contained" color="primary" startIcon={<SchoolIcon />}>
          Suggérer un guide
        </Button>
      </div>
    </div>
  );
};

export default GuidesPage;
